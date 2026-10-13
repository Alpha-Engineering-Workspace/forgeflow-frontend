import { forwardRef } from "react";

export const Input = forwardRef(function Input({ className = "", ...props }, ref) {
  return (
    <input
      ref={ref}
      className={`min-h-11 w-full rounded-lg border border-[var(--ff-control-border,#7C8AA0)] bg-[var(--ff-surface)] px-3 py-2 text-sm text-[var(--ff-text)] placeholder:text-[var(--ff-muted)] ${className}`}
      {...props}
    />
  );
});
