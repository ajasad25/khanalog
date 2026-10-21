"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { api, fileToDataUrl, fmt, type StateView } from "@/lib/client";

type Msg = { id: string; role: "user" | "assistant"; content: string; image?: string; pending?: boolean };

const SUGGESTIONS = ["I had chai", "Walked 5,000 steps", "What's left today?", "Set up my profile"];

let nextId = 0;
const mkId = () => `m${Date.now()}-${nextId++}`;

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
      <header className="border-b border-stone-200 px-4 pt-[max(12px,env(safe-area-inset-top))] pb-3 dark:border-stone-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/icon.svg" alt="" className="h-8 w-8 rounded-xl" />
            <div>
              <div className="text-sm font-semibold leading-tight">Calorie Bot</div>
              <div className="text-[11px] text-stone-400">
                {view?.kind === "demo" && view.demo
                  ? `Demo · ${view.demo.used}/${view.demo.limit} messages today`
                  : "Your tracker"}
              </div>
            </div>
          </div>
          {today && (
            <div className="text-right">
              <div className="text-sm font-semibold tabular-nums">
                {fmt(today.eaten)}
                {goal ? <span className="text-stone-400"> / {fmt(goal)}</span> : null}
                <span className="ml-1 text-[11px] font-normal text-stone-400">kcal</span>
              </div>
              <div className="text-[11px] text-stone-400">
                {goal ? `${fmt(today.remaining)} left` : "no goal yet"}
              </div>
            </div>
          )}
        </div>
        {goal ? (
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
            <motion.div
              className={`h-full rounded-full ${progress >= 1 ? "bg-red-500" : "bg-accent"}`}
              initial={false}
              animate={{ width: `${progress * 100}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
            />
          </div>
        ) : null}
      </header>

      {/* Messages */}
      <div ref={listRef} className="scrollbar-none flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {messages.length === 0 && !sending && (
          <div className="mt-10 text-center">
            <div className="text-4xl">🥗</div>
            <p className="mt-3 text-sm text-stone-500">
              Tell me what you ate, send a photo of your plate, or set up your profile.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-600 transition active:scale-95 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300"
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
                className={`max-w-[82%] rounded-2xl px-3.5 py-2 text-[15px] leading-snug whitespace-pre-wrap ${
                  m.role === "user"
                    ? "rounded-br-md bg-accent text-white"
                    : "rounded-bl-md bg-stone-100 text-stone-900 dark:bg-stone-800 dark:text-stone-100"
                }`}
              >
                {m.image && m.image !== "sent" && (
                  <img src={m.image} alt="food" className="mb-1.5 max-h-48 rounded-xl object-cover" />
                )}
                {m.image === "sent" && <span className="mr-1">📷</span>}
                {m.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {sending && (
          <div className="flex justify-start">
            <div className="flex gap-1 rounded-2xl rounded-bl-md bg-stone-100 px-4 py-3 dark:bg-stone-800">
              <span className="typing-dot h-2 w-2 rounded-full bg-stone-400" />
              <span className="typing-dot h-2 w-2 rounded-full bg-stone-400" />
              <span className="typing-dot h-2 w-2 rounded-full bg-stone-400" />
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-stone-200 px-3 pt-2 pb-2 dark:border-stone-800">
        {error && (
          <div className="mb-2 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}
        {image && (
          <div className="mb-2 flex items-center gap-2">
            <img src={image} alt="" className="h-14 w-14 rounded-xl object-cover" />
            <button onClick={() => setImage(null)} className="text-xs text-stone-500 underline">
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
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-stone-100 text-stone-600 transition active:scale-95 dark:bg-stone-800 dark:text-stone-300"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 8a2 2 0 0 1 2-2h2l1.5-2h5L16 6h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
              <circle cx="12" cy="13" r="3.5" />
            </svg>
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={image ? "Add a note (optional)…" : "I had…"}
            enterKeyHint="send"
            className="h-11 min-w-0 flex-1 rounded-full border border-stone-200 bg-stone-50 px-4 text-[15px] outline-none focus:border-accent dark:border-stone-700 dark:bg-stone-950"
          />
          <button
            type="submit"
            disabled={sending || (!input.trim() && !image)}
            aria-label="Send"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-white transition active:scale-95 disabled:opacity-40"
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
