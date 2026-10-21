import type { ReactNode } from "react";

const FEATURES: [string, string][] = [
  ["Just say it", "“had chai and 2 parathas” is logged, with your running total."],
  ["Send a photo", "It names the dish, estimates the portion, and asks if unsure."],
  ["Steps count", "Walks and workouts come off your daily intake."],
  ["Your target", "Calculated from your profile, or set your own number."],
  ["Teach it", "“my chai is 90 calories” and it remembers, forever."],
  ["Every day kept", "Undo, summaries, yesterday’s log, a week at a glance."],
];

const STACK = ["Next.js", "TypeScript", "Tailwind", "Framer Motion", "Clerk", "Neon Postgres", "OpenRouter", "Tool calling", "Vision", "Vercel"];

/** Public shell around the sign-in / sign-up cards: what the project is, for visitors. */
export function Landing({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 pt-12 pb-16">
      <header className="mb-8">
        <img src="/icon.svg" alt="" className="mb-5 h-14 w-14 rounded-2xl" />
        <h1 className="text-[2rem] leading-tight font-semibold tracking-tight">Khana Log</h1>
        <p className="mt-1.5 text-[15px] text-muted">A calorie tracker you just talk to.</p>
        <div className="mt-5 flex gap-1.5">
          <span className="h-1.5 w-10 rounded-full bg-cocoa" />
          <span className="h-1.5 w-6 rounded-full bg-caramel" />
          <span className="h-1.5 w-4 rounded-full bg-gold" />
          <span className="h-1.5 w-3 rounded-full bg-peach" />
        </div>
      </header>

      {children}

      <section className="mt-12">
        <h2 className="eyebrow mb-3">What it does</h2>
        <div className="grid grid-cols-2 gap-2.5">
          {FEATURES.map(([title, body]) => (
            <div key={title} className="rounded-2xl border border-line bg-card p-3.5">
              <div className="text-[13px] font-semibold">{title}</div>
              <p className="mt-1 text-[12px] leading-snug text-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="eyebrow mb-3">Built with</h2>
        <div className="flex flex-wrap gap-2">
          {STACK.map((s) => (
            <span key={s} className="rounded-full bg-card-2 px-3 py-1 text-[12px] font-medium text-ink">
              {s}
            </span>
          ))}
        </div>
        <p className="mt-5 text-[12px] leading-relaxed text-muted">
          The model never does arithmetic. Every log, goal and total is a deterministic tool call; the model only
          decides which tool to call and writes the reply.
        </p>
      </section>
    </main>
  );
}
