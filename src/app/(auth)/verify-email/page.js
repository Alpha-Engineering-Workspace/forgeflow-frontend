import { Suspense } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { VerifyEmailForm } from "@/features/auth/components/verify-email-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Verify email | ForgeFlow",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function VerifyEmailPage() {
  return (
    <AuthCard eyebrow="ONE QUICK CHECK" title="Verify your email." description="Confirm that you can access your inbox. For security, the link is only used when you press the button below.">
      <Suspense fallback={<div role="status" aria-label="Preparing verification" className="space-y-5"><Skeleton className="h-5 w-4/5" /><Skeleton className="h-12 w-full" /></div>}>
        <VerifyEmailForm />
      </Suspense>
    </AuthCard>
  );
}
