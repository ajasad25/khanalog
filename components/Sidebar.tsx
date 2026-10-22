"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/client";

const NAV = [
  { href: "/chat", label: "Chat", icon: <path d="M4 5h16v10H9l-5 4V5z" /> },
  {
    href: "/today",
    label: "Today",
    icon: (
      <>
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M4 10h16M9 3v4M15 3v4" />
      </>
    ),
  },
  {
    href: "/profile",
    label: "Profile",
    icon: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20a8 8 0 0 1 16 0" />
      </>
    ),
  },
];

function Icon({ children, active }: { children: React.ReactNode; active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.7} strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

export function Sidebar({ kind }: { kind: "user" | "demo" }) {
  const path = usePathname();
  const router = useRouter();

  async function leaveDemo() {
    await api("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r-[1.5px] border-ink bg-sand-soft lg:flex">
        <Link href="/chat" className="flex h-16 items-center gap-2.5 border-b-[1.5px] border-ink px-5">
          <img src="/icon.svg" alt="" className="h-8 w-8 rounded-lg border-[1.5px] border-ink" />
          <span className="font-display text-[22px]">Khana Log</span>
        </Link>
        <nav className="flex-1 space-y-1.5 p-3">
          {NAV.map((n) => {
            const active = path.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex h-10 items-center gap-3 rounded-full px-4 text-sm transition ${
                  active ? "border-[1.5px] border-ink bg-card font-medium shadow-press-sm" : "text-muted hover:bg-sand hover:text-ink"
                }`}
              >
                <Icon active={active}>{n.icon}</Icon>
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t-[1.5px] border-ink p-3">
          {kind === "user" ? (
            <div className="flex items-center gap-3 rounded-full px-2 py-1.5">
              <UserButton />
              <span className="text-sm text-muted">Account</span>
            </div>
          ) : (
            <div className="sticker-soft p-3">
              <span className="label label-sage -rotate-2 text-[11px]">demo sandbox</span>
              <p className="mt-2 text-[11px] leading-snug text-muted">Limited messages per day. Deleted after a week.</p>
              <div className="mt-2.5 flex gap-2">
                <Link href="/signup" className="btn-primary h-8 flex-1 px-2 text-xs">
                  Sign up
                </Link>
                <button onClick={leaveDemo} className="btn-ghost h-8 px-2.5 text-xs">
                  Leave
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-20 flex h-14 items-center justify-between border-b-[1.5px] border-ink bg-sand-soft px-4 lg:hidden">
        <Link href="/chat" className="flex items-center gap-2">
          <img src="/icon.svg" alt="" className="h-7 w-7 rounded-md border-[1.5px] border-ink" />
          <span className="font-display text-lg">Khana Log</span>
        </Link>
        {kind === "user" ? (
          <UserButton />
        ) : (
          <button onClick={leaveDemo} className="text-xs text-muted">
            Leave demo
          </button>
        )}
      </div>

      {/* Mobile bottom tabs */}
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-20 flex border-t-[1.5px] border-ink bg-sand-soft lg:hidden">
        {NAV.map((n) => {
          const active = path.startsWith(n.href);
          return (
            <Link key={n.href} href={n.href} className={`flex flex-1 flex-col items-center gap-1 py-2 text-[11px] ${active ? "font-medium text-ink" : "text-muted"}`}>
              <span className={`grid h-7 w-12 place-items-center rounded-full ${active ? "border-[1.5px] border-ink bg-card" : ""}`}>
                <Icon active={active}>{n.icon}</Icon>
              </span>
              {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="h-14 lg:hidden" aria-hidden />
    </>
  );
}
