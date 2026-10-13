export function Card({ children, className = "" }) {
  return (
    <section className={`rounded-xl border border-[var(--ff-border)] bg-[var(--ff-surface)] p-5 shadow-sm ${className}`}>
      {children}
    </section>
  );
}
