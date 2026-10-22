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
      <main className="flex min-h-dvh min-w-0 flex-1 flex-col pb-16 lg:pb-0">{children}</main>
    </div>
  );
}
