import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api";
import { DEMO_DAILY_LIMIT } from "@/lib/auth";
import { getStore } from "@/lib/store";
import { stateView } from "@/lib/views";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const state = await getStore().load(auth.session.userId);
  return NextResponse.json(stateView(state, auth.session.kind, DEMO_DAILY_LIMIT));
}
