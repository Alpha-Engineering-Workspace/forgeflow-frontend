// Labels and hints share the same spacing and error semantics across all forms.
export function Field({ id, label, error, hint, children, optional }) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <label
          htmlFor={id}
          className="text-[12.5px] font-semibold tracking-[-0.005em] text-[var(--ff-text-strong)]"
        >
          {label}
        </label>
        {optional && (
          <span className="text-[10.5px] font-medium uppercase tracking-wider text-[var(--ff-muted-soft)]">
            Optional
          </span>
        )}
      </div>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-[12px] leading-[1.5] text-[var(--ff-muted)]">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="flex items-center gap-1.5 text-[12.5px] leading-[1.5] text-[var(--ff-danger-text)]"
        >
          <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
          {error.message || error}
        </p>
      )}
    </div>
  );
}
