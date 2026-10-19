export function PageHeader({ eyebrow, title, description, action }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-5">
      <div className="min-w-0">
        <p className="ff-eyebrow mb-2">{eyebrow}</p>
        <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--ff-muted)]">{description}</p>
      </div>
      {action}
    </header>
  );
}
