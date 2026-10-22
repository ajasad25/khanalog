import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getSession } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-dvh">
      <Sidebar kind={session.kind} />
      {/* Mobile: clear the fixed top bar (3.5rem) and the floating nav pill (5.25rem + safe area). */}
      <main className="flex min-h-dvh min-w-0 flex-1 flex-col pt-14 pb-[calc(5.25rem+env(safe-area-inset-bottom))] lg:pt-0 lg:pb-0">{children}</main>
    </div>
  );
}
