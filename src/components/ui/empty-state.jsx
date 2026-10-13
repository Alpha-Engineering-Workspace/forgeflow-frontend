import { Inbox } from "lucide-react";

export function EmptyState({ title, description }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--ff-border)] bg-[var(--ff-surface)] px-6 py-12 text-center">
      <Inbox className="mx-auto mb-4 text-[var(--ff-muted)]" size={30} aria-hidden="true" />
      <h2 className="font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-[var(--ff-muted)]">{description}</p>
    </div>
  );
}
