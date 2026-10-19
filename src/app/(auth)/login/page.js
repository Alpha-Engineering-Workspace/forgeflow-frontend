import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata = { title: "Sign in | ForgeFlow" };

export default function LoginPage() {
  return (
    <AuthCard eyebrow="WELCOME BACK" title="Good to have you back." description="Sign in with your verified email to pick up where you left off.">
      <LoginForm />
    </AuthCard>
  );
}
