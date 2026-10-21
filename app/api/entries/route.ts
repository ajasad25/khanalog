import { NextResponse } from "next/server";
import { demoTtlSeconds, requireSession } from "@/lib/api";
import { DEMO_DAILY_LIMIT } from "@/lib/auth";
import { resolveDay } from "@/lib/dates";
import { getStore } from "@/lib/store";
import { removeEntry } from "@/lib/tools";
import { stateView } from "@/lib/views";

export async function DELETE(req: Request) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { session } = auth;

  const body = (await req.json().catch(() => ({}))) as { date?: string; kind?: string; index?: number };
  const kind = body.kind === "burned" ? "burned" : "food";
  const index = Number(body.index);
  if (!Number.isInteger(index)) return NextResponse.json({ error: "Bad index" }, { status: 400 });

  const store = getStore();
  const state = await store.load(session.userId);
  const key = resolveDay(body.date, state.profile.timezone);
  if (!removeEntry(state, key, kind, index)) {
    return NextResponse.json({ error: "No such entry" }, { status: 404 });
  }
  await store.save(session.userId, state, demoTtlSeconds(session));
  return NextResponse.json({ view: stateView(state, session.kind, DEMO_DAILY_LIMIT) });
}
