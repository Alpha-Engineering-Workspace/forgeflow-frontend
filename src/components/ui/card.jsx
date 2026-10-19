export function Card({ children, className = "" }) {
  return (
    <section
      className={`ff-card rounded-[var(--ff-radius-card)] border border-[var(--ff-border-faint)] bg-[var(--ff-surface)] p-5 shadow-[var(--ff-shadow-xs)] ${className}`}
    >
      {children}
    </section>
  );
}
