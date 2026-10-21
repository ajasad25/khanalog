import { NextResponse } from "next/server";
import { demoCookie, demoEnabled, newDemoUserId } from "@/lib/auth";
import { getStore } from "@/lib/store";

export async function POST() {
  if (!demoEnabled()) return NextResponse.json({ error: "Demo is disabled" }, { status: 403 });
  // Opportunistic housekeeping: drop sandboxes past their expiry.
  await getStore().cleanupExpired().catch((e) => console.warn("[demo] cleanup failed", e));
  const res = NextResponse.json({ ok: true });
  res.cookies.set(demoCookie(newDemoUserId()));
  return res;
}
