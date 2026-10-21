export type Sex = "male" | "female";

export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";

export type GoalMode = "lose" | "maintain" | "gain";

export interface Profile {
  weightKg?: number;
  heightCm?: number;
  age?: number;
  sex?: Sex;
  activity?: ActivityLevel;
  goalMode?: GoalMode;
  /** IANA timezone, e.g. "Asia/Karachi". Decides when "today" rolls over. */
  timezone?: string;
}

export interface FoodEntry {
  time: string; // ISO timestamp
  name: string;
  calories: number;
  quantity?: string;
}

export interface BurnEntry {
  time: string;
  activity: string;
  calories: number;
}

export interface DayLog {
  intake: FoodEntry[];
  burned: BurnEntry[];
  steps?: number;
}

export interface Goal {
  dailyCalories?: number;
  source: "calculated" | "manual" | null;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  time: string;
}

export interface UserState {
  profile: Profile;
  goal: Goal;
  /** Personal shortcuts the user has taught the bot, e.g. { chai: 120 }. */
  foods: Record<string, number>;
  /** Keyed by YYYY-MM-DD in the user's timezone. */
  days: Record<string, DayLog>;
  /** Recent conversation, so follow-ups like "make that two cups" work. */
  history: ChatMessage[];
  /** Per-day message counter, used to rate limit demo visitors. */
  usage?: { date: string; count: number };
}

export function emptyState(): UserState {
  return {
    profile: {},
    goal: { source: null },
    foods: {},
    days: {},
    history: [],
  };
}
