export function LoadingState() {
  return (
    <div role="status" aria-label="Loading content" className="animate-pulse rounded-xl border border-[var(--ff-border)] bg-[var(--ff-surface)] p-5">
      <div className="mb-4 h-5 w-32 rounded bg-[var(--ff-surface-soft)]" />
      <div className="mb-3 h-3 w-full rounded bg-[var(--ff-surface-soft)]" />
      <div className="h-3 w-2/3 rounded bg-[var(--ff-surface-soft)]" />
    </div>
  );
}
