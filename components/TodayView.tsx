"use client";

import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { useEffect, useState } from "react";
import { api, fmt, type StateView } from "@/lib/client";
import { WeekChart } from "./WeekChart";

export function TodayView() {
  const [view, setView] = useState<StateView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState("");
  const [savingSteps, setSavingSteps] = useState(false);

  useEffect(() => {
    api<StateView>("/api/state")
      .then((v) => {
        setView(v);
        setSteps(v.today.steps ? String(v.today.steps) : "");
      })
      .catch((e) => setError(e.message));
  }, []);

  async function remove(kind: "food" | "burned", index: number) {
    if (!view) return;
    const prev = view;
    const next = structuredClone(view);
    (kind === "food" ? next.today.intake : next.today.burned).splice(index, 1);
    setView(next);
    try {
      const res = await api<{ view: StateView }>("/api/entries", {
        method: "DELETE",
        body: JSON.stringify({ kind, index, date: view.today.date }),
      });
      setView(res.view);
    } catch (e) {
      setView(prev);
      setError(e instanceof Error ? e.message : "Could not delete");
    }
  }

  async function saveSteps() {
    const n = Number(steps);
    if (!Number.isFinite(n)) return;
    setSavingSteps(true);
    try {
      const res = await api<{ view: StateView }>("/api/steps", { method: "POST", body: JSON.stringify({ steps: n }) });
      setView(res.view);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save steps");
    } finally {
      setSavingSteps(false);
    }
  }

  if (!view) {
    return <div className="grid h-full place-items-center text-sm text-muted">{error ?? "Loading…"}</div>;
  }

  const t = view.today;
  const goal = t.goal;
  const ratio = goal ? Math.min(1.25, Math.max(0, t.eaten / goal)) : 0;
  const R = 54;
  const C = 2 * Math.PI * R;

  return (
    <div className="scrollbar-none h-full overflow-y-auto bg-surface px-4 pt-[max(14px,env(safe-area-inset-top))] pb-6">
      <h1 className="text-[22px] font-semibold tracking-tight">Today</h1>
      <p className="text-[12px] text-muted">
        {new Date(`${t.date}T00:00:00`).toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" })}
      </p>

      {error && <p className="mt-2 text-[12px] text-over">{error}</p>}

      {/* Ring + numbers */}
      <div className="mt-4 flex items-center gap-5 rounded-3xl border border-line bg-card p-4">
        <div className="relative h-32 w-32 shrink-0">
          <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
            <circle cx="64" cy="64" r={R} fill="none" strokeWidth="10" className="stroke-card-2" />
            <motion.circle
              cx="64"
              cy="64"
              r={R}
              fill="none"
              strokeWidth="10"
              strokeLinecap="round"
              className={ratio > 1 ? "stroke-over" : "stroke-caramel"}
              strokeDasharray={C}
              initial={{ strokeDashoffset: C }}
              animate={{ strokeDashoffset: C * (1 - Math.min(1, ratio)) }}
              transition={{ type: "spring", stiffness: 60, damping: 16 }}
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center text-center">
            <div>
              <div className="text-[22px] font-semibold tabular-nums leading-none">{fmt(t.eaten)}</div>
              <div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-muted">eaten</div>
            </div>
          </div>
        </div>
        <dl className="flex-1 space-y-2 text-sm">
          <Row label="Goal" value={goal ? fmt(goal) : "not set"} />
          <Row label="Eaten" value={fmt(t.eaten)} />
          <Row label="Burned" value={fmt(t.burnedExercise + t.burnedSteps)} />
          <Row label="Remaining" value={goal ? fmt(t.remaining) : "–"} strong danger={goal !== null && (t.remaining ?? 0) < 0} />
        </dl>
      </div>

      {/* Steps */}
      <div className="mt-3 flex items-center gap-2.5 rounded-3xl border border-line bg-card p-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-card-2 text-cocoa">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="13" cy="4" r="1.5" />
            <path d="M10 21l2-6 3 2v4M8 13l2-5 4 1 2 4M13 7l-1.5 5" />
          </svg>
        </span>
        <input
          type="number"
          inputMode="numeric"
          value={steps}
          onChange={(e) => setSteps(e.target.value)}
          placeholder="Steps today"
          className="field h-10 min-w-0 flex-1"
        />
        <span className="shrink-0 text-[12px] text-muted tabular-nums">≈ {fmt(t.burnedSteps)} kcal</span>
        <button
          onClick={saveSteps}
          disabled={savingSteps}
          className="h-10 shrink-0 rounded-2xl bg-primary px-3.5 text-sm font-medium text-on-primary disabled:opacity-50"
        >
          Save
        </button>
      </div>

      {/* Week */}
      <section className="mt-6">
        <h2 className="eyebrow mb-2">Last 7 days</h2>
        <div className="rounded-3xl border border-line bg-card p-3">
          <WeekChart days={view.week} goal={goal} />
        </div>
      </section>

      {/* Food log */}
      <section className="mt-6">
        <h2 className="eyebrow mb-2">Eaten</h2>
        <EntryList
          empty="Nothing logged yet. Tell the assistant what you ate."
          items={t.intake.map((e) => ({ title: e.name, sub: e.quantity, kcal: e.calories }))}
          onRemove={(i) => remove("food", i)}
        />
      </section>

      {t.burned.length > 0 && (
        <section className="mt-6">
          <h2 className="eyebrow mb-2">Workouts</h2>
          <EntryList empty="" items={t.burned.map((e) => ({ title: e.activity, kcal: -e.calories }))} onRemove={(i) => remove("burned", i)} />
        </section>
      )}
      <p className="mt-4 text-center text-[11px] text-muted">Swipe an entry left to delete it.</p>
    </div>
  );
}

function Row({ label, value, strong, danger }: { label: string; value: string; strong?: boolean; danger?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted">{label}</dt>
      <dd className={`tabular-nums ${strong ? "font-semibold" : ""} ${danger ? "text-over" : ""}`}>{value}</dd>
    </div>
  );
}

function EntryList({
  items,
  empty,
  onRemove,
}: {
  items: { title: string; sub?: string; kcal: number }[];
  empty: string;
  onRemove: (index: number) => void;
}) {
  if (items.length === 0) {
    return <p className="rounded-3xl border border-dashed border-line p-4 text-center text-[12px] text-muted">{empty}</p>;
  }
  return (
    <ul className="space-y-1.5">
      <AnimatePresence initial={false}>
        {items.map((it, i) => (
          <SwipeRow key={`${it.title}-${i}`} onDelete={() => onRemove(i)}>
            <div className="flex items-center justify-between rounded-2xl border border-line bg-card px-4 py-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium capitalize">{it.title}</div>
                {it.sub && <div className="text-[11px] text-muted">{it.sub}</div>}
              </div>
              <div className="ml-3 shrink-0 text-sm tabular-nums">
                {it.kcal < 0 ? "−" : ""}
                {fmt(Math.abs(it.kcal))} <span className="text-[10px] text-muted">kcal</span>
              </div>
            </div>
          </SwipeRow>
        ))}
      </AnimatePresence>
    </ul>
  );
}

function SwipeRow({ children, onDelete }: { children: React.ReactNode; onDelete: () => void }) {
  function onEnd(_: unknown, info: PanInfo) {
    if (info.offset.x < -90) onDelete();
  }
  return (
    <motion.li layout exit={{ opacity: 0, height: 0, marginBottom: 0 }} className="relative overflow-hidden rounded-2xl">
      <div className="absolute inset-y-0 right-0 flex w-24 items-center justify-end bg-over pr-4 text-[12px] font-medium text-on-primary">
        Delete
      </div>
      <motion.div
        drag="x"
        dragConstraints={{ left: -110, right: 0 }}
        dragElastic={0.1}
        dragSnapToOrigin
        onDragEnd={onEnd}
        className="relative bg-surface"
      >
        {children}
      </motion.div>
    </motion.li>
  );
}
