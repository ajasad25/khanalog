/**
 * A static, honest render of the product: the same layout and tokens the real
 * app uses, with sample data. No animation, no fake cursor.
 */
const MESSAGES: { role: "user" | "assistant"; text: string }[] = [
  { role: "user", text: "had chai and 2 parathas" },
  { role: "assistant", text: "Logged chai (90) and 2 parathas (500).\nToday: 590 / 1,450 kcal" },
  { role: "user", text: "walked 6,000 steps" },
  { role: "assistant", text: "6,000 steps, about 240 kcal burned. 1,100 left today." },
];

const ENTRIES: [string, string, number][] = [
  ["Chai", "1 cup", 90],
  ["Paratha", "2", 500],
];

export function ProductPreview() {
  const R = 30;
  const C = 2 * Math.PI * R;
  const ratio = 590 / 1450;
  return (
    <div className="card overflow-hidden">
      {/* window chrome */}
      <div className="flex items-center gap-1.5 border-b border-line px-3 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-sand" />
        <span className="h-2.5 w-2.5 rounded-full bg-sand" />
        <span className="h-2.5 w-2.5 rounded-full bg-sand" />
        <span className="ml-3 text-[11px] text-faint">khanalog.vercel.app/chat</span>
      </div>
      <div className="grid sm:grid-cols-[1fr_200px]">
        {/* chat */}
        <div className="flex flex-col border-r border-line">
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <span className="text-[13px] font-medium">Chat</span>
            <span className="text-[11px] text-muted">Thursday</span>
          </div>
          <div className="space-y-2.5 px-4 py-4">
            {MESSAGES.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] whitespace-pre-wrap rounded-lg px-3 py-2 text-[12.5px] leading-snug ${
                    m.role === "user" ? "bg-ink text-paper" : "border border-line bg-paper text-ink"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-auto flex items-center gap-2 border-t border-line px-3 py-2.5">
            <span className="h-8 w-8 rounded-md border border-line" />
            <span className="h-8 flex-1 rounded-md border border-line bg-paper px-3 text-[12px] leading-8 text-faint">I had…</span>
            <span className="h-8 w-8 rounded-md bg-ink" />
          </div>
        </div>
        {/* rail */}
        <div className="hidden bg-paper p-4 sm:block">
          <p className="eyebrow mb-3">Today</p>
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 72 72" className="h-[72px] w-[72px] -rotate-90">
              <circle cx="36" cy="36" r={R} fill="none" strokeWidth="6" className="stroke-sand" />
              <circle
                cx="36"
                cy="36"
                r={R}
                fill="none"
                strokeWidth="6"
                strokeLinecap="round"
                className="stroke-bark"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - ratio)}
              />
            </svg>
            <div>
              <div className="text-xl font-semibold tabular-nums">590</div>
              <div className="text-[11px] text-muted">of 1,450 kcal</div>
            </div>
          </div>
          <dl className="mt-4 space-y-1.5 text-[12px]">
            <div className="flex justify-between"><dt className="text-muted">Burned</dt><dd className="tabular-nums">240</dd></div>
            <div className="flex justify-between font-medium"><dt>Remaining</dt><dd className="tabular-nums">1,100</dd></div>
          </dl>
          <p className="eyebrow mt-5 mb-2">Eaten</p>
          <ul className="space-y-1.5">
            {ENTRIES.map(([n, q, k]) => (
              <li key={n} className="flex items-center justify-between rounded-md border border-line bg-card px-2.5 py-1.5 text-[12px]">
                <span>
                  {n} <span className="text-faint">· {q}</span>
                </span>
                <span className="tabular-nums">{k}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
