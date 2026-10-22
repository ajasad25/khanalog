import { SignUp } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AuthLayout } from "@/components/AuthLayout";

export default async function SignUpPage() {
  if (await getSession()) redirect("/chat");

  return (
    <AuthLayout>
      <SignUp signInUrl="/login" fallbackRedirectUrl="/chat" />
    </AuthLayout>
  );
}
