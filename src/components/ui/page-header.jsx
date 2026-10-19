export function PageHeader({ eyebrow, title, description, action, meta }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
      <div className="min-w-0 max-w-2xl">
        {eyebrow && (
          <div className="mb-3 flex items-center gap-2.5">
            <span className="ff-eyebrow">{eyebrow}</span>
            {meta}
          </div>
        )}
        <h1 className="text-[clamp(1.65rem,2.2vw,2rem)] font-semibold leading-[1.1] tracking-[-0.035em] text-[var(--ff-text-strong)]">
          {title}
        </h1>
        {description && (
          <p className="mt-3 max-w-xl text-[14px] leading-[1.6] text-[var(--ff-muted)]">
            {description}
          </p>
        )}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </header>
  );
}
