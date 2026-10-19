export function Skeleton({ className = "", ...props }) {
  return <div aria-hidden="true" className={`ff-skeleton rounded-lg bg-[var(--ff-surface-soft)] ${className}`} {...props} />;
}

export function DashboardSkeleton() {
  return (
    <div role="status" aria-label="Loading dashboard" className="min-h-dvh bg-[var(--ff-bg)] lg:pl-[232px]">
      <span className="sr-only">Loading your workspace…</span>
      <aside aria-hidden="true" className="fixed inset-y-0 left-0 hidden w-[232px] bg-[var(--ff-sidebar)] lg:block" />
      <div className="flex h-16 items-center justify-between border-b border-[var(--ff-border)] bg-[var(--ff-surface)] px-4 sm:px-7">
        <Skeleton className="h-5 w-28" /><Skeleton className="h-10 w-32" />
      </div>
      <div className="mx-auto w-full max-w-[1220px] space-y-8 px-4 py-8 sm:px-7 lg:p-10">
        <div className="space-y-3"><Skeleton className="h-4 w-32" /><Skeleton className="h-10 w-72 max-w-full" /><Skeleton className="h-5 w-96 max-w-full" /></div>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.42fr)_minmax(310px,0.9fr)]">
          <Skeleton className="h-80 w-full rounded-2xl" /><Skeleton className="h-80 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
