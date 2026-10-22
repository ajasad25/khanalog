import Link from "next/link";
import { demoEnabled } from "@/lib/auth";
import { DemoButton } from "@/components/DemoButton";
import { ProductPreview } from "./ProductPreview";

const FEATURES: { title: string; body: string; icon: React.ReactNode }[] = [
  {
    title: "Say it, it's logged",
    body: "“Had chai and two parathas” becomes three entries with a running total. No search, no portion pickers.",
    icon: <path d="M4 5h16v10H9l-5 4V5z" />,
  },
  {
    title: "Photos, with a question if unsure",
    body: "Send a plate. It names the dish, estimates the portion, and asks one thing when it can't tell.",
    icon: (
      <>
        <path d="M4 8a2 2 0 0 1 2-2h2l1.5-2h5L16 6h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
        <circle cx="12" cy="13" r="3.5" />
      </>
    ),
  },
  {
    title: "Steps count against intake",
    body: "Walks and workouts come off your day. Remaining is always what's actually left.",
    icon: <path d="M4 17l4-9 4 6 3-4 5 7" />,
  },
  {
    title: "A target you can trust",
    body: "Mifflin-St Jeor from your profile, or a number you set. The model never does the arithmetic.",
    icon: (
      <>
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
  },
  {
    title: "Teach it your food",
    body: "“My chai is 90 calories.” Remembered, and used every time after.",
    icon: <path d="M4 19V5a1 1 0 0 1 1-1h9l6 6v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zM14 4v6h6" />,
  },
  {
    title: "Every day, kept",
    body: "Undo, yesterday's log, a week at a glance. Your history lives in Postgres, not a chat window.",
    icon: (
      <>
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M4 10h16M9 3v4M15 3v4" />
      </>
    ),
  },
];

const STEPS: [string, string][] = [
  ["Tell it about you once", "Weight, height, age, activity and whether you're losing, keeping or gaining. It sets a daily target."],
  ["Log by talking", "Type what you ate or send a photo. Corrections are a sentence: “actually that was two cups”."],
  ["Check the day", "Eaten, burned, remaining, and the last seven days, in one view."],
];

export function Landing() {
  const demo = demoEnabled();
  return (
    <div className="min-h-dvh">
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b border-line/70 bg-paper/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/icon.svg" alt="" className="h-7 w-7 rounded-md" />
            <span className="text-[15px] font-semibold tracking-tight">Khana Log</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-muted md:flex">
            <a href="#features" className="hover:text-ink">Features</a>
            <a href="#how" className="hover:text-ink">How it works</a>
            <a href="https://github.com/momina0/khanalog" target="_blank" rel="noreferrer" className="hover:text-ink">
              Source
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn-ghost">
              Sign in
            </Link>
            {demo ? <DemoButton className="btn-primary" /> : <Link href="/signup" className="btn-primary">Get started</Link>}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pt-20 pb-16 lg:grid-cols-[1.05fr_1fr] lg:pt-28 lg:pb-24">
        <div>
          <p className="eyebrow mb-5">Calorie tracking, by conversation</p>
          <h1 className="font-display text-[44px] leading-[1.05] sm:text-[56px] lg:text-[64px]">
            Log your khana by <em className="italic">just saying it.</em>
          </h1>
          <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-muted">
            A tracker that understands “had chai and two parathas”, reads your plate from a photo, counts your
            steps against your target, and keeps every day. Nothing to search, nothing to tap through.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            {demo ? <DemoButton className="btn-primary h-11 px-5" label="Try it without an account" /> : null}
            <Link href="/signup" className={`${demo ? "btn-secondary" : "btn-primary"} h-11 px-5`}>
              Create an account
            </Link>
          </div>
          <p className="mt-4 text-xs text-faint">Free. Your data is yours; the demo sandbox is deleted after a week.</p>
        </div>
        <ProductPreview />
      </section>

      {/* Features */}
      <section id="features" className="border-t border-line bg-card">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="max-w-xl">
            <p className="eyebrow mb-3">What it does</p>
            <h2 className="font-display text-[34px] leading-tight sm:text-[40px]">Everything a tracker should do, without the tracker.</h2>
          </div>
          <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-card p-6">
                <span className="mb-4 grid h-9 w-9 place-items-center rounded-lg bg-sand-soft text-bark">
                  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    {f.icon}
                  </svg>
                </span>
                <h3 className="text-[15px] font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="eyebrow mb-3">How it works</p>
            <h2 className="font-display text-[34px] leading-tight sm:text-[40px]">Three things, then it's just talking.</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Under the hood the model only decides which tool to call. Logging, goals and totals are deterministic
              code, so the numbers are the same every time.
            </p>
          </div>
          <ol className="space-y-px overflow-hidden rounded-xl border border-line bg-line">
            {STEPS.map(([t, b], i) => (
              <li key={t} className="flex gap-5 bg-card p-6">
                <span className="font-display text-2xl leading-none text-tan">0{i + 1}</span>
                <div>
                  <h3 className="text-[15px] font-semibold">{t}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{b}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Stack strip */}
      <section className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-6 py-8">
          <p className="text-sm text-muted">Built with</p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink">
            {["Next.js", "TypeScript", "Tailwind", "Clerk", "Neon Postgres", "OpenRouter", "Vercel"].map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line bg-card">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/icon.svg" alt="" className="h-6 w-6 rounded-md" />
            <span className="font-medium text-ink">Khana Log</span>
          </div>
          <div className="flex gap-6">
            <Link href="/login" className="hover:text-ink">Sign in</Link>
            <Link href="/signup" className="hover:text-ink">Sign up</Link>
            <a href="https://github.com/momina0/khanalog" target="_blank" rel="noreferrer" className="hover:text-ink">
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
