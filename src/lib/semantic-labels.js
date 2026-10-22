export const semanticValues = Object.freeze({
  status: ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'],
  priority: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
  type: ['TASK', 'BUG', 'FEATURE'],
  project: ['ACTIVE', 'ARCHIVED'],
  role: ['OWNER', 'ADMIN', 'MEMBER'],
});
export function semanticLabel(value) {
  if (typeof value !== 'string') return 'Unknown';
  const readable = value.replaceAll('_', ' ').toLowerCase();
  return readable.replace(/\b\w/g, (character) => character.toUpperCase());
}
