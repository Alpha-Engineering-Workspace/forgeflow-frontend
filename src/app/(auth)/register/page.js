import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata = { title: "Create account | ForgeFlow" };

export default function RegisterPage() {
  return (
    <AuthCard eyebrow="GET STARTED" title="Make room for better work." description="Create your personal account first. You'll set up your workspace after signing in.">
      <RegisterForm />
    </AuthCard>
  );
}
