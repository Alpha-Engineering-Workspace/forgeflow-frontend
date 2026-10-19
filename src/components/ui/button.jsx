const base =
  "relative inline-flex items-center justify-center gap-2 rounded-[10px] font-semibold tracking-[-0.005em] " +
  "transition-[background-color,border-color,box-shadow,color,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] " +
  "disabled:cursor-not-allowed disabled:opacity-55 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ff-bg)] focus-visible:ring-[var(--ff-focus)] " +
  "active:translate-y-px motion-reduce:active:translate-y-0 " +
  "[&_svg]:shrink-0 select-none";

const variants = {
  primary:
    "bg-[var(--ff-primary)] text-[var(--ff-on-primary)] border border-[var(--ff-primary)] shadow-[var(--ff-shadow-sm)] " +
    "hover:bg-[var(--ff-primary-hover)] hover:border-[var(--ff-primary-hover)] hover:shadow-[var(--ff-glow-soft)] " +
    "focus-visible:shadow-[var(--ff-glow-soft)]",
  secondary:
    "bg-[var(--ff-surface)] text-[var(--ff-text)] border border-[var(--ff-border)] shadow-[var(--ff-shadow-xs)] " +
    "hover:bg-[var(--ff-surface-2)] hover:border-[var(--ff-border-strong)] hover:text-[var(--ff-text-strong)]",
  ghost:
    "bg-transparent text-[var(--ff-text)] border border-transparent " +
    "hover:bg-[var(--ff-surface-2)] hover:text-[var(--ff-text-strong)]",
  subtle:
    "bg-[var(--ff-primary-soft)] text-[var(--ff-primary)] border border-transparent " +
    "hover:bg-[var(--ff-primary-soft-hover)]",
  outline:
    "bg-transparent text-[var(--ff-text)] border border-[var(--ff-border-strong)] " +
    "hover:bg-[var(--ff-surface)] hover:border-[var(--ff-primary)] hover:text-[var(--ff-primary)]",
  danger:
    "bg-[#DC2626] text-white border border-[#DC2626] shadow-[var(--ff-shadow-sm)] " +
    "hover:bg-[#B91C1C] hover:border-[#B91C1C]",
};

const sizes = {
  xs: "min-h-7 h-7 px-2.5 text-[12px] rounded-[8px]",
  sm: "min-h-9 h-9 px-3.5 text-[13px] rounded-[9px]",
  md: "min-h-11 h-11 px-5 text-[13.5px]",
  lg: "min-h-12 h-12 px-6 text-[14.5px] rounded-[12px]",
  icon: "min-h-10 h-10 w-10 rounded-[10px] p-0",
};

export function Button({
  children,
  className = "",
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      className={`${base} ${sizes[size] ?? sizes.md} ${variants[variant] ?? variants.primary} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
