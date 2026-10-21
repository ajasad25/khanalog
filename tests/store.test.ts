import assert from "node:assert/strict";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import type { Sql } from "../lib/db";
import { PostgresStore } from "../lib/store";
import { runTool } from "../lib/tools";
import { emptyState } from "../lib/types";

/** The Postgres store against an in-process Postgres (PGlite), no server needed. */
async function makeStore() {
  const pg = new PGlite();
  const sql: Sql = async (text, params = []) => (await pg.query(text, params as unknown[])).rows as Record<string, unknown>[];
  const store = new PostgresStore(sql);
  await store.migrate();
  return { store, sql };
}

test("postgres store round-trips a full user state", async () => {
  const { store } = await makeStore();

  const state = emptyState();
  runTool(state, "set_profile", { weightKg: 62, heightCm: 160, age: 25, sex: "female", activity: "light", goalMode: "lose", timezone: "Asia/Karachi" });
  runTool(state, "teach_food", { name: "chai", calories: 90 });
  runTool(state, "log_food", { name: "chai", calories: 120, quantity: "1 cup" });
  runTool(state, "log_food", { name: "paratha", calories: 250 });
  runTool(state, "log_burned", { activity: "gym", calories: 200 });
  runTool(state, "set_steps", { steps: 6000 });
  runTool(state, "log_food", { name: "yesterday snack", calories: 100, date: "yesterday" });
  state.history.push({ role: "user", content: "hi", time: new Date().toISOString() }, { role: "assistant", content: "hello", time: new Date().toISOString() });
  state.usage = { date: "2026-10-21", count: 3 };

  await store.save("user:abc", state);
  const loaded = await store.load("user:abc");

  assert.deepEqual(loaded.profile, state.profile);
  assert.deepEqual(loaded.goal, state.goal);
  assert.deepEqual(loaded.foods, { chai: 90 });
  assert.deepEqual(loaded.usage, state.usage);
  assert.equal(Object.keys(loaded.days).length, 2);

  const [todayKey] = Object.keys(state.days).sort().reverse();
  const today = loaded.days[todayKey];
  assert.equal(today.steps, 6000);
  assert.deepEqual(today.intake.map((e) => [e.name, e.calories, e.quantity]), [["chai", 90, "1 cup"], ["paratha", 250, undefined]]);
  assert.deepEqual(today.burned.map((e) => [e.activity, e.calories]), [["gym", 200]]);
  assert.deepEqual(loaded.history.map((m) => m.content), ["hi", "hello"]);
});

test("postgres store: saving again replaces the day's entries, not duplicates them", async () => {
  const { store } = await makeStore();
  const state = emptyState();
  runTool(state, "log_food", { name: "chai", calories: 120 });
  await store.save("user:x", state);

  const again = await store.load("user:x");
  runTool(again, "delete_last_entry", { kind: "food" });
  runTool(again, "log_food", { name: "coffee", calories: 5 });
  await store.save("user:x", again);

  const final = await store.load("user:x");
  const [key] = Object.keys(final.days);
  assert.deepEqual(final.days[key].intake.map((e) => e.name), ["coffee"]);
});

test("postgres store: unknown user loads as empty, demo users expire", async () => {
  const { store, sql } = await makeStore();
  assert.deepEqual(await store.load("user:nobody"), emptyState());

  const demo = emptyState();
  runTool(demo, "log_food", { name: "chai", calories: 120 });
  await store.save("demo:1", demo, 60); // expires in a minute
  await store.save("demo:2", demo, 60);
  // Force demo:1 into the past.
  await sql(`UPDATE users SET expires_at = now() - interval '1 hour' WHERE id = 'demo:1'`);

  await store.cleanupExpired();
  const left = await sql(`SELECT id FROM users ORDER BY id`);
  assert.deepEqual(left.map((r) => r.id), ["demo:2"]);
  // Cascade removed the entries too.
  const entries = await sql(`SELECT count(*)::int AS n FROM entries WHERE user_id = 'demo:1'`);
  assert.equal(entries[0].n, 0);
});
