import { promises as fs } from "fs";
import path from "path";
import { Redis } from "@upstash/redis";
import { neonSql, type Row, type Sql } from "./db";
import { shiftDay } from "./dates";
import { emptyState, type BurnEntry, type ChatMessage, type DayLog, type FoodEntry, type UserState } from "./types";

/**
 * Persistence layer. The agent and tools work on an in-memory UserState; the
 * store loads it and saves it back. Three backends, picked from env:
 *
 * - Postgres (Neon) when DATABASE_URL is set. Production.
 * - Upstash Redis when its env vars are set. One JSON doc per user.
 * - Local JSON files under .data/ otherwise, for `npm run chat` and dev.
 */

export interface Store {
  load(userId: string): Promise<UserState>;
  /** `ttlSeconds` lets throwaway (demo) users expire on their own. */
  save(userId: string, state: UserState, ttlSeconds?: number): Promise<void>;
  /** Remove expired demo users. No-op on backends that expire keys natively. */
  cleanupExpired(): Promise<void>;
}

/** Days of history loaded into memory per request. Older rows stay in the DB untouched. */
const LOADED_DAYS = 120;
const LOADED_MESSAGES = 60;

function withDefaults(raw: Partial<UserState> | null | undefined): UserState {
  const base = emptyState();
  if (!raw) return base;
  return {
    profile: raw.profile ?? base.profile,
    goal: raw.goal ?? base.goal,
    foods: raw.foods ?? base.foods,
    days: raw.days ?? base.days,
    history: raw.history ?? base.history,
    usage: raw.usage,
  };
}

// ---------------------------------------------------------------------------
// Postgres

export class PostgresStore implements Store {
  constructor(private sql: Sql) {}

  async load(userId: string): Promise<UserState> {
    const [user] = await this.sql(`SELECT profile, goal, foods, usage FROM users WHERE id = $1`, [userId]);
    if (!user) return emptyState();

    const since = shiftDay(new Date().toISOString().slice(0, 10), -LOADED_DAYS);

    const dayRows = await this.sql(
      `SELECT to_char(day, 'YYYY-MM-DD') AS day, steps FROM days WHERE user_id = $1 AND day >= $2::date`,
      [userId, since],
    );
    const entryRows = await this.sql(
      `SELECT to_char(day, 'YYYY-MM-DD') AS day, kind, name, calories, quantity, logged_at
         FROM entries WHERE user_id = $1 AND day >= $2::date ORDER BY day, position`,
      [userId, since],
    );
    const msgRows = await this.sql(
      `SELECT role, content, sent_at FROM (
         SELECT role, content, sent_at, id FROM messages WHERE user_id = $1 ORDER BY id DESC LIMIT $2
       ) m ORDER BY id`,
      [userId, LOADED_MESSAGES],
    );

    const days: Record<string, DayLog> = {};
    const day = (k: string) => (days[k] ??= { intake: [], burned: [] });
    for (const r of dayRows) {
      const d = day(String(r.day));
      if (r.steps !== null && r.steps !== undefined) d.steps = Number(r.steps);
    }
    for (const r of entryRows) {
      const d = day(String(r.day));
      const time = toIso(r.logged_at);
      if (r.kind === "burned") {
        d.burned.push({ time, activity: String(r.name), calories: Number(r.calories) } satisfies BurnEntry);
      } else {
        d.intake.push({
          time,
          name: String(r.name),
          calories: Number(r.calories),
          quantity: r.quantity ? String(r.quantity) : undefined,
        } satisfies FoodEntry);
      }
    }

    return withDefaults({
      profile: asObject(user.profile),
      goal: asObject(user.goal),
      foods: asObject(user.foods),
      usage: user.usage ? asObject(user.usage) : undefined,
      days,
      history: msgRows.map(
        (r) => ({ role: r.role as ChatMessage["role"], content: String(r.content), time: toIso(r.sent_at) }) satisfies ChatMessage,
      ),
    });
  }

