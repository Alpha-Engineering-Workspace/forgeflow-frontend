import { forwardRef } from "react";

export const Input = forwardRef(function Input({ className = "", ...props }, ref) {
  return (
    <input
      ref={ref}
      className={`ff-input min-h-12 w-full rounded-[10px] border border-[var(--ff-control-border)] bg-[var(--ff-surface)] px-3.5 py-3 text-[15px] text-[var(--ff-text)] outline-none placeholder:text-[var(--ff-placeholder)] disabled:cursor-not-allowed disabled:opacity-55 ${className}`}
      {...props}
    />
  );
});
