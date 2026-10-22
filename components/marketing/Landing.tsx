import Link from "next/link";
import { demoEnabled } from "@/lib/auth";
import { DemoButton } from "@/components/DemoButton";
import { Arrow, Squiggle, Star } from "./Doodles";
import { ProductPreview } from "./ProductPreview";

const MARQUEE = ["had chai", "2 parathas", "walked 6,000 steps", "half a plate of biryani", "my chai is 90 calories", "what's left today?", "remove the last one", "a photo of my plate"];

const FEATURES: { title: string; body: string; tag: string }[] = [
  { tag: "text", title: "Say it, it's logged", body: "“Had chai and two parathas” becomes three entries with a running total. No search, no portion pickers." },
  { tag: "photo", title: "Send a plate", body: "It names the dish, estimates the portion, and asks one question when it can't tell." },
  { tag: "steps", title: "Walks count", body: "Steps and workouts come off your day, so remaining is always what's actually left." },
  { tag: "target", title: "A number you can trust", body: "Mifflin-St Jeor from your profile, or one you set. The model never does the arithmetic." },
  { tag: "memory", title: "Teach it your food", body: "“My chai is 90 calories.” Remembered, and used every time after." },
  { tag: "history", title: "Every day kept", body: "Undo, yesterday's log, a week at a glance. In Postgres, not a chat window." },
];

const STEPS: [string, string][] = [
  ["Tell it about you, once", "Weight, height, age, activity, and whether you're losing, keeping or gaining. It sets a daily target."],
  ["Log by talking", "Type what you ate or send a photo. Corrections are a sentence: “actually that was two cups”."],
  ["Check the day", "Eaten, burned, remaining, and the last seven days, in one view."],
];

export function Landing() {
  const demo = demoEnabled();
  return (
    <div className="grid-paper min-h-dvh">
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b-[1.5px] border-ink bg-paper/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/icon.svg" alt="" className="h-8 w-8 rounded-lg border-[1.5px] border-ink" />
            <span className="font-display text-[22px]">Khana Log</span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm md:flex">
            <a href="#features" className="hover:underline underline-offset-4">Features</a>
            <a href="#how" className="hover:underline underline-offset-4">How it works</a>
            <a href="https://github.com/momina0/khanalog" target="_blank" rel="noreferrer" className="hover:underline underline-offset-4">
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
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-14 lg:pt-24 lg:pb-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
          <div className="relative">
            <span className="label absolute -top-9 left-0 -rotate-3">calorie tracking, by conversation</span>
            <h1 className="font-display text-[46px] leading-[1.02] sm:text-[60px] lg:text-[68px]">
              Log your <span className="hl">khana</span> by <em className="italic">just saying it.</em>
            </h1>
            <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-muted">
              A tracker that understands “had chai and two parathas”, reads your plate from a photo, counts your steps
              against your target, and keeps every day. Nothing to search, nothing to tap through.
            </p>
            <div className="relative mt-8 flex flex-wrap items-center gap-3">
              {demo ? <DemoButton className="btn-primary h-11 px-5" label="Try it, no account" /> : null}
              <Link href="/signup" className={`${demo ? "btn-secondary" : "btn-primary"} h-11 px-5`}>
                Create an account
              </Link>
              <Arrow className="absolute -right-2 -top-14 hidden h-14 w-28 rotate-[160deg] text-bark lg:block" />
            </div>
            <p className="mt-4 text-xs text-faint">Free. Your data is yours; the demo sandbox is deleted after a week.</p>
            <div className="mt-8 flex flex-wrap gap-2">
              <span className="label label-paper rotate-2">chai = 90 kcal</span>
              <span className="label label-sage -rotate-2">6,000 steps · −240</span>
              <span className="label rotate-1">1,100 left today</span>
            </div>
          </div>
          <div className="relative">
            <ProductPreview />
            <span className="label label-paper absolute -right-3 -bottom-4 rotate-3">
              <Star className="h-3 w-3 text-tan" /> live demo
            </span>
          </div>
        </div>
      </section>

      {/* Marquee */}
      <div className="marquee border-y-[1.5px] border-ink bg-ink py-3 text-paper">
        <div className="marquee-track">
          {[...MARQUEE, ...MARQUEE].map((t, i) => (
            <span key={i} className="flex items-center gap-6 pr-6 text-sm">
              <span>“{t}”</span>
              <Star className="h-3 w-3 text-tan" />
            </span>
          ))}
        </div>
      </div>

      {/* Features */}
      <section id="features" className="scallop-top bg-sand" style={{ ["--scallop" as string]: "var(--color-sand)" }}>
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="max-w-xl">
            <span className="label label-paper -rotate-2">what it does</span>
            <h2 className="font-display mt-4 text-[36px] leading-tight sm:text-[44px]">
              Everything a tracker should do, <span className="hl-sage">without the tracker.</span>
            </h2>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <div key={f.title} className={`sticker tape p-6 ${i % 3 === 1 ? "tape-left" : ""} transition hover:-translate-y-0.5`}>
                <span className="eyebrow">{f.tag}</span>
                <h3 className="font-display mt-2 text-[22px] leading-tight">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="scallop-top bg-sage-soft" style={{ ["--scallop" as string]: "var(--color-sage-soft)" }}>
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <span className="label -rotate-2">how it works</span>
            <h2 className="font-display mt-4 text-[36px] leading-tight sm:text-[44px]">Three things, then it's just talking.</h2>
            <Squiggle className="mt-4 h-4 w-48 text-bark" />
            <p className="mt-5 text-sm leading-relaxed text-muted">
              Under the hood the model only decides which tool to call. Logging, goals and totals are deterministic code,
              so the numbers are the same every time.
            </p>
          </div>
          <ol className="space-y-4">
            {STEPS.map(([t, b], i) => (
              <li key={t} className="frame flex gap-5 p-6">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-[1.5px] border-ink bg-sand font-display text-lg shadow-press-sm">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-display text-[22px] leading-tight">{t}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{b}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA + footer */}
      <section className="scallop-top bg-paper" style={{ ["--scallop" as string]: "var(--color-paper)" }}>
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="frame tape relative mx-auto max-w-3xl px-8 py-12 text-center">
            <h2 className="font-display text-[34px] leading-tight sm:text-[42px]">
              Dinner's logged before <span className="hl">the plate is empty.</span>
            </h2>
            <p className="mt-3 text-sm text-muted">Open the demo, type what you ate, and watch the day fill in.</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              {demo ? <DemoButton className="btn-primary h-11 px-5" label="Open the demo" /> : null}
              <Link href="/signup" className={`${demo ? "btn-secondary" : "btn-primary"} h-11 px-5`}>
                Create an account
              </Link>
            </div>
            <span className="label label-sage absolute -left-4 top-6 -rotate-6">free</span>
            <span className="label label-paper absolute -right-4 bottom-8 rotate-6">open source</span>
          </div>
        </div>
        <footer className="border-t-[1.5px] border-ink">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 text-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <img src="/icon.svg" alt="" className="h-7 w-7 rounded-md border-[1.5px] border-ink" />
              <span className="font-display text-lg">Khana Log</span>
            </div>
            <ul className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
              {["Next.js", "TypeScript", "Tailwind", "Clerk", "Neon Postgres", "OpenRouter", "Vercel"].map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            <div className="flex gap-5">
              <Link href="/login" className="hover:underline underline-offset-4">Sign in</Link>
              <a href="https://github.com/momina0/khanalog" target="_blank" rel="noreferrer" className="hover:underline underline-offset-4">
                GitHub
              </a>
            </div>
          </div>
        </footer>
      </section>
    </div>
  );
}
