import { SignUp } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Landing } from "@/components/Landing";

export default async function SignUpPage() {
  if (await getSession()) redirect("/");

  return (
    <Landing>
      <SignUp signInUrl="/login" fallbackRedirectUrl="/" />
    </Landing>
  );
}
