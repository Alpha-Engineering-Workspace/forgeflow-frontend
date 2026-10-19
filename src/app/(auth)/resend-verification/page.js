import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AuthCard } from "@/components/auth/auth-card";
import { ResendVerificationForm } from "@/features/auth/components/resend-verification-form";

export const metadata = { title: "Resend verification | ForgeFlow", robots: { index: false, follow: false } };

export default function ResendVerificationPage() {
  return (
    <AuthCard eyebrow="EMAIL VERIFICATION" title="Need another link?" description="Enter the email address you registered with. If verification is needed, a fresh link will be requested. Links are valid for 12 hours.">
      <ResendVerificationForm />
      <Link href="/login" className="ff-text-link mt-7 inline-flex min-h-11 items-center gap-2 text-sm font-semibold">
        <ArrowLeft size={16} aria-hidden="true" /> Back to sign in
      </Link>
    </AuthCard>
  );
}
