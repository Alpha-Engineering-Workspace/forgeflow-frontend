import { RegisterForm } from "../../../features/auth/components/register-form.jsx";

export const metadata = {
  title: "Register | ForgeFlow",
};

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-[var(--ff-bg)] px-4 py-12 text-[var(--ff-text)]">
      <div className="mx-auto w-full max-w-md rounded-xl border border-[var(--ff-border)] bg-[var(--ff-surface)] p-6 shadow-sm sm:p-8">
        <div className="mb-6 h-1 w-14 rounded-full bg-[var(--ff-primary)]" />
        <h1 className="text-2xl font-semibold">Create your ForgeFlow account</h1>
        <p className="mb-8 mt-2 text-sm text-[var(--ff-muted)]">Start with your personal account. Workspaces come next.</p>
        <RegisterForm />
      </div>
    </main>
  );
}
