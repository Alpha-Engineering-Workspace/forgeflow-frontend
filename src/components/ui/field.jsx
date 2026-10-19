// Labels and hints share the same spacing and error semantics across all forms.
export function Field({ id, label, error, hint, children }) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-semibold text-[var(--ff-text)]">{label}</label>
      {children}
      {hint && <p id={`${id}-hint`} className="text-xs leading-5 text-[var(--ff-muted)]">{hint}</p>}
      {error && <p id={`${id}-error`} role="alert" className="text-sm leading-5 text-[var(--ff-danger-text)]">{error.message || error}</p>}
    </div>
  );
}
