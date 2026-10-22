"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client";

export function DemoButton({ className = "btn-secondary", label = "Try the demo" }: { className?: string; label?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startDemo() {
    setBusy(true);
    setError(null);
    try {
      await api("/api/auth/demo", { method: "POST" });
      router.push("/chat");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demo unavailable");
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-col">
      <button type="button" onClick={startDemo} disabled={busy} className={className}>
        {busy ? "Setting up…" : label}
      </button>
      {error && <span className="mt-1 text-xs text-bark">{error}</span>}
    </span>
  );
}
