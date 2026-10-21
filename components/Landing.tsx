import type { ReactNode } from "react";

/** Public shell around the sign-in / sign-up cards: what the project is, for visitors. */
export function Landing({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 py-10">
      <div className="mb-8 flex items-center gap-3">
        <img src="/icon.svg" alt="" className="h-12 w-12 rounded-2xl" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Khana Log</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">A calorie tracker you just talk to.</p>
        </div>
      </div>

      {children}

      <section className="mt-10 space-y-3 text-sm text-stone-600 dark:text-stone-400">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-400">What it does</h2>
        <ul className="space-y-2">
          <li>“had chai and 2 parathas” → logged, with your running total.</li>
          <li>Send a photo of your plate; it names the dish, estimates the portion, asks if unsure.</li>
          <li>Steps and workouts count against your intake.</li>
          <li>Daily target calculated from your profile, or set your own.</li>
          <li>Teach it your foods: “my chai is 90 calories”.</li>
          <li>Remembers every day. Undo, summaries, yesterday’s log.</li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-400">Built with</h2>
        <div className="flex flex-wrap gap-2">
          {["Next.js", "TypeScript", "Tailwind", "Framer Motion", "Clerk", "Neon Postgres", "OpenRouter", "Tool calling", "Vision", "Vercel"].map((s) => (
            <span key={s} className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs text-stone-600 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300">
              {s}
            </span>
          ))}
        </div>
        <p className="mt-4 text-xs text-stone-500 dark:text-stone-500">
          The model never does arithmetic: every log, goal and total is a deterministic tool call. The model only
          decides which tool to call and writes the reply.
        </p>
      </section>
    </main>
  );
}
