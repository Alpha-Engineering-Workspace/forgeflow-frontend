"use client";

import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "./input";

export const PasswordField = forwardRef(function PasswordField({ id, ...props }, ref) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input
        {...props}
        id={id}
        ref={ref}
        type={visible ? "text" : "password"}
        className="pr-12"
      />
      <button
        type="button"
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        aria-controls={id}
        onClick={() => setVisible((value) => !value)}
        className="absolute inset-y-0 right-1.5 my-1 inline-flex min-h-10 min-w-10 items-center justify-center rounded-[8px] text-[var(--ff-muted-soft)] transition-colors hover:bg-[var(--ff-surface-2)] hover:text-[var(--ff-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ff-focus)]"
      >
        {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
      </button>
    </div>
  );
});
