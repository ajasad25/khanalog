import type { ChatCompletionTool } from "openai/resources/chat/completions";
import { maintenanceCalories, missingProfileFields, stepsToCalories, targetCalories } from "./calories";
import { resolveDay, shiftDay } from "./dates";
import type { ActivityLevel, DayLog, GoalMode, Sex, UserState } from "./types";

/**
 * Tools the model can call. Each one mutates `state` in place and returns a
 * short JSON-able result the model uses to write its reply. All arithmetic
 * happens here, never in the model.
 */

export const toolDefinitions: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "log_food",
      description:
        "Log something the user ate or drank. If the name matches one of the user's taught foods, their calorie value is used and `calories` is ignored.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Short food name, e.g. 'chai', 'chicken biryani'" },
          calories: { type: "number", description: "Your best estimate of total calories for this portion" },
          quantity: { type: "string", description: "Portion, e.g. '1 cup', '2 slices', 'half plate'" },
          date: { type: "string", description: "'today' (default), 'yesterday', or YYYY-MM-DD" },
        },
        required: ["name", "calories"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "log_burned",
      description: "Log calories burned from exercise or activity (not steps; use set_steps for walking).",
      parameters: {
        type: "object",
        properties: {
          activity: { type: "string", description: "e.g. 'gym', '30 min run'" },
          calories: { type: "number" },
          date: { type: "string", description: "'today' (default), 'yesterday', or YYYY-MM-DD" },
        },
        required: ["activity", "calories"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_steps",
      description: "Set the step count for a day. Calories burned from steps are computed automatically.",
      parameters: {
        type: "object",
        properties: {
          steps: { type: "integer" },
          date: { type: "string", description: "'today' (default), 'yesterday', or YYYY-MM-DD" },
        },
        required: ["steps"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_profile",
      description:
        "Update the user's body profile and preferences. Only pass fields the user mentioned. Daily calorie needs are recalculated automatically.",
      parameters: {
        type: "object",
        properties: {
          weightKg: { type: "number" },
          heightCm: { type: "number" },
          age: { type: "integer" },
          sex: { type: "string", enum: ["male", "female"] },
          activity: {
            type: "string",
            enum: ["sedentary", "light", "moderate", "active", "very_active"],
            description: "sedentary = desk job no exercise; light = 1-3 days/week; moderate = 3-5; active = 6-7; very_active = physical job or twice daily",
          },
          goalMode: { type: "string", enum: ["lose", "maintain", "gain"] },
          timezone: { type: "string", description: "IANA timezone like 'Asia/Karachi'" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_goal",
      description: "Set a manual daily calorie target, overriding the calculated one.",
      parameters: {
        type: "object",
        properties: { dailyCalories: { type: "integer" } },
        required: ["dailyCalories"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "teach_food",
      description:
        "Remember the calorie value of a food the user eats regularly, e.g. 'my chai is 90 calories'. Future log_food calls with this name use it.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          calories: { type: "number" },
        },
        required: ["name", "calories"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_last_entry",
      description: "Undo the most recent food or burned entry for a day.",
      parameters: {
        type: "object",
        properties: {
          kind: { type: "string", enum: ["food", "burned"] },
          date: { type: "string", description: "'today' (default), 'yesterday', or YYYY-MM-DD" },
        },
        required: ["kind"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_summary",
      description: "Get the full log and totals for a day: everything eaten, burned, steps, goal and remaining.",
      parameters: {
        type: "object",
        properties: {
          date: { type: "string", description: "'today' (default), 'yesterday', or YYYY-MM-DD" },
        },
      },
    },
  },
];

function getDay(state: UserState, key: string): DayLog {
  if (!state.days[key]) state.days[key] = { intake: [], burned: [] };
  return state.days[key];
}

function normaliseFoodName(name: string): string {
  return name.trim().toLowerCase();
}

export interface DaySummary {
  date: string;
  eaten: number;
  burnedExercise: number;
  burnedSteps: number;
  steps: number;
  net: number;
  goal: number | null;
  remaining: number | null;
  intake: { name: string; calories: number; quantity?: string; time: string }[];
  burned: { activity: string; calories: number; time: string }[];
}

export function summarise(state: UserState, key: string): DaySummary {
  const day = state.days[key] ?? { intake: [], burned: [] };
  const eaten = day.intake.reduce((s, e) => s + e.calories, 0);
  const burnedExercise = day.burned.reduce((s, e) => s + e.calories, 0);
  const steps = day.steps ?? 0;
  const burnedSteps = stepsToCalories(steps, state.profile.weightKg);
  const net = eaten - burnedExercise - burnedSteps;
  const goal = state.goal.dailyCalories ?? null;
  return {
    date: key,
    eaten,
    burnedExercise,
    burnedSteps,
    steps,
    net,
    goal,
    remaining: goal === null ? null : goal - net,
    intake: day.intake.map(({ name, calories, quantity, time }) => ({ name, calories, quantity, time })),
    burned: day.burned.map(({ activity, calories, time }) => ({ activity, calories, time })),
  };
}

/** Remove a specific entry by index (used by the UI's swipe-to-delete). */
export function removeEntry(state: UserState, key: string, kind: "food" | "burned", index: number): boolean {
  const day = state.days[key];
  if (!day) return false;
  const list = kind === "food" ? day.intake : day.burned;
  if (index < 0 || index >= list.length) return false;
  list.splice(index, 1);
  return true;
}

/** Totals for the last `n` days ending today, oldest first. */
export function recentDays(state: UserState, n: number, today: string): DaySummary[] {
  const out: DaySummary[] = [];
  for (let i = n - 1; i >= 0; i--) out.push(summarise(state, shiftDay(today, -i)));
  return out;
}

export function recalculateGoal(state: UserState) {
  if (state.goal.source === "manual") return;
  const target = targetCalories(state.profile);
  if (target !== null) state.goal = { dailyCalories: target, source: "calculated" };
}

type ToolArgs = Record<string, unknown>;

export function runTool(state: UserState, name: string, args: ToolArgs): unknown {
  const tz = state.profile.timezone;
  const now = new Date().toISOString();

  switch (name) {
    case "log_food": {
      const key = resolveDay(args.date as string | undefined, tz);
      const foodName = String(args.name ?? "").trim();
      const taught = state.foods[normaliseFoodName(foodName)];
      const calories = Math.round(taught ?? Number(args.calories ?? 0));
      getDay(state, key).intake.push({
        time: now,
        name: foodName,
        calories,
        quantity: args.quantity ? String(args.quantity) : undefined,
      });
      return { logged: { name: foodName, calories, usedTaughtValue: taught !== undefined }, summary: summarise(state, key) };
    }

    case "log_burned": {
      const key = resolveDay(args.date as string | undefined, tz);
      const calories = Math.round(Number(args.calories ?? 0));
      getDay(state, key).burned.push({ time: now, activity: String(args.activity ?? ""), calories });
      return { logged: { activity: args.activity, calories }, summary: summarise(state, key) };
    }

    case "set_steps": {
      const key = resolveDay(args.date as string | undefined, tz);
      const steps = Math.max(0, Math.round(Number(args.steps ?? 0)));
      getDay(state, key).steps = steps;
      return { steps, caloriesFromSteps: stepsToCalories(steps, state.profile.weightKg), summary: summarise(state, key) };
    }

    case "set_profile": {
      const p = state.profile;
      if (args.weightKg !== undefined) p.weightKg = Number(args.weightKg);
      if (args.heightCm !== undefined) p.heightCm = Number(args.heightCm);
      if (args.age !== undefined) p.age = Number(args.age);
      if (args.sex !== undefined) p.sex = args.sex as Sex;
      if (args.activity !== undefined) p.activity = args.activity as ActivityLevel;
      if (args.goalMode !== undefined) p.goalMode = args.goalMode as GoalMode;
      if (args.timezone !== undefined) p.timezone = String(args.timezone);
      recalculateGoal(state);
      return {
        profile: p,
        maintenanceCalories: maintenanceCalories(p),
        dailyGoal: state.goal.dailyCalories ?? null,
        goalSource: state.goal.source,
        missingForCalculation: missingProfileFields(p),
      };
    }

    case "set_goal": {
      const target = Math.round(Number(args.dailyCalories ?? 0));
      state.goal = { dailyCalories: target, source: "manual" };
      return { dailyGoal: target, goalSource: "manual" };
    }

    case "teach_food": {
      const n = normaliseFoodName(String(args.name ?? ""));
      state.foods[n] = Math.round(Number(args.calories ?? 0));
      return { taught: { name: n, calories: state.foods[n] }, allTaughtFoods: state.foods };
    }

    case "delete_last_entry": {
      const key = resolveDay(args.date as string | undefined, tz);
      const day = getDay(state, key);
      const removed = args.kind === "burned" ? day.burned.pop() : day.intake.pop();
      return { removed: removed ?? null, summary: summarise(state, key) };
    }

    case "get_summary": {
      const key = resolveDay(args.date as string | undefined, tz);
      return summarise(state, key);
    }

    default:
      return { error: `Unknown tool ${name}` };
  }
}
