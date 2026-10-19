export function AuthCard({ eyebrow, title, description, children }) {
  return (
    <div className="ff-auth-card w-full">
      <header className="mb-7">
        {eyebrow && <p className="ff-eyebrow mb-3">{eyebrow}</p>}
        <h1 className="text-[clamp(1.75rem,3.6vw,2.1rem)] font-semibold leading-[1.1] tracking-[-0.035em] text-[var(--ff-text-strong)]">
          {title}
        </h1>
        {description && (
          <p className="mt-3 max-w-[42ch] text-[14.5px] leading-[1.6] text-[var(--ff-muted)]">
            {description}
          </p>
        )}
      </header>
      {children}
    </div>
  );
}
