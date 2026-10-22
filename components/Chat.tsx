"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { api, fileToDataUrl, fmt, type StateView } from "@/lib/client";
import { Bowl } from "./marketing/Doodles";

type Msg = { id: string; role: "user" | "assistant"; content: string; image?: string };

const SUGGESTIONS = ["I had chai", "Walked 5,000 steps", "What's left today?", "Set up my profile"];
const DEFAULT_QUICK = ["chai", "coffee", "roti", "paratha", "an apple"];

let nextId = 0;
const mkId = () => `m${Date.now()}-${nextId++}`;

function CameraIcon({ className = "h-[18px] w-[18px]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8a2 2 0 0 1 2-2h2l1.5-2h5L16 6h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

export function Chat() {
  const [view, setView] = useState<StateView | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api<StateView>("/api/state")
      .then((v) => {
        setView(v);
        setMessages(
          v.history.map((m) => ({
            id: mkId(),
            role: m.role,
            content: m.content.replace(/^\[photo\]\s*/, ""),
            image: m.content.startsWith("[photo]") ? "sent" : undefined,
          })),
        );
      })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  async function send(text = input) {
    const t = text.trim();
    if ((!t && !image) || sending) return;
    setError(null);
    setSending(true);
    const userMsg: Msg = { id: mkId(), role: "user", content: t, image: image ?? undefined };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    const img = image;
    setImage(null);
    try {
      const res = await api<{ reply: string; view: StateView }>("/api/chat", {
        method: "POST",
        body: JSON.stringify({ text: t, imageUrl: img ?? undefined }),
      });
      setMessages((m) => [...m, { id: mkId(), role: "assistant", content: res.reply }]);
      setView(res.view);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setMessages((m) => m.filter((x) => x.id !== userMsg.id));
      setInput(t);
      if (img) setImage(img);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  async function pickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try {
      setImage(await fileToDataUrl(f));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read photo");
    }
  }

  const today = view?.today;
  const goal = today?.goal ?? null;
  const dateLabel = today ? new Date(`${today.date}T00:00:00`).toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" }) : "";
  const quick = view ? [...new Set([...Object.keys(view.foods), ...DEFAULT_QUICK])].slice(0, 6) : DEFAULT_QUICK;

  return (
    <div className="grid h-[calc(100dvh-7.5rem-env(safe-area-inset-bottom))] lg:h-dvh lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="flex min-h-0 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b-[1.5px] border-ink bg-card px-5 lg:h-16 lg:px-8">
          <div>
            <h1 className="font-display text-[22px] leading-none">Chat</h1>
            <p className="mt-1 text-xs text-muted">{dateLabel}</p>
          </div>
          {today && (
            <div className="text-right text-sm lg:hidden">
              <span className="font-semibold tabular-nums">{fmt(today.eaten)}</span>
              {goal ? <span className="text-muted"> / {fmt(goal)}</span> : null}
              <span className="ml-1 text-xs text-muted">kcal</span>
            </div>
          )}
          {view?.kind === "demo" && view.demo && (
            <span className="label label-sage hidden -rotate-2 lg:inline-flex">
              demo · {view.demo.used}/{view.demo.limit} today
            </span>
          )}
        </header>

        <div ref={listRef} className="grid-paper scrollbar-thin min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-2xl px-5 py-6 lg:px-8">
            {messages.length === 0 && !sending && (
              <div className="py-12 text-center">
                <Bowl className="mx-auto h-24 w-24 text-ink" />
                <h2 className="font-display mt-4 text-[34px] leading-tight">What did you have?</h2>
                <p className="mt-2 text-sm text-muted">Tell me what you ate, send a photo of your plate, or set up your profile.</p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((s, i) => (
                    <button key={s} onClick={() => send(s)} className={`chip ${i % 2 ? "rotate-1" : "-rotate-1"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {messages.map((m) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[78%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-[14.5px] leading-relaxed ${
                        m.role === "user" ? "rounded-br-md bg-ink text-paper" : "rounded-bl-md border-[1.5px] border-ink bg-card text-ink shadow-press-sm"
                      }`}
                    >
                      {m.image && m.image !== "sent" && <img src={m.image} alt="food" className="mb-2 max-h-56 rounded-xl border border-ink/20 object-cover" />}
                      {m.image === "sent" && (
                        <span className="mr-1.5 inline-flex -translate-y-px align-middle opacity-70">
                          <CameraIcon className="h-3.5 w-3.5" />
                        </span>
                      )}
                      {m.content}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {sending && (
                <div className="flex justify-start">
                  <div className="flex gap-1 rounded-2xl rounded-bl-md border-[1.5px] border-ink bg-card px-4 py-3.5">
                    <span className="typing-dot h-1.5 w-1.5 rounded-full bg-ink" />
                    <span className="typing-dot h-1.5 w-1.5 rounded-full bg-ink" />
                    <span className="typing-dot h-1.5 w-1.5 rounded-full bg-ink" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t-[1.5px] border-ink bg-card">
          <div className="mx-auto w-full max-w-2xl px-4 py-3 lg:px-8">
            {error && <div className="mb-2 rounded-xl border border-ink/20 bg-sand-soft px-3 py-2 text-xs text-bark">{error}</div>}
            {image && (
              <div className="mb-2 flex items-center gap-3">
                <img src={image} alt="" className="h-12 w-12 rounded-lg border border-ink/20 object-cover" />
                <button onClick={() => setImage(null)} className="text-xs text-muted underline underline-offset-2">
                  Remove photo
                </button>
              </div>
            )}
            {messages.length > 0 && (
              <div className="scrollbar-thin mb-2.5 flex gap-1.5 overflow-x-auto pb-0.5">
                {quick.map((q) => (
                  <button key={q} onClick={() => send(`I had ${q}`)} disabled={sending} className="chip h-8 shrink-0 px-3 text-[12px] hover:rotate-0">
                    + {q}
                  </button>
                ))}
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="flex items-center gap-2"
            >
              <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={pickPhoto} />
              <button type="button" onClick={() => fileRef.current?.click()} aria-label="Add a photo" className="btn-secondary h-10 w-10 shrink-0 px-0">
                <CameraIcon />
              </button>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={image ? "Add a note (optional)" : "I had…"}
                enterKeyHint="send"
                className="field h-10 flex-1 rounded-full px-4"
              />
              <button type="submit" disabled={sending || (!input.trim() && !image)} aria-label="Send" className="btn-primary h-10 w-10 shrink-0 px-0">
                <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </section>

      <aside className="hidden border-l-[1.5px] border-ink bg-sand-soft lg:block">{view ? <TodayRail view={view} /> : null}</aside>
    </div>
  );
}

function TodayRail({ view }: { view: StateView }) {
  const t = view.today;
  const goal = t.goal;
  const ratio = goal ? Math.min(1, t.eaten / goal) : 0;
  const R = 34;
  const C = 2 * Math.PI * R;
  const recent = [...t.intake].slice(-5).reverse();

  return (
    <div className="sticky top-0 flex h-dvh flex-col overflow-y-auto p-5">
      <div className="flex items-center justify-between">
        <span className="label label-paper -rotate-2">today</span>
        <Link href="/today" className="text-xs text-muted hover:text-ink">
          Open
        </Link>
      </div>

      <div className="sticker tape mt-6 p-4">
        <div className="flex items-center gap-4">
          <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90">
            <circle cx="40" cy="40" r={R} fill="none" strokeWidth="7" className="stroke-sand" />
            <circle
              cx="40"
              cy="40"
              r={R}
              fill="none"
              strokeWidth="7"
              strokeLinecap="round"
              className={goal && t.eaten > goal ? "stroke-bark" : "stroke-ink"}
              strokeDasharray={C}
              strokeDashoffset={C * (1 - ratio)}
              style={{ transition: "stroke-dashoffset .5s ease" }}
            />
          </svg>
          <div>
            <div className="font-display text-[30px] leading-none">{fmt(t.eaten)}</div>
            <div className="mt-1 text-xs text-muted">{goal ? `of ${fmt(goal)} kcal` : "kcal · no goal yet"}</div>
          </div>
        </div>
        <dl className="mt-4 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Burned</dt>
            <dd className="tabular-nums">{fmt(t.burnedExercise + t.burnedSteps)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Steps</dt>
            <dd className="tabular-nums">{fmt(t.steps)}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-1.5 font-medium">
            <dt>Remaining</dt>
            <dd className={`tabular-nums ${goal && (t.remaining ?? 0) < 0 ? "text-bark" : ""}`}>{goal ? fmt(t.remaining) : "–"}</dd>
          </div>
        </dl>
      </div>

      {/* Week dots: a tiny habit tracker. */}
      <div className="mt-5">
        <p className="eyebrow mb-2">This week</p>
        <div className="flex gap-2">
          {view.week.map((d, i) => {
            const logged = d.eaten > 0;
            const isToday = i === view.week.length - 1;
            return (
              <div key={d.date} className="flex flex-col items-center gap-1" title={`${d.date}: ${fmt(d.eaten)} kcal`}>
                <span className={`h-5 w-5 rounded-full border-[1.5px] border-ink ${logged ? "bg-ink" : "bg-card"} ${isToday ? "ring-2 ring-tan ring-offset-1 ring-offset-sand-soft" : ""}`} />
                <span className="text-[10px] text-muted">{new Date(`${d.date}T00:00:00`).toLocaleDateString("en-US", { weekday: "short" })[0]}</span>
              </div>
            );
          })}
        </div>
      </div>

      <p className="eyebrow mt-6 mb-2">Recent</p>
      {recent.length === 0 ? (
        <p className="rounded-xl border border-dashed border-ink/40 p-3 text-xs text-muted">Nothing logged yet.</p>
      ) : (
        <ul className="space-y-1.5">
          {recent.map((e, i) => (
            <li key={i} className="flex items-center justify-between rounded-xl border-[1.5px] border-ink bg-card px-3 py-2 text-[13px]">
              <span className="min-w-0 truncate capitalize">
                {e.name}
                {e.quantity ? <span className="text-faint"> · {e.quantity}</span> : null}
              </span>
              <span className="ml-3 shrink-0 tabular-nums">{fmt(e.calories)}</span>
            </li>
          ))}
        </ul>
      )}

      {!goal && (
        <div className="sticker-soft mt-auto p-3 text-xs text-muted">
          No daily target yet. Tell the chat your weight, height, age, sex and activity, or set it in{" "}
          <Link href="/profile" className="text-ink underline underline-offset-2">
            Profile
          </Link>
          .
        </div>
      )}
    </div>
  );
}
