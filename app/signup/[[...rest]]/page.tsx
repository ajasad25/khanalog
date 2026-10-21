import { SignUp } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Landing } from "@/components/Landing";

export default async function SignUpPage() {
  if (await getSession()) redirect("/");

  return (
    <Landing>
      <div className="flex justify-center">
        <SignUp
          signInUrl="/login"
          fallbackRedirectUrl="/"
          appearance={{ elements: { cardBox: "shadow-none border border-stone-200 dark:border-stone-800", rootBox: "w-full" } }}
        />
      </div>
    </Landing>
  );
}
