"use client";

import { useEffect, useState } from "react";
import { api, fmt, type StateView } from "@/lib/client";

type Form = {
  weightKg: string;
  heightCm: string;
  age: string;
  sex: "" | "male" | "female";
  activity: "" | "sedentary" | "light" | "moderate" | "active" | "very_active";
  goalMode: "" | "lose" | "maintain" | "gain";
  timezone: string;
  manualGoal: string;
  useManual: boolean;
};

const ACTIVITY: [Form["activity"], string][] = [
  ["sedentary", "Sedentary · desk job, no exercise"],
  ["light", "Light · 1–3 days a week"],
  ["moderate", "Moderate · 3–5 days a week"],
  ["active", "Active · 6–7 days a week"],
  ["very_active", "Very active · physical job or twice daily"],
];

export function ProfileForm() {
  const [view, setView] = useState<StateView | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [foods, setFoods] = useState<{ name: string; kcal: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    api<StateView>("/api/state")
      .then((v) => {
        setView(v);
        setForm({
          weightKg: v.profile.weightKg?.toString() ?? "",
          heightCm: v.profile.heightCm?.toString() ?? "",
          age: v.profile.age?.toString() ?? "",
          sex: v.profile.sex ?? "",
          activity: v.profile.activity ?? "",
          goalMode: v.profile.goalMode ?? "",
          timezone: v.profile.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
          manualGoal: v.goal.source === "manual" ? String(v.goal.dailyCalories ?? "") : "",
          useManual: v.goal.source === "manual",
        });
        setFoods(Object.entries(v.foods).map(([name, kcal]) => ({ name, kcal: String(kcal) })));
      })
      .catch((e) => setMsg(e.message));
  }, []);

  function set<K extends keyof Form>(k: K, v: Form[K]) {
    setForm((f) => (f ? { ...f, [k]: v } : f));
  }

  async function save() {
    if (!form) return;
    setSaving(true);
    setMsg(null);
    try {
      const body: Record<string, unknown> = {
        weightKg: form.weightKg ? Number(form.weightKg) : undefined,
        heightCm: form.heightCm ? Number(form.heightCm) : undefined,
        age: form.age ? Number(form.age) : undefined,
        sex: form.sex || undefined,
        activity: form.activity || undefined,
        goalMode: form.goalMode || undefined,
        timezone: form.timezone || undefined,
        dailyGoal: form.useManual && form.manualGoal ? Number(form.manualGoal) : null,
        foods: Object.fromEntries(foods.filter((f) => f.name.trim()).map((f) => [f.name, Number(f.kcal) || 0])),
      };
      const res = await api<{ view: StateView }>("/api/profile", { method: "PATCH", body: JSON.stringify(body) });
      setView(res.view);
      setMsg("Saved");
      setTimeout(() => setMsg(null), 2000);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  if (!form || !view) {
    return <div className="grid flex-1 place-items-center text-sm text-muted">{msg ?? "Loading…"}</div>;
  }

  return (
    <div className="flex-1">
      <header className="flex h-14 items-center justify-between border-b border-line bg-card px-5 lg:h-16 lg:px-8">
        <div>
          <h1 className="text-[15px] font-semibold tracking-tight">Profile</h1>
          <p className="text-xs text-muted">{view.kind === "demo" ? "Demo sandbox" : "Used to calculate your daily target"}</p>
        </div>
        <div className="flex items-center gap-3">
          {msg && <span className="text-xs text-muted">{msg}</span>}
          <button onClick={save} disabled={saving} className="btn-primary h-9 px-4">
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-6 px-5 py-6 lg:grid-cols-[1.3fr_1fr] lg:px-8 lg:py-8">
        <section className="card p-6">
          <h2 className="text-sm font-semibold">About you</h2>
          <p className="mt-1 text-xs text-muted">The target uses Mifflin-St Jeor: weight, height, age, sex and how active you are.</p>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <Field label="Weight (kg)">
              <input className="field" type="number" inputMode="decimal" value={form.weightKg} onChange={(e) => set("weightKg", e.target.value)} />
            </Field>
            <Field label="Height (cm)">
              <input className="field" type="number" inputMode="decimal" value={form.heightCm} onChange={(e) => set("heightCm", e.target.value)} />
            </Field>
            <Field label="Age">
              <input className="field" type="number" inputMode="numeric" value={form.age} onChange={(e) => set("age", e.target.value)} />
            </Field>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Sex">
              <Segmented
                value={form.sex}
                onChange={(v) => set("sex", v as Form["sex"])}
                options={[
                  ["female", "Female"],
                  ["male", "Male"],
                ]}
              />
            </Field>
            <Field label="Goal">
              <Segmented
                value={form.goalMode}
                onChange={(v) => set("goalMode", v as Form["goalMode"])}
                options={[
                  ["lose", "Lose"],
                  ["maintain", "Maintain"],
                  ["gain", "Gain"],
                ]}
              />
            </Field>
          </div>

          <Field label="Activity" className="mt-4">
            <select className="field" value={form.activity} onChange={(e) => set("activity", e.target.value as Form["activity"])}>
              <option value="">Choose…</option>
              {ACTIVITY.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Timezone" className="mt-4">
            <input className="field" value={form.timezone} onChange={(e) => set("timezone", e.target.value)} placeholder="Asia/Karachi" />
          </Field>
        </section>

        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="text-sm font-semibold">Daily target</h2>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-sm text-muted">Maintenance</span>
              <span className="text-sm tabular-nums">{view.maintenance ? `${fmt(view.maintenance)} kcal` : "fill in profile"}</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between border-t border-line pt-3">
              <span className="text-sm font-medium">Target</span>
              <span className="tabular-nums">
                <span className="text-2xl font-semibold">{view.goal.dailyCalories ? fmt(view.goal.dailyCalories) : "–"}</span>
                <span className="ml-1 text-xs text-muted">kcal{view.goal.source ? ` · ${view.goal.source}` : ""}</span>
              </span>
            </div>
            <label className="mt-4 flex items-center gap-2.5 text-sm">
              <input type="checkbox" className="h-4 w-4 rounded border-line accent-[#223030]" checked={form.useManual} onChange={(e) => set("useManual", e.target.checked)} />
              Set my own target
            </label>
            {form.useManual && (
              <input className="field mt-3" type="number" inputMode="numeric" placeholder="e.g. 1500" value={form.manualGoal} onChange={(e) => set("manualGoal", e.target.value)} />
            )}
          </section>

          <section className="card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">My foods</h2>
              <button onClick={() => setFoods((f) => [...f, { name: "", kcal: "" }])} className="text-xs font-medium text-ink hover:underline">
                Add
              </button>
            </div>
            <p className="mt-1 text-xs text-muted">Your usual items and what they're worth. Used whenever you mention them.</p>
            <div className="mt-4 space-y-2">
              {foods.length === 0 && <p className="rounded-lg border border-dashed border-line p-3 text-xs text-muted">Nothing yet, e.g. chai = 90.</p>}
              {foods.map((f, i) => (
                <div key={i} className="flex gap-2">
                  <input className="field" placeholder="chai" value={f.name} onChange={(e) => setFoods((all) => all.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                  <input
                    className="field w-24 shrink-0"
                    type="number"
                    inputMode="numeric"
                    placeholder="kcal"
                    value={f.kcal}
                    onChange={(e) => setFoods((all) => all.map((x, j) => (j === i ? { ...x, kcal: e.target.value } : x)))}
                  />
                  <button onClick={() => setFoods((all) => all.filter((_, j) => j !== i))} aria-label="Remove" className="grid h-10 w-9 shrink-0 place-items-center rounded-md text-faint hover:bg-sand-soft hover:text-bark">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}

function Segmented({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <div className="grid h-10 gap-1 rounded-lg border border-line bg-paper p-1" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      {options.map(([v, l]) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`rounded-md text-sm transition ${value === v ? "bg-card font-medium text-ink shadow-[0_1px_0_rgba(34,48,48,0.06)]" : "text-muted hover:text-ink"}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
