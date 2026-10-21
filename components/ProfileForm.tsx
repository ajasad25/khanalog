"use client";

import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
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
  ["light", "Light · 1–3 days/week"],
  ["moderate", "Moderate · 3–5 days/week"],
  ["active", "Active · 6–7 days/week"],
  ["very_active", "Very active · physical job or 2× daily"],
];

export function ProfileForm() {
  const router = useRouter();
  const clerk = useClerk();
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
      setMsg("Saved.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    if (view?.kind === "user") {
      await clerk.signOut({ redirectUrl: "/login" });
      return;
    }
    await api("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  if (!form || !view) {
    return <div className="grid h-full place-items-center text-sm text-muted">{msg ?? "Loading…"}</div>;
  }

  return (
    <div className="scrollbar-none h-full overflow-y-auto bg-surface px-4 pt-[max(14px,env(safe-area-inset-top))] pb-8">
      <h1 className="text-[22px] font-semibold tracking-tight">Profile</h1>
      <p className="text-[12px] text-muted">{view.kind === "demo" ? "Demo sandbox" : "Used to calculate your daily target."}</p>

      <div className="mt-5 rounded-3xl border border-line bg-card p-4">
        <div className="grid grid-cols-3 gap-2">
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

        <Field label="Sex" className="mt-4">
          <Segmented
            value={form.sex}
            onChange={(v) => set("sex", v as Form["sex"])}
            options={[
              ["female", "Female"],
              ["male", "Male"],
            ]}
          />
        </Field>

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

        <Field label="Goal" className="mt-4">
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

        <Field label="Timezone" className="mt-4">
          <input className="field" value={form.timezone} onChange={(e) => set("timezone", e.target.value)} placeholder="Asia/Karachi" />
        </Field>
      </div>

      <div className="mt-3 rounded-3xl bg-cocoa p-4 text-on-primary">
        <div className="flex justify-between text-sm opacity-80">
          <span>Maintenance</span>
          <span className="tabular-nums">{view.maintenance ? `${fmt(view.maintenance)} kcal` : "fill in profile"}</span>
        </div>
        <div className="mt-1.5 flex items-baseline justify-between">
          <span className="text-sm font-medium">Daily target</span>
          <span className="tabular-nums">
            <span className="text-[22px] font-semibold">{view.goal.dailyCalories ? fmt(view.goal.dailyCalories) : "–"}</span>
            <span className="ml-1 text-[12px] opacity-80">kcal{view.goal.source ? ` · ${view.goal.source}` : ""}</span>
          </span>
        </div>
        <label className="mt-4 flex items-center gap-2.5 text-[13px]">
          <input type="checkbox" className="h-4 w-4 accent-[#dbb85a]" checked={form.useManual} onChange={(e) => set("useManual", e.target.checked)} />
          Set my own target
        </label>
        {form.useManual && (
          <input
            className="field mt-2.5 border-transparent bg-on-primary/95 text-ink"
            type="number"
            inputMode="numeric"
            placeholder="e.g. 1500"
            value={form.manualGoal}
            onChange={(e) => set("manualGoal", e.target.value)}
          />
        )}
      </div>

      <section className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="eyebrow">My foods</h2>
          <button onClick={() => setFoods((f) => [...f, { name: "", kcal: "" }])} className="text-[12px] font-semibold text-cocoa">
            + Add
          </button>
        </div>
        {foods.length === 0 && (
          <p className="rounded-3xl border border-dashed border-line p-4 text-center text-[12px] text-muted">
            Teach the assistant your usual items, e.g. chai = 90.
          </p>
        )}
        <div className="space-y-1.5">
          {foods.map((f, i) => (
            <div key={i} className="flex gap-2">
              <input
                className="field"
                placeholder="chai"
                value={f.name}
                onChange={(e) => setFoods((all) => all.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
              />
              <input
                className="field w-24 shrink-0"
                type="number"
                inputMode="numeric"
                placeholder="kcal"
                value={f.kcal}
                onChange={(e) => setFoods((all) => all.map((x, j) => (j === i ? { ...x, kcal: e.target.value } : x)))}
              />
              <button
                onClick={() => setFoods((all) => all.filter((_, j) => j !== i))}
                aria-label="Remove"
                className="grid h-11 w-9 shrink-0 place-items-center text-muted hover:text-ink"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </section>

      <button
        onClick={save}
        disabled={saving}
        className="mt-7 w-full rounded-2xl bg-primary py-3.5 text-[15px] font-medium text-on-primary transition active:scale-[0.98] disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save"}
      </button>
      {msg && <p className="mt-2.5 text-center text-[12px] text-muted">{msg}</p>}

      <button onClick={logout} className="mt-7 w-full text-[12px] text-muted underline underline-offset-4">
        {view.kind === "demo" ? "Leave demo" : "Sign out"}
      </button>
    </div>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[11px] font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}

function Segmented({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <div className="grid gap-1 rounded-2xl bg-card-2 p-1" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      {options.map(([v, l]) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`h-9 rounded-xl text-sm transition ${value === v ? "bg-card font-medium text-ink shadow-sm" : "text-muted"}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