  async save(userId: string, state: UserState, ttlSeconds?: number): Promise<void> {
    const kind = userId.startsWith("demo:") ? "demo" : "user";
    const expiresAt = ttlSeconds ? new Date(Date.now() + ttlSeconds * 1000).toISOString() : null;

    await this.sql(
      `INSERT INTO users (id, kind, profile, goal, foods, usage, expires_at)
       VALUES ($1, $2, $3::jsonb, $4::jsonb, $5::jsonb, $6::jsonb, $7)
       ON CONFLICT (id) DO UPDATE SET
         profile = EXCLUDED.profile, goal = EXCLUDED.goal, foods = EXCLUDED.foods,
         usage = EXCLUDED.usage, expires_at = EXCLUDED.expires_at, updated_at = now()`,
      [
        userId,
        kind,
        JSON.stringify(state.profile),
        JSON.stringify(state.goal),
        JSON.stringify(state.foods),
        state.usage ? JSON.stringify(state.usage) : null,
        expiresAt,
      ],
    );

    // Rewrite only the days present in memory; older days in the DB are untouched.
    for (const [key, log] of Object.entries(state.days)) {
      await this.sql(
        `INSERT INTO days (user_id, day, steps) VALUES ($1, $2::date, $3)
         ON CONFLICT (user_id, day) DO UPDATE SET steps = EXCLUDED.steps`,
        [userId, key, log.steps ?? null],
      );
      await this.sql(`DELETE FROM entries WHERE user_id = $1 AND day = $2::date`, [userId, key]);
      const rows: unknown[][] = [
        ...log.intake.map((e, i) => [userId, key, "food", e.name, e.calories, e.quantity ?? null, e.time, i]),
        ...log.burned.map((e, i) => [userId, key, "burned", e.activity, e.calories, null, e.time, log.intake.length + i]),
      ];
      for (const r of rows) {
        await this.sql(
          `INSERT INTO entries (user_id, day, kind, name, calories, quantity, logged_at, position)
           VALUES ($1, $2::date, $3, $4, $5, $6, $7, $8)`,
          r,
        );
      }
    }

    // Conversation: keep only what the state holds.
    await this.sql(`DELETE FROM messages WHERE user_id = $1`, [userId]);
    for (const m of state.history) {
      await this.sql(`INSERT INTO messages (user_id, role, content, sent_at) VALUES ($1, $2, $3, $4)`, [
        userId,
        m.role,
        m.content,
        m.time,
      ]);
    }
  }

  async cleanupExpired(): Promise<void> {
    await this.sql(`DELETE FROM users WHERE kind = 'demo' AND expires_at IS NOT NULL AND expires_at < now()`);
  }

  /** Create tables if they don't exist. Used by `npm run db:push` and tests. */
  async migrate(): Promise<void> {
    const schema = await fs.readFile(path.join(process.cwd(), "db", "schema.sql"), "utf8");
    const withoutComments = schema.replace(/--[^\n]*/g, "");
    for (const stmt of withoutComments.split(";").map((s) => s.trim()).filter(Boolean)) {
      await this.sql(stmt);
    }
  }
}

function asObject<T>(v: unknown): T {
  if (typeof v === "string") return JSON.parse(v) as T;
  return (v ?? {}) as T;
}

function toIso(v: unknown): string {
  if (v instanceof Date) return v.toISOString();
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

// ---------------------------------------------------------------------------
// Upstash Redis

const KEY_PREFIX = "khanalog:user:";

class RedisStore implements Store {
  constructor(private redis: Redis) {}

  async load(userId: string): Promise<UserState> {
    const raw = await this.redis.get<Partial<UserState>>(KEY_PREFIX + userId);
    return withDefaults(raw);
  }

  async save(userId: string, state: UserState, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) await this.redis.set(KEY_PREFIX + userId, state, { ex: ttlSeconds });
    else await this.redis.set(KEY_PREFIX + userId, state);
  }

  async cleanupExpired(): Promise<void> {
    /* Redis expires keys itself. */
  }
}

// ---------------------------------------------------------------------------
// Local JSON files

class FileStore implements Store {
  private dir = path.join(process.cwd(), ".data");

  private file(userId: string) {
    const safe = userId.replace(/[^a-z0-9+_-]/gi, "_");
    return path.join(this.dir, `${safe}.json`);
  }

  async load(userId: string): Promise<UserState> {
    try {
      const text = await fs.readFile(this.file(userId), "utf8");
      return withDefaults(JSON.parse(text));
    } catch {
      return emptyState();
    }
  }

  async save(userId: string, state: UserState): Promise<void> {
    await fs.mkdir(this.dir, { recursive: true });
    await fs.writeFile(this.file(userId), JSON.stringify(state, null, 2));
  }

  async cleanupExpired(): Promise<void> {
    /* Local dev only; nothing to expire. */
  }
}

// ---------------------------------------------------------------------------

let store: Store | null = null;

export function getStore(): Store {
  if (store) return store;

  if (process.env.DATABASE_URL) {
    store = new PostgresStore(neonSql(process.env.DATABASE_URL));
    return store;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (url && token) {
    store = new RedisStore(new Redis({ url, token }));
    return store;
  }

  if (process.env.VERCEL) {
    throw new Error("No database configured. Set DATABASE_URL (Neon) or add Upstash Redis from the Vercel Storage tab.");
  }
  console.warn("[store] No DATABASE_URL or Upstash env vars; using local .data/ files.");
  store = new FileStore();
  return store;
}

/** Silence the unused-import check for Row when tree-shaken. */
export type { Row };
