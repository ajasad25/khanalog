import { maintenanceCalories } from "./calories";
import { dayKey } from "./dates";
import { recentDays, summarise, type DaySummary } from "./tools";
import type { ChatMessage, Goal, Profile, UserState } from "./types";

/** Everything the UI needs in one object. */
export interface StateView {
  kind: "user" | "demo";
  today: DaySummary;
  week: DaySummary[];
  profile: Profile;
  goal: Goal;
  maintenance: number | null;
  foods: Record<string, number>;
  history: ChatMessage[];
  demo: { limit: number; used: number } | null;
}

export function stateView(state: UserState, kind: "user" | "demo", demoLimit: number): StateView {
  const today = dayKey(state.profile.timezone);
  return {
    kind,
    today: summarise(state, today),
    week: recentDays(state, 7, today),
    profile: state.profile,
    goal: state.goal,
    maintenance: maintenanceCalories(state.profile),
    foods: state.foods,
    history: state.history,
    demo:
      kind === "demo"
        ? { limit: demoLimit, used: state.usage?.date === today ? state.usage.count : 0 }
        : null,
  };
}
