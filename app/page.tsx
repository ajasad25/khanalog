import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Landing } from "@/components/marketing/Landing";

export default async function Home() {
  if (await getSession()) redirect("/chat");
  return <Landing />;
}
