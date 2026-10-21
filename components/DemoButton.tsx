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
    <div className="mt-4">
      <div className="my-4 flex items-center gap-3 text-xs text-stone-400">
        <span className="h-px flex-1 bg-stone-200 dark:bg-stone-800" />
        or
        <span className="h-px flex-1 bg-stone-200 dark:bg-stone-800" />
      </div>
      <button
        type="button"
        onClick={startDemo}
        disabled={busy}
        className="w-full rounded-2xl border border-stone-300 px-4 py-3 font-medium transition active:scale-[0.98] disabled:opacity-50 dark:border-stone-700"
      >
        {busy ? "Setting up…" : "Try the demo without an account"}
      </button>
      <p className="mt-2 text-center text-xs text-stone-400">A private sandbox, limited messages per day, deleted after a week.</p>
      {error && <p className="mt-3 text-center text-sm text-red-600">{error}</p>}
    </div>
  );
}
