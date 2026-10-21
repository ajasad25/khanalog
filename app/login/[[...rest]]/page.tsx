import { SignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { demoEnabled, getSession } from "@/lib/auth";
import { DemoButton } from "@/components/DemoButton";
import { Landing } from "@/components/Landing";

export default async function LoginPage() {
  if (await getSession()) redirect("/");

  return (
    <Landing>
      <SignIn signUpUrl="/signup" fallbackRedirectUrl="/" />
      {demoEnabled() && <DemoButton />}
    </Landing>
  );
}
