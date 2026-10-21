"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client";

export function DemoButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startDemo() {
    setBusy(true);
    setError(null);
    try {
      await api("/api/auth/demo", { method: "POST" });
      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demo unavailable");
      setBusy(false);
    }
  }

  return (
    <div className="mt-5">
      <div className="my-4 flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-muted">
        <span className="h-px flex-1 bg-line" />
        or
        <span className="h-px flex-1 bg-line" />
      </div>
      <button
        type="button"
        onClick={startDemo}
        disabled={busy}
        className="w-full rounded-2xl border border-cocoa/30 bg-card px-4 py-3.5 text-[15px] font-medium text-ink transition hover:bg-card-2 active:scale-[0.98] disabled:opacity-50"
      >
        {busy ? "Setting up…" : "Try the demo without an account"}
      </button>
      <p className="mt-2.5 text-center text-[12px] text-muted">A private sandbox. Limited messages per day, deleted after a week.</p>
      {error && <p className="mt-3 text-center text-sm text-over">{error}</p>}
    </div>
  );
}
