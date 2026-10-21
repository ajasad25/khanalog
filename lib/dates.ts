const DEFAULT_TZ = process.env.DEFAULT_TIMEZONE || "Asia/Karachi";

/** YYYY-MM-DD for "now" (or a given instant) in the user's timezone. */
export function dayKey(timezone?: string, at: Date = new Date()): string {
  const tz = timezone || DEFAULT_TZ;
  try {
    // en-CA formats as YYYY-MM-DD.
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(at);
  } catch {
    return at.toISOString().slice(0, 10);
  }
}

/** Shift a YYYY-MM-DD key by N days (negative for past). */
export function shiftDay(key: string, days: number): string {
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Resolve what the model passed as a date ("today", "yesterday", "2026-10-20")
 * into a day key. Anything unrecognised falls back to today.
 */
export function resolveDay(input: string | undefined, timezone?: string): string {
  const today = dayKey(timezone);
  if (!input) return today;
  const s = input.trim().toLowerCase();
  if (s === "today") return today;
  if (s === "yesterday") return shiftDay(today, -1);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return today;
}

export function localTimeString(timezone?: string, at: Date = new Date()): string {
  const tz = timezone || DEFAULT_TZ;
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(at);
  } catch {
    return at.toISOString();
  }
}
