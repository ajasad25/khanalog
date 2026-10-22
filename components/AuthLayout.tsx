import Link from "next/link";
import type { ReactNode } from "react";
import { Bowl, Squiggle } from "./marketing/Doodles";

/** Split-screen auth: brand panel on the left, Clerk card on the right. */
export function AuthLayout({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden flex-col justify-between border-r-[1.5px] border-ink bg-sand p-12 lg:flex">
        <Link href="/" className="flex items-center gap-2.5">
          <img src="/icon.svg" alt="" className="h-8 w-8 rounded-lg border-[1.5px] border-ink" />
          <span className="font-display text-[22px]">Khana Log</span>
        </Link>
        <div className="max-w-md">
          <Bowl className="mb-6 h-20 w-20 text-ink" />
          <p className="font-display text-[46px] leading-[1.06]">
            “Had chai and two parathas.” <span className="hl-sage">That's the whole workflow.</span>
          </p>
          <Squiggle className="mt-5 h-4 w-44 text-bark" />
          <p className="mt-5 text-sm leading-relaxed text-muted">
            Text or photo in, a logged day out. Targets from your profile, steps against intake, every day kept.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="label label-paper -rotate-2">chai = 90 kcal</span>
          <span className="label label-sage rotate-1">photo of my plate</span>
          <span className="label label-paper rotate-3">1,100 left today</span>
        </div>
      </aside>

      <main className="grid-paper flex flex-col px-6 py-8 sm:px-12">
        <div className="flex items-center justify-between lg:justify-end">
          <Link href="/" className="flex items-center gap-2.5 lg:hidden">
            <img src="/icon.svg" alt="" className="h-7 w-7 rounded-md border-[1.5px] border-ink" />
            <span className="font-display text-lg">Khana Log</span>
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
