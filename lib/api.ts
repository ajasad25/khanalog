import { NextResponse } from "next/server";
import { getSession, type Session } from "./auth";

/** Resolve the session or produce the 401 the route should return. */
export async function requireSession(): Promise<{ session: Session } | { error: NextResponse }> {
  const session = await getSession();
  if (!session) return { error: NextResponse.json({ error: "Not signed in" }, { status: 401 }) };
  return { session };
}

export function demoTtlSeconds(session: Session): number | undefined {
  return session.kind === "demo" ? 7 * 24 * 60 * 60 : undefined;
}
