import Link from "next/link";
import type { ReactNode } from "react";

/** Split-screen auth: brand statement on the left, Clerk card on the right. */
export function AuthLayout({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden flex-col justify-between bg-ink p-12 text-paper lg:flex">
        <Link href="/" className="flex items-center gap-2.5">
          <img src="/icon.svg" alt="" className="h-7 w-7 rounded-md ring-1 ring-paper/20" />
          <span className="text-[15px] font-semibold tracking-tight">Khana Log</span>
        </Link>
        <div className="max-w-md">
          <p className="font-display text-[44px] leading-[1.08]">
            “Had chai and two parathas.” <span className="text-tan">That's the whole workflow.</span>
          </p>
          <p className="mt-6 text-sm leading-relaxed text-paper/70">
            Text or photo in, a logged day out. Targets from your profile, steps against intake, every day kept.
          </p>
        </div>
        <ul className="flex gap-6 text-xs text-paper/50">
          <li>Clerk</li>
          <li>Neon Postgres</li>
          <li>OpenRouter</li>
          <li>Vercel</li>
        </ul>
      </aside>

      <main className="flex flex-col px-6 py-8 sm:px-12">
        <div className="flex items-center justify-between lg:justify-end">
          <Link href="/" className="flex items-center gap-2.5 lg:hidden">
            <img src="/icon.svg" alt="" className="h-7 w-7 rounded-md" />
            <span className="text-[15px] font-semibold tracking-tight">Khana Log</span>
          </Link>
          <Link href="/" className="text-sm text-muted hover:text-ink">
            Back to site
          </Link>
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          {children}
          {footer}
        </div>
      </main>
    </div>
  );
}
