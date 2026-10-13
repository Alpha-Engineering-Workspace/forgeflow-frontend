const variants = {
  primary: "bg-[var(--ff-primary)] text-[var(--ff-on-primary)] hover:bg-[var(--ff-primary-hover)]",
  secondary: "border border-[var(--ff-border)] bg-[var(--ff-surface)] text-[var(--ff-text)] hover:bg-[var(--ff-surface-soft)]",
  ghost: "text-[var(--ff-text)] hover:bg-[var(--ff-surface-soft)]",
};

export function Button({ children, className = "", variant = "primary", type = "button", ...props }) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant] ?? variants.primary} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
