"use client";

import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "./input";

// A wrapper around Input: RHF still owns input value/ref/validation.
export const PasswordField = forwardRef(function PasswordField({ id, ...props }, ref) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input {...props} id={id} ref={ref} type={visible ? "text" : "password"} className="pr-14" />
      <button
        type="button"
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        aria-controls={id}
        onClick={() => setVisible((value) => !value)}
        className="absolute inset-y-0 right-1 inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-[var(--ff-muted)] hover:text-[var(--ff-text)]"
      >
        {visible ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}
      </button>
    </div>
  );
});
