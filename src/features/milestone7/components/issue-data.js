export const STATUSES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
export const TYPES = ['TASK', 'BUG', 'FEATURE'];
export const display = (value) => value?.replaceAll('_', ' ') ?? '';

export async function domainRequest(path, options = {}) {
  const response = await fetch(`/api/backend/workspaces${path}`, { cache: 'no-store', ...options });
  const data = response.status === 204 ? {} : await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error?.message || 'Request failed. Try again.');
    error.status = response.status;
    error.code = data.error?.code;
    throw error;
  }
  return data;
}
export function mutationOptions(method, body) {
  return { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) };
}
export const issuePath = (workspaceId, projectId) => `/${workspaceId}/projects/${projectId}/issues`;
