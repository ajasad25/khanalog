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
    // Optimistic removal.
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
    return (
      <div className="grid h-full place-items-center text-sm text-stone-400">{error ?? "Loading…"}</div>
    );
  }

  const t = view.today;
  const goal = t.goal;
  const ratio = goal ? Math.min(1.25, Math.max(0, t.eaten / goal)) : 0;
  const R = 54;
  const C = 2 * Math.PI * R;

  return (
    <div className="scrollbar-none h-full overflow-y-auto px-4 pt-[max(12px,env(safe-area-inset-top))] pb-6">
      <h1 className="text-lg font-semibold">Today</h1>
      <p className="text-xs text-stone-400">
        {new Date(`${t.date}T00:00:00`).toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" })}
      </p>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {/* Ring + numbers */}
      <div className="mt-4 flex items-center gap-5 rounded-3xl border border-stone-200 p-4 dark:border-stone-800">
        <div className="relative h-32 w-32 shrink-0">
          <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
            <circle cx="64" cy="64" r={R} fill="none" strokeWidth="10" className="stroke-stone-100 dark:stroke-stone-800" />
            <motion.circle
              cx="64"
              cy="64"
              r={R}
              fill="none"
              strokeWidth="10"
              strokeLinecap="round"
              className={ratio > 1 ? "stroke-red-500" : "stroke-accent"}
              strokeDasharray={C}
              initial={{ strokeDashoffset: C }}
              animate={{ strokeDashoffset: C * (1 - Math.min(1, ratio)) }}
              transition={{ type: "spring", stiffness: 60, damping: 16 }}
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center text-center">
            <div>
              <div className="text-xl font-semibold tabular-nums leading-none">{fmt(t.eaten)}</div>
              <div className="mt-1 text-[10px] text-stone-400">eaten</div>
            </div>
          </div>
        </div>
        <dl className="flex-1 space-y-2 text-sm">
          <Row label="Goal" value={goal ? fmt(goal) : "not set"} />
          <Row label="Eaten" value={fmt(t.eaten)} />
          <Row label="Burned" value={fmt(t.burnedExercise + t.burnedSteps)} />
          <Row
            label="Remaining"
            value={goal ? fmt(t.remaining) : "–"}
            strong
            danger={goal !== null && (t.remaining ?? 0) < 0}
          />
        </dl>
      </div>

      {/* Steps */}
      <div className="mt-3 flex items-center gap-2 rounded-3xl border border-stone-200 p-3 dark:border-stone-800">
        <span className="text-xl">🚶</span>
        <input
          type="number"
          inputMode="numeric"
          value={steps}
          onChange={(e) => setSteps(e.target.value)}
          placeholder="Steps today"
          className="h-10 min-w-0 flex-1 rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm outline-none focus:border-accent dark:border-stone-700 dark:bg-stone-950"
        />
        <span className="text-xs text-stone-400 tabular-nums">≈ {fmt(t.burnedSteps)} kcal</span>
        <button
          onClick={saveSteps}
          disabled={savingSteps}
          className="h-10 rounded-xl bg-accent px-3 text-sm font-medium text-white disabled:opacity-50"
        >
          Save
        </button>
      </div>

      {/* Week */}
      <section className="mt-5">
        <h2 className="mb-1 text-xs font-semibold uppercase tracking-wider text-stone-400">Last 7 days</h2>
        <div className="rounded-3xl border border-stone-200 p-3 text-accent dark:border-stone-800">
          <WeekChart days={view.week} goal={goal} />
        </div>
      </section>

      {/* Food log */}
      <section className="mt-5">
        <h2 className="mb-1 text-xs font-semibold uppercase tracking-wider text-stone-400">Eaten</h2>
        <EntryList
          empty="Nothing logged yet. Tell the bot what you ate."
          items={t.intake.map((e) => ({ title: e.name, sub: e.quantity, kcal: e.calories }))}
          onRemove={(i) => remove("food", i)}
        />
      </section>

      {t.burned.length > 0 && (
        <section className="mt-5">
          <h2 className="mb-1 text-xs font-semibold uppercase tracking-wider text-stone-400">Workouts</h2>
          <EntryList
            empty=""
            items={t.burned.map((e) => ({ title: e.activity, kcal: -e.calories }))}
            onRemove={(i) => remove("burned", i)}
          />
        </section>
      )}
      <p className="mt-3 text-center text-[11px] text-stone-400">Swipe an entry left to delete it.</p>
    </div>
  );
}

function Row({ label, value, strong, danger }: { label: string; value: string; strong?: boolean; danger?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className="text-stone-500">{label}</dt>
      <dd className={`tabular-nums ${strong ? "font-semibold" : ""} ${danger ? "text-red-600" : ""}`}>{value}</dd>
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
  if (items.length === 0) return <p className="rounded-3xl border border-dashed border-stone-200 p-4 text-center text-xs text-stone-400 dark:border-stone-800">{empty}</p>;
  return (
    <ul className="space-y-1.5">
      <AnimatePresence initial={false}>
        {items.map((it, i) => (
          <SwipeRow key={`${it.title}-${i}`} onDelete={() => onRemove(i)}>
            <div className="flex items-center justify-between rounded-2xl bg-stone-50 px-3.5 py-2.5 dark:bg-stone-800">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium capitalize">{it.title}</div>
                {it.sub && <div className="text-[11px] text-stone-400">{it.sub}</div>}
              </div>
              <div className="ml-3 shrink-0 text-sm tabular-nums">
                {it.kcal < 0 ? "−" : ""}
                {fmt(Math.abs(it.kcal))} <span className="text-[10px] text-stone-400">kcal</span>
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
    <motion.li
      layout
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      className="relative overflow-hidden rounded-2xl"
    >
      <div className="absolute inset-y-0 right-0 flex w-24 items-center justify-end bg-red-500 pr-4 text-xs font-medium text-white">
        Delete
      </div>
      <motion.div
        drag="x"
        dragConstraints={{ left: -110, right: 0 }}
        dragElastic={0.1}
        dragSnapToOrigin
        onDragEnd={onEnd}
        className="relative bg-white dark:bg-stone-900"
      >
        {children}
      </motion.div>
    </motion.li>
  );
}
