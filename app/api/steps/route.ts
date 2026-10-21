import { NextResponse } from "next/server";
import { demoTtlSeconds, requireSession } from "@/lib/api";
import { DEMO_DAILY_LIMIT } from "@/lib/auth";
import { getStore } from "@/lib/store";
import { runTool } from "@/lib/tools";
import { stateView } from "@/lib/views";

export async function POST(req: Request) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { session } = auth;

  const body = (await req.json().catch(() => ({}))) as { steps?: number; date?: string };
  const steps = Number(body.steps);
  if (!Number.isFinite(steps) || steps < 0 || steps > 200000) {
    return NextResponse.json({ error: "Bad step count" }, { status: 400 });
  }

  const store = getStore();
  const state = await store.load(session.userId);
  runTool(state, "set_steps", { steps, date: body.date });
  await store.save(session.userId, state, demoTtlSeconds(session));
  return NextResponse.json({ view: stateView(state, session.kind, DEMO_DAILY_LIMIT) });
}
