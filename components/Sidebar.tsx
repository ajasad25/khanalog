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

function Icon({ children, active, size = 20 }: { children: React.ReactNode; active: boolean; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className="shrink-0" fill="none" stroke="currentColor" strokeWidth={active ? 2.1 : 1.8} strokeLinecap="round" strokeLinejoin="round">
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
      {/* Desktop: a narrow icon rail with big sticker targets. */}
      <aside className="sticky top-0 hidden h-dvh w-[92px] shrink-0 flex-col items-center border-r-[1.5px] border-ink bg-sand-soft py-4 lg:flex">
        <Link href="/chat" title="Khana Log" className="grid h-12 w-12 place-items-center rounded-2xl border-[1.5px] border-ink bg-ink shadow-press-sm transition active:translate-y-[2px] active:shadow-none">
          <img src="/icon.svg" alt="Khana Log" className="h-9 w-9 rounded-xl" />
        </Link>
        <nav className="mt-8 flex flex-1 flex-col items-center gap-3">
          {NAV.map((n) => {
            const active = path.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex h-[68px] w-[68px] flex-col items-center justify-center gap-1.5 rounded-2xl text-[11px] font-medium transition ${
                  active
                    ? "border-[1.5px] border-ink bg-card text-ink shadow-press-sm"
                    : "text-muted hover:-rotate-2 hover:bg-sand hover:text-ink"
                }`}
              >
                <Icon active={active} size={24}>
                  {n.icon}
                </Icon>
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex flex-col items-center gap-3">
          {kind === "user" ? (
            <div className="grid h-12 w-12 place-items-center rounded-full border-[1.5px] border-ink bg-card shadow-press-sm">
              <UserButton />
            </div>
          ) : (
            <>
              <span className="label label-sage -rotate-6 px-2 py-0.5 text-[10px]">demo</span>
              <Link href="/signup" title="Create an account" className="btn-primary h-10 w-[68px] px-0 text-xs">
                Sign up
              </Link>
              <button onClick={leaveDemo} title="Leave the demo" className="text-[11px] text-muted hover:text-ink">
                Leave
              </button>
            </>
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

      {/* Mobile bottom nav: a floating pill, three big targets. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:hidden">
        <nav className="pointer-events-auto mx-auto flex h-16 max-w-sm items-center gap-1 rounded-full border-[1.5px] border-ink bg-card p-1.5 shadow-sticker">
          {NAV.map((n) => {
            const active = path.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex h-full flex-1 items-center justify-center gap-2 rounded-full text-[13px] font-medium transition ${
                  active ? "bg-ink text-paper" : "text-ink hover:bg-sand-soft"
                }`}
              >
                <Icon active={active} size={22}>
                  {n.icon}
                </Icon>
                <span className={active ? "" : "sr-only min-[400px]:not-sr-only"}>{n.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
