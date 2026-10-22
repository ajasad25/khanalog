"use client";

import { useState } from "react";
import { fmt } from "@/lib/client";
import type { DaySummary } from "@/lib/tools";

/** Seven bars of calories eaten against the goal line. Hover a bar for the exact number. */
export function WeekChart({ days, goal }: { days: DaySummary[]; goal: number | null }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 560;
  const H = 180;
  const padL = 36;
  const padR = 8;
  const padT = 14;
  const padB = 26;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const gap = 18;
  const barW = (innerW - gap * (days.length - 1)) / days.length;
  const max = Math.max(goal ?? 0, ...days.map((d) => d.eaten), 1) * 1.1;
  const y = (v: number) => padT + innerH - (v / max) * innerH;
  const ticks = [0, 0.5, 1].map((t) => Math.round((max * t) / 100) * 100);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Calories eaten over the last 7 days">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} className="stroke-line" strokeWidth="1" />
            <text x={padL - 8} y={y(t) + 3} textAnchor="end" className="fill-faint text-[10px] tabular-nums">
              {fmt(t)}
            </text>
          </g>
        ))}
        {goal ? (
          <g>
            <line x1={padL} x2={W - padR} y1={y(goal)} y2={y(goal)} className="stroke-sage" strokeDasharray="3 4" strokeWidth="1.2" />
            <text x={W - padR} y={y(goal) - 5} textAnchor="end" className="fill-sage text-[10px] font-medium">
              goal {fmt(goal)}
            </text>
          </g>
        ) : null}
        {days.map((d, i) => {
          const x = padL + i * (barW + gap);
          const over = goal !== null && d.eaten > goal;
          const isToday = i === days.length - 1;
          const label = new Date(`${d.date}T00:00:00`).toLocaleDateString("en-US", { weekday: "short" });
          const h = Math.max(0, padT + innerH - y(d.eaten));
          return (
            <g key={d.date} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={x} y={padT} width={barW} height={innerH} fill="transparent" />
              <rect
                x={x}
                y={y(d.eaten)}
                width={barW}
                height={h}
                rx={4}
                className={`transition-opacity ${over ? "fill-bark" : isToday ? "fill-ink" : "fill-tan"} ${hover !== null && hover !== i ? "opacity-50" : ""}`}
              />
              {hover === i && d.eaten > 0 && (
                <text x={x + barW / 2} y={y(d.eaten) - 6} textAnchor="middle" className="fill-ink text-[11px] font-medium tabular-nums">
                  {fmt(d.eaten)}
                </text>
              )}
              <text
                x={x + barW / 2}
                y={H - 8}
                textAnchor="middle"
                className={`text-[11px] ${isToday ? "fill-ink font-medium" : "fill-muted"}`}
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
