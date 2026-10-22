import { semanticLabel, semanticValues } from '@/lib/semantic-labels';

export function SemanticBadge({ kind, value, className = '' }) {
  const allowed = semanticValues[kind] ?? [];
  const normalized = allowed.includes(value) ? value : 'UNKNOWN';
  return <span data-kind={kind} data-value={normalized}
    className={`ff-semantic-badge ${className}`.trim()}>{semanticLabel(value)}</span>;
}
