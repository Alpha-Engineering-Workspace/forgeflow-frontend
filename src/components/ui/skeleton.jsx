export function Skeleton({ className = "", ...props }) {
  return <div aria-hidden="true" className={`ff-skeleton ${className}`} {...props} />;
}

export function DashboardSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading dashboard"
      className="min-h-dvh bg-[var(--ff-bg)]"
      style={{ paddingLeft: "var(--ff-sidebar-w)" }}
    >
      <span className="sr-only">Loading your workspace…</span>
      <aside
        aria-hidden="true"
        className="ff-rail fixed inset-y-0 left-0 hidden w-[var(--ff-sidebar-w)] lg:block"
      />
      <div className="flex h-16 items-center justify-between border-b border-[var(--ff-border-faint)] bg-[var(--ff-surface)]/85 px-4 backdrop-blur sm:px-7">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-44 rounded-[10px]" />
      </div>
      <div className="mx-auto w-full max-w-[var(--ff-container)] space-y-8 px-4 py-8 sm:px-7 lg:p-10">
        <div className="space-y-3">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-9 w-80 max-w-full" />
          <Skeleton className="h-4 w-[28rem] max-w-full" />
        </div>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.42fr)_minmax(310px,0.9fr)]">
          <Skeleton className="h-80 w-full rounded-[var(--ff-radius-panel)]" />
          <Skeleton className="h-80 w-full rounded-[var(--ff-radius-panel)]" />
        </div>
      </div>
    </div>
  );
}
