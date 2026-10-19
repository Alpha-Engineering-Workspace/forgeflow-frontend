export function AuthCard({ eyebrow, title, description, children }) {
  return (
    <div className="ff-auth-card w-full">
      <div className="mb-8">
        <p className="ff-eyebrow mb-4">{eyebrow}</p>
        <h1 className="text-[clamp(2rem,5vw,2.8rem)] leading-[1.12] font-semibold tracking-[-0.05em] text-[var(--ff-text)]">{title}</h1>
        <p className="mt-4 max-w-[38ch] text-[15px] leading-7 text-[var(--ff-muted)]">{description}</p>
      </div>
      {children}
    </div>
  );
}
