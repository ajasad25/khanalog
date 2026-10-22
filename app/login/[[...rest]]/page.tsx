import { SignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { demoEnabled, getSession } from "@/lib/auth";
import { AuthLayout } from "@/components/AuthLayout";
import { DemoButton } from "@/components/DemoButton";

export default async function LoginPage() {
  if (await getSession()) redirect("/chat");

  return (
    <AuthLayout
      footer={
        demoEnabled() ? (
          <div className="mt-6 flex items-center justify-between rounded-xl border border-line bg-card px-4 py-3 text-sm">
            <span className="text-muted">Just looking around?</span>
            <DemoButton className="btn-ghost h-8 px-3 text-sm" label="Open the demo" />
          </div>
        ) : null
      }
    >
      <SignIn signUpUrl="/signup" fallbackRedirectUrl="/chat" />
    </AuthLayout>
  );
}
