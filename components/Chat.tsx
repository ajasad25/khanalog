"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { api, fileToDataUrl, fmt, type StateView } from "@/lib/client";

type Msg = { id: string; role: "user" | "assistant"; content: string; image?: string; pending?: boolean };

const SUGGESTIONS = ["I had chai", "Walked 5,000 steps", "What's left today?", "Set up my profile"];

let nextId = 0;
const mkId = () => `m${Date.now()}-${nextId++}`;

function CameraIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
  const progress = goal ? Math.min(1, Math.max(0, today!.eaten / goal)) : 0;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="border-b border-line bg-card px-5 pt-[max(14px,env(safe-area-inset-top))] pb-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/icon.svg" alt="" className="h-9 w-9 rounded-xl" />
            <div>
              <div className="text-[15px] font-semibold leading-tight tracking-tight">Khana Log</div>
              <div className="text-[11px] text-muted">
                {view?.kind === "demo" && view.demo
                  ? `Demo · ${view.demo.used}/${view.demo.limit} messages today`
                  : "Your tracker"}
              </div>
            </div>
          </div>
          {today && (
            <div className="text-right">
              <div className="text-[15px] font-semibold tabular-nums">
                {fmt(today.eaten)}
                {goal ? <span className="text-muted"> / {fmt(goal)}</span> : null}
                <span className="ml-1 text-[11px] font-normal text-muted">kcal</span>
              </div>
              <div className="text-[11px] text-muted">{goal ? `${fmt(today.remaining)} left` : "no goal yet"}</div>
            </div>
          )}
        </div>
        {goal ? (
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-card-2">
            <motion.div
              className={`h-full rounded-full ${progress >= 1 ? "bg-over" : "bg-caramel"}`}
              initial={false}
              animate={{ width: `${progress * 100}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
            />
          </div>
        ) : null}
      </header>

      {/* Messages */}
      <div ref={listRef} className="scrollbar-none flex-1 space-y-2.5 overflow-y-auto bg-surface px-4 py-5">
        {messages.length === 0 && !sending && (
          <div className="mt-14 px-2 text-center">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-card-2 text-cocoa">
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 11h16a1 1 0 0 1 1 1c0 4.5-4 8-9 8s-9-3.5-9-8a1 1 0 0 1 1-1z" />
                <path d="M9 8c0-1.5 1.5-1.5 1.5-3M13 8c0-1.5 1.5-1.5 1.5-3" />
              </svg>
            </div>
            <p className="text-[15px] font-medium">What did you have?</p>
            <p className="mt-1 text-[13px] text-muted">Tell me what you ate, send a photo of your plate, or set up your profile.</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-line bg-card px-3.5 py-2 text-[13px] text-ink transition hover:bg-card-2 active:scale-95"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              layout
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[82%] rounded-[20px] px-4 py-2.5 text-[15px] leading-snug whitespace-pre-wrap ${
                  m.role === "user"
                    ? "rounded-br-md bg-primary text-on-primary"
                    : "rounded-bl-md border border-line bg-card text-ink"
                }`}
              >
                {m.image && m.image !== "sent" && (
                  <img src={m.image} alt="food" className="mb-2 max-h-48 rounded-2xl object-cover" />
                )}
                {m.image === "sent" && (
                  <span className="mr-1.5 inline-flex -translate-y-px align-middle opacity-80">
                    <CameraIcon className="h-4 w-4" />
                  </span>
                )}
                {m.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {sending && (
          <div className="flex justify-start">
            <div className="flex gap-1 rounded-[20px] rounded-bl-md border border-line bg-card px-4 py-3.5">
              <span className="typing-dot h-2 w-2 rounded-full bg-caramel" />
              <span className="typing-dot h-2 w-2 rounded-full bg-caramel" />
              <span className="typing-dot h-2 w-2 rounded-full bg-caramel" />
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-line bg-card px-3 pt-2.5 pb-2.5">
        {error && <div className="mb-2 rounded-2xl bg-peach/25 px-3.5 py-2 text-[12px] text-ink">{error}</div>}
        {image && (
          <div className="mb-2 flex items-center gap-3">
            <img src={image} alt="" className="h-14 w-14 rounded-xl object-cover" />
            <button onClick={() => setImage(null)} className="text-[12px] text-muted underline">
              remove photo
            </button>
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex items-end gap-2"
        >
          <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={pickPhoto} />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            aria-label="Add a photo"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-card-2 text-ink transition hover:bg-line active:scale-95"
          >
            <CameraIcon />
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={image ? "Add a note (optional)…" : "I had…"}
            enterKeyHint="send"
            className="h-11 min-w-0 flex-1 rounded-full border border-line bg-surface px-4 text-[15px] text-ink outline-none transition focus:border-caramel"
          />
          <button
            type="submit"
            disabled={sending || (!input.trim() && !image)}
            aria-label="Send"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-on-primary transition active:scale-95 disabled:opacity-40"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
