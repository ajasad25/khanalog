"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  {
    href: "/",
    label: "Chat",
    icon: <path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4V5z" />,
  },
  {
    href: "/today",
    label: "Today",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
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

export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="safe-bottom flex border-t border-line bg-card px-2">
      {tabs.map((t) => {
        const active = path === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition ${
              active ? "text-ink" : "text-muted hover:text-ink"
            }`}
          >
            <span className={`grid h-8 w-12 place-items-center rounded-full transition ${active ? "bg-card-2" : ""}`}>
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={active ? 2.2 : 1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {t.icon}
              </svg>
            </span>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
