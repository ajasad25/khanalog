import { NextResponse } from "next/server";
import { demoTtlSeconds, requireSession } from "@/lib/api";
import { DEMO_DAILY_LIMIT } from "@/lib/auth";
import { getStore } from "@/lib/store";
import { recalculateGoal, runTool } from "@/lib/tools";
import { stateView } from "@/lib/views";

const PROFILE_FIELDS = ["weightKg", "heightCm", "age", "sex", "activity", "goalMode", "timezone"] as const;

export async function PATCH(req: Request) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { session } = auth;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const store = getStore();
  const state = await store.load(session.userId);

  const profileArgs: Record<string, unknown> = {};
  for (const f of PROFILE_FIELDS) {
    if (body[f] !== undefined && body[f] !== "" && body[f] !== null) profileArgs[f] = body[f];
  }
  if (Object.keys(profileArgs).length) runTool(state, "set_profile", profileArgs);

  // dailyGoal: number = manual target; null = go back to the calculated one.
  if (body.dailyGoal === null) {
    state.goal = { source: null };
    recalculateGoal(state);
  } else if (typeof body.dailyGoal === "number" && body.dailyGoal > 0) {
    runTool(state, "set_goal", { dailyCalories: body.dailyGoal });
  }

  // foods: full replacement of the taught-foods map.
  if (body.foods && typeof body.foods === "object") {
    const next: Record<string, number> = {};
    for (const [k, v] of Object.entries(body.foods as Record<string, unknown>)) {
      const n = Number(v);
      if (k.trim() && Number.isFinite(n) && n >= 0) next[k.trim().toLowerCase()] = Math.round(n);
    }
    state.foods = next;
  }

  await store.save(session.userId, state, demoTtlSeconds(session));
  return NextResponse.json({ view: stateView(state, session.kind, DEMO_DAILY_LIMIT) });
}
