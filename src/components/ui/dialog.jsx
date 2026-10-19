"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

export function Dialog({ open, onClose, title, children }) {
  const dialogRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onCancel={onClose}
      aria-labelledby={titleId}
      className="m-auto w-[min(92vw,500px)] rounded-[var(--ff-radius-panel)] border border-[var(--ff-border-faint)] bg-[var(--ff-surface)] p-6 text-[var(--ff-text)] shadow-[var(--ff-shadow-2xl)] backdrop:bg-black/55 backdrop:backdrop-blur-sm"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id={titleId} className="text-[16.5px] font-semibold tracking-[-0.025em] text-[var(--ff-text-strong)]">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] text-[var(--ff-muted)] transition-colors hover:bg-[var(--ff-surface-2)] hover:text-[var(--ff-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ff-focus)]"
        >
          <X size={17} aria-hidden="true" />
        </button>
      </div>
      {children}
    </dialog>
  );
}
