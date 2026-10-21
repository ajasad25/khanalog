import { NextResponse } from "next/server";
import { handleMessage, QuotaExceededError } from "@/lib/agent";
import { requireSession } from "@/lib/api";
import { DEMO_DAILY_LIMIT } from "@/lib/auth";
import { getStore } from "@/lib/store";
import { stateView } from "@/lib/views";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

export async function POST(req: Request) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { session } = auth;

  const body = (await req.json().catch(() => ({}))) as { text?: string; imageUrl?: string };
  const text = typeof body.text === "string" ? body.text.trim().slice(0, 2000) : "";
  const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl : undefined;

  if (!text && !imageUrl) return NextResponse.json({ error: "Empty message" }, { status: 400 });
  if (imageUrl && (!imageUrl.startsWith("data:image/") || imageUrl.length > MAX_IMAGE_BYTES * 1.4)) {
    return NextResponse.json({ error: "Image must be a data URL under 3 MB" }, { status: 400 });
  }

  try {
    const reply = await handleMessage(
      session.userId,
      { text, imageUrl },
      { dailyLimit: session.kind === "demo" ? DEMO_DAILY_LIMIT : undefined },
    );
    const state = await getStore().load(session.userId);
    return NextResponse.json({ reply, view: stateView(state, session.kind, DEMO_DAILY_LIMIT) });
  } catch (err) {
    if (err instanceof QuotaExceededError) {
      return NextResponse.json(
        { error: `Demo limit reached (${err.limit} messages/day). Come back tomorrow!` },
        { status: 429 },
      );
    }
    console.error("[chat]", err);
    return NextResponse.json({ error: "The assistant hit an error. Try again." }, { status: 500 });
  }
}
