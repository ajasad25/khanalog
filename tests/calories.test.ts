import assert from "node:assert/strict";
import { test } from "node:test";
import { bmr, maintenanceCalories, stepsToCalories, targetCalories } from "../lib/calories";
import { resolveDay, shiftDay } from "../lib/dates";
import { runTool, summarise } from "../lib/tools";
import { emptyState } from "../lib/types";

test("Mifflin-St Jeor BMR for a female", () => {
  // 10*62 + 6.25*160 - 5*25 - 161 = 620 + 1000 - 125 - 161 = 1334
  assert.equal(bmr({ weightKg: 62, heightCm: 160, age: 25, sex: "female" }), 1334);
});

test("Mifflin-St Jeor BMR for a male", () => {
  // 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
  assert.equal(bmr({ weightKg: 80, heightCm: 180, age: 30, sex: "male" }), 1780);
});

test("BMR is null when the profile is incomplete", () => {
  assert.equal(bmr({ weightKg: 62 }), null);
});

test("maintenance applies the activity multiplier", () => {
  const p = { weightKg: 62, heightCm: 160, age: 25, sex: "female" as const, activity: "light" as const };
  assert.equal(maintenanceCalories(p), Math.round(1334 * 1.375));
});

test("target subtracts 500 for losing, but never below the floor", () => {
  const p = { weightKg: 62, heightCm: 160, age: 25, sex: "female" as const, activity: "light" as const, goalMode: "lose" as const };
  assert.equal(targetCalories(p), Math.round(1334 * 1.375) - 500);

  const tiny = { weightKg: 40, heightCm: 150, age: 60, sex: "female" as const, goalMode: "lose" as const };
  assert.equal(targetCalories(tiny), 1200);
});

test("steps to calories scales with weight", () => {
  assert.equal(stepsToCalories(10000, 70), 450);
  assert.equal(stepsToCalories(10000, 35), 225);
});

test("day resolution", () => {
  assert.equal(shiftDay("2026-03-01", -1), "2026-02-28");
  assert.equal(resolveDay("2026-10-20"), "2026-10-20");
  assert.equal(resolveDay("today"), resolveDay(undefined));
  assert.equal(resolveDay("yesterday"), shiftDay(resolveDay(undefined), -1));
});

test("tools: log, teach, undo and summarise", () => {
  const state = emptyState();
  runTool(state, "set_profile", { weightKg: 62, heightCm: 160, age: 25, sex: "female", activity: "light", goalMode: "lose" });
  assert.equal(state.goal.source, "calculated");
  const goal = state.goal.dailyCalories!;

  runTool(state, "log_food", { name: "chai", calories: 120 });
  runTool(state, "teach_food", { name: "Chai", calories: 90 });
  runTool(state, "log_food", { name: "chai", calories: 500 }); // taught value wins
  runTool(state, "set_steps", { steps: 5000 });

  const today = resolveDay("today");
  let s = summarise(state, today);
  assert.equal(s.eaten, 210);
  assert.equal(s.burnedSteps, stepsToCalories(5000, 62));
  assert.equal(s.remaining, goal - (210 - s.burnedSteps));

  runTool(state, "delete_last_entry", { kind: "food" });
  s = summarise(state, today);
  assert.equal(s.eaten, 120);

  runTool(state, "set_goal", { dailyCalories: 1500 });
  assert.equal(state.goal.source, "manual");
  // Profile changes must not override a manual goal.
  runTool(state, "set_profile", { weightKg: 60 });
  assert.equal(state.goal.dailyCalories, 1500);
});
