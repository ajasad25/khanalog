"use client";

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
      const res = await api<{ view: StateView }>("/api/entries", { method: "DELETE", body: JSON.stringify({ kind, index, date: view.today.date }) });
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

  if (!view) return <div className="grid flex-1 place-items-center text-sm text-muted">{error ?? "Loading…"}</div>;

  const t = view.today;
  const goal = t.goal;
  const burned = t.burnedExercise + t.burnedSteps;
  const over = goal !== null && (t.remaining ?? 0) < 0;
  const dateLabel = new Date(`${t.date}T00:00:00`).toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" });
  const loggedDays = view.week.filter((d) => d.eaten > 0);
  const weekAvg = Math.round(loggedDays.reduce((s, d) => s + d.eaten, 0) / Math.max(1, loggedDays.length));

  return (
    <div className="grid-paper flex-1">
      <header className="flex h-14 items-center justify-between border-b-[1.5px] border-ink bg-card px-5 lg:h-16 lg:px-8">
        <div>
          <h1 className="font-display text-[22px] leading-none">Today</h1>
          <p className="mt-1 text-xs text-muted">{dateLabel}</p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveSteps();
          }}
          className="flex items-center gap-2"
        >
          <label className="hidden text-xs text-muted sm:block" htmlFor="steps">
            Steps
          </label>
          <input id="steps" type="number" inputMode="numeric" value={steps} onChange={(e) => setSteps(e.target.value)} placeholder="Steps" className="field h-9 w-28 rounded-full" />
          <button type="submit" disabled={savingSteps} className="btn-secondary h-9 px-3">
            Save
          </button>
        </form>
      </header>

      <div className="mx-auto max-w-6xl space-y-6 px-5 py-8 lg:px-8 lg:py-10">
        {error && <p className="text-sm text-bark">{error}</p>}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Eaten" value={fmt(t.eaten)} unit="kcal" tape />
          <Stat label="Burned" value={fmt(burned)} unit="kcal" hint={t.steps ? `${fmt(t.steps)} steps` : undefined} />
          <Stat label="Remaining" value={goal ? fmt(t.remaining) : "–"} unit={goal ? "kcal" : ""} tone={over ? "over" : "default"} hint={goal ? `goal ${fmt(goal)}` : "no goal set"} tape />
          <Stat label="7-day average" value={fmt(weekAvg)} unit="kcal" hint="days with entries" />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <section className="sticker p-5">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-[22px]">Last 7 days</h2>
              <span className="label label-sage -rotate-2 text-[11px]">calories eaten</span>
            </div>
            <div className="mt-4">
              <WeekChart days={view.week} goal={goal} />
            </div>
          </section>

          <section className="sticker overflow-hidden">
            <div className="flex items-baseline justify-between border-b-[1.5px] border-ink bg-sand-soft px-5 py-4">
              <h2 className="font-display text-[22px]">Eaten today</h2>
              <span className="text-xs text-muted">{t.intake.length} entries</span>
            </div>
            <EntryList
              empty="Nothing logged yet. Tell the chat what you ate."
              items={t.intake.map((e) => ({ title: e.name, sub: e.quantity, kcal: e.calories, time: e.time }))}
              onRemove={(i) => remove("food", i)}
            />
            {t.burned.length > 0 && (
              <>
                <div className="border-y-[1.5px] border-ink bg-sand-soft px-5 py-3">
                  <h2 className="font-display text-[20px]">Workouts</h2>
                </div>
                <EntryList empty="" items={t.burned.map((e) => ({ title: e.activity, kcal: -e.calories, time: e.time }))} onRemove={(i) => remove("burned", i)} />
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, unit, hint, tone = "default", tape }: { label: string; value: string; unit: string; hint?: string; tone?: "default" | "over"; tape?: boolean }) {
  return (
    <div className={`sticker p-5 ${tape ? "tape tape-left" : ""}`}>
      <p className="text-xs text-muted">{label}</p>
      <p className={`font-display mt-2 text-[34px] leading-none ${tone === "over" ? "text-bark" : ""}`}>
        {value}
        {unit && <span className="ml-1 font-sans text-sm text-muted">{unit}</span>}
      </p>
      {hint && <p className="mt-2 text-xs text-faint">{hint}</p>}
    </div>
  );
}

function EntryList({ items, empty, onRemove }: { items: { title: string; sub?: string; kcal: number; time: string }[]; empty: string; onRemove: (index: number) => void }) {
  if (items.length === 0) return <p className="px-5 py-8 text-center text-sm text-muted">{empty}</p>;
  return (
    <ul className="divide-y divide-line">
      {items.map((it, i) => (
        <li key={`${it.title}-${i}`} className="group flex items-center gap-3 px-5 py-3">
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium capitalize">{it.title}</div>
            <div className="text-xs text-muted">
              {new Date(it.time).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
              {it.sub ? ` · ${it.sub}` : ""}
            </div>
          </div>
          <div className="text-sm tabular-nums">
            {it.kcal < 0 ? "−" : ""}
            {fmt(Math.abs(it.kcal))}
          </div>
          <button
            onClick={() => onRemove(i)}
            aria-label="Delete entry"
            className="grid h-8 w-8 place-items-center rounded-full text-faint opacity-0 transition hover:bg-sand-soft hover:text-bark group-hover:opacity-100 focus-visible:opacity-100"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
            </svg>
          </button>
        </li>
      ))}
    </ul>
  );
}
