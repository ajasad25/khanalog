import type { ActivityLevel, GoalMode, Profile } from "./types";

const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const GOAL_ADJUSTMENT: Record<GoalMode, number> = {
  lose: -500,
  maintain: 0,
  gain: 300,
};

/** Basal metabolic rate via Mifflin-St Jeor. Returns null if the profile is incomplete. */
export function bmr(p: Profile): number | null {
  if (!p.weightKg || !p.heightCm || !p.age || !p.sex) return null;
  const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age;
  return Math.round(p.sex === "male" ? base + 5 : base - 161);
}

/** Total daily energy expenditure: BMR scaled by activity level. */
export function maintenanceCalories(p: Profile): number | null {
  const b = bmr(p);
  if (b === null) return null;
  return Math.round(b * ACTIVITY_MULTIPLIER[p.activity ?? "sedentary"]);
}

/** Daily target after applying the goal mode (lose / maintain / gain). */
export function targetCalories(p: Profile): number | null {
  const m = maintenanceCalories(p);
  if (m === null) return null;
  const target = m + GOAL_ADJUSTMENT[p.goalMode ?? "maintain"];
  // Never recommend going below a sensible floor.
  return Math.max(target, p.sex === "male" ? 1500 : 1200);
}

/** Rough calories burned walking: ~0.045 kcal per step for a 70 kg person, scaled by weight. */
export function stepsToCalories(steps: number, weightKg?: number): number {
  const scale = (weightKg ?? 70) / 70;
  return Math.round(steps * 0.045 * scale);
}

export function missingProfileFields(p: Profile): string[] {
  const missing: string[] = [];
  if (!p.weightKg) missing.push("weight");
  if (!p.heightCm) missing.push("height");
  if (!p.age) missing.push("age");
  if (!p.sex) missing.push("sex");
  return missing;
}
