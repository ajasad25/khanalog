import { SignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { demoEnabled, getSession } from "@/lib/auth";
import { DemoButton } from "@/components/DemoButton";
import { Landing } from "@/components/Landing";

export default async function LoginPage() {
  if (await getSession()) redirect("/");

  return (
    <Landing>
      <div className="flex justify-center">
        <SignIn
          signUpUrl="/signup"
          fallbackRedirectUrl="/"
          appearance={{ elements: { cardBox: "shadow-none border border-stone-200 dark:border-stone-800", rootBox: "w-full" } }}
        />
      </div>
      {demoEnabled() && <DemoButton />}
    </Landing>
  );
}
