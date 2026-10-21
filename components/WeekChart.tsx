"use client";

import { motion } from "framer-motion";
import { fmt } from "@/lib/client";
import type { DaySummary } from "@/lib/tools";

/** Seven bars of calories eaten, with the goal as a dashed line. */
export function WeekChart({ days, goal }: { days: DaySummary[]; goal: number | null }) {
  const W = 320;
  const H = 120;
  const padX = 8;
  const barGap = 10;
  const barW = (W - padX * 2 - barGap * (days.length - 1)) / days.length;
  const max = Math.max(goal ?? 0, ...days.map((d) => d.eaten), 1) * 1.15;
  const y = (v: number) => H - (v / max) * (H - 18);

  return (
    <svg viewBox={`0 0 ${W} ${H + 18}`} className="w-full" role="img" aria-label="Calories eaten over the last 7 days">
      {goal ? (
        <line
          x1={padX}
          x2={W - padX}
          y1={y(goal)}
          y2={y(goal)}
          stroke="currentColor"
          className="text-stone-300 dark:text-stone-600"
          strokeDasharray="4 4"
          strokeWidth="1"
        />
      ) : null}
      {days.map((d, i) => {
        const x = padX + i * (barW + barGap);
        const over = goal !== null && d.eaten > goal;
        const label = new Date(`${d.date}T00:00:00`).toLocaleDateString("en-US", { weekday: "short" })[0];
        const isToday = i === days.length - 1;
        return (
          <g key={d.date}>
            <motion.rect
              x={x}
              width={barW}
              rx={6}
              initial={{ y: H, height: 0 }}
              animate={{ y: y(d.eaten), height: Math.max(0, H - y(d.eaten)) }}
              transition={{ type: "spring", stiffness: 140, damping: 18, delay: i * 0.03 }}
              className={over ? "fill-red-400" : isToday ? "fill-accent" : "fill-accent/50"}
            />
            {d.eaten > 0 && (
              <text x={x + barW / 2} y={y(d.eaten) - 4} textAnchor="middle" className="fill-stone-500 text-[9px] tabular-nums">
                {fmt(d.eaten)}
              </text>
            )}
            <text
              x={x + barW / 2}
              y={H + 13}
              textAnchor="middle"
              className={`text-[10px] ${isToday ? "fill-stone-900 font-semibold dark:fill-stone-100" : "fill-stone-400"}`}
            >
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
