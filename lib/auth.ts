import { auth } from "@clerk/nextjs/server";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

/**
 * Two kinds of users:
 *  - "user": signed in with Clerk (email / Google). Their Clerk id is the key.
 *  - "demo": a throwaway sandbox for portfolio visitors, rate limited, expires.
 *
 * Demo sessions are an HMAC-signed id in a cookie; real sessions are Clerk's.
 */

export const SESSION_COOKIE = "cb_demo";
const DEMO_SESSION_DAYS = 7;

export type Session = { userId: string; kind: "user" | "demo" };

function secret(): string {
  const s = process.env.APP_SECRET || process.env.CLERK_SECRET_KEY;
  if (!s) throw new Error("APP_SECRET (or CLERK_SECRET_KEY) is not set");
  return s;
}

function sign(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

export function encodeDemoSession(userId: string): string {
  return `${userId}.${sign(userId)}`;
}

export function decodeDemoSession(token: string | undefined): Session | null {
  if (!token) return null;
  const i = token.lastIndexOf(".");
  if (i <= 0) return null;
  const userId = token.slice(0, i);
  const sig = token.slice(i + 1);
  const expected = sign(userId);
  if (sig.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  if (!userId.startsWith("demo:")) return null;
  return { userId, kind: "demo" };
}

export async function getSession(): Promise<Session | null> {
  const { userId } = await auth();
  if (userId) return { userId: `user:${userId}`, kind: "user" };
  const jar = await cookies();
  return decodeDemoSession(jar.get(SESSION_COOKIE)?.value);
}

export function demoCookie(userId: string) {
  return {
    name: SESSION_COOKIE,
    value: encodeDemoSession(userId),
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DEMO_SESSION_DAYS * 24 * 60 * 60,
  };
}

export function demoEnabled(): boolean {
  return process.env.DEMO_ENABLED === "true";
}

export function newDemoUserId(): string {
  return `demo:${randomBytes(8).toString("hex")}`;
}

/** Messages a demo visitor may send per day before being cut off. */
export const DEMO_DAILY_LIMIT = Number(process.env.DEMO_DAILY_LIMIT || 25);
