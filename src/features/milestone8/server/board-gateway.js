import 'server-only';
import { z } from 'zod';
import { workspacePrincipal } from '@/features/workspaces/server/workspace-gateway';

const uuid = z.uuid();
const statuses = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const types = ['TASK', 'BUG', 'FEATURE'];
const moveSchema = z.strictObject({
  issueId: uuid,
  toStatus: z.enum(statuses),
  targetIndex: z.number().int().nonnegative(),
  expectedBoardVersion: z.number().int().min(1),
  expectedIssueVersion: z.number().int().min(1),
});
const safeVersion = (value) => Number.isSafeInteger(value) && value >= 1;
const safePosition = (value) => value === null ||
  (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) ||
  (typeof value === 'string' && /^\d{1,16}$/.test(value));

function failure(status, code, message) {
  return Response.json({ error: { code, message } }, { status, headers: { 'Cache-Control': 'no-store' } });
}
function gatewayURL(workspaceId, projectId, operation) {
  try {
    const url = new URL(process.env.FORGEFLOW_GATEWAY_URL);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
      url.pathname !== '/' || url.search || url.hash) return null;
    url.pathname = `/api/workspaces/${workspaceId}/projects/${projectId}/board${operation === 'move' ? '/moves' : ''}`;
    return url;
  } catch { return null; }
}
function copyIssue(issue, workspaceId, projectId) {
  if (!issue || !uuid.safeParse(issue.id).success || issue.workspaceId !== workspaceId ||
    issue.projectId !== projectId || !safeVersion(issue.version) ||
    !statuses.includes(issue.status) || !types.includes(issue.type) || !priorities.includes(issue.priority) ||
    typeof issue.title !== 'string' || typeof issue.description !== 'string' ||
    !safePosition(issue.boardPosition)) return null;
  if (issue.assigneeId != null && !uuid.safeParse(issue.assigneeId).success) return null;
  return { id: issue.id, workspaceId, projectId, title: issue.title, description: issue.description,
    type: issue.type, status: issue.status, priority: issue.priority,
    assigneeId: issue.assigneeId ?? null, boardPosition: issue.boardPosition,
    version: issue.version };
}
async function parseMove(request) {
  if (request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() !== 'application/json') return null;
  if (Number(request.headers.get('content-length') || 0) > 2048) return null;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > 2048) return null;
    const parsed = moveSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch { return null; }
}

// Explicit Next route handlers choose the upstream endpoint; no browser-controlled proxy path.
export async function handleBoardRequest(request, {
  operation, workspaceId, projectId, authorize = workspacePrincipal, fetchImpl = fetch,
}) {
  if (!uuid.safeParse(workspaceId).success || !uuid.safeParse(projectId).success) {
    return failure(400, 'VALIDATION_ERROR', 'Invalid workspace or project ID');
  }
  if (!['read', 'move'].includes(operation)) return failure(404, 'NOT_FOUND', 'Route not found');
  if (new URL(request.url).search) return failure(400, 'VALIDATION_ERROR', 'Unexpected query');
  const method = operation === 'read' ? 'GET' : 'POST';
  if (request.method !== method) return failure(405, 'METHOD_NOT_ALLOWED', 'Method not allowed');
  if (operation === 'move' && (!request.headers.get('origin') ||
    request.headers.get('origin') !== new URL(request.url).origin)) {
    return failure(403, 'FORBIDDEN_ORIGIN', 'Invalid origin');
  }
  const body = operation === 'move' ? await parseMove(request) : undefined;
  if (operation === 'move' && !body) return failure(400, 'VALIDATION_ERROR', 'Invalid move request');
  const url = gatewayURL(workspaceId, projectId, operation);
  const key = process.env.GATEWAY_BFF_KEY;
  if (!url || !key || key.length < 32) return failure(503, 'NOT_CONFIGURED', 'Board service unavailable');
  let principal;
  try { principal = await authorize(request); } catch { return failure(503, 'SESSION_UNAVAILABLE', 'Session unavailable'); }
  if (!principal?.accessToken) return failure(401, 'UNAUTHORIZED', 'Sign in to continue');
  try {
    const upstream = await fetchImpl(url, {
      method,
      headers: { 'content-type': 'application/json', 'x-forgeflow-bff-key': key,
        authorization: `Bearer ${principal.accessToken}` },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(5000), cache: 'no-store',
    });
    if (![200, 400, 401, 403, 404, 409, 429, 503].includes(upstream.status)) {
      return failure(502, 'UPSTREAM_INVALID', 'Board service unavailable');
    }
    const data = await upstream.json();
    if (!data || typeof data !== 'object') return failure(502, 'UPSTREAM_INVALID', 'Board service unavailable');
    if (!upstream.ok) {
      if (upstream.status === 429) {
        const retry = upstream.headers.get('retry-after');
        const headers = { 'Cache-Control': 'no-store' };
        if (retry && /^\d+$/.test(retry)) headers['Retry-After'] = retry;
        return Response.json({ error: { code: 'RATE_LIMITED', message: 'Too many requests' } }, { status: 429, headers });
      }
      return failure(upstream.status, typeof data.error?.code === 'string' ? data.error.code : 'BOARD_ERROR',
        typeof data.error?.message === 'string' ? data.error.message : 'Board request failed');
    }
    if (!safeVersion(data.boardVersion)) return failure(502, 'UPSTREAM_INVALID', 'Board service unavailable');
    if (operation === 'read') {
      if (!['ACTIVE', 'ARCHIVED'].includes(data.projectStatus) || !Array.isArray(data.issues) || data.issues.length > 10000) {
        return failure(502, 'UPSTREAM_INVALID', 'Board service unavailable');
      }
      const issues = data.issues.map((issue) => copyIssue(issue, workspaceId, projectId));
      if (issues.some((issue) => !issue) || new Set(issues.map((issue) => issue.id)).size !== issues.length) {
        return failure(502, 'UPSTREAM_INVALID', 'Board service unavailable');
      }
      return Response.json({ boardVersion: data.boardVersion, projectStatus: data.projectStatus, issues },
        { headers: { 'Cache-Control': 'no-store' } });
    }
    const issue = copyIssue(data.issue, workspaceId, projectId);
    if (!issue || issue.id !== body.issueId) return failure(502, 'UPSTREAM_INVALID', 'Board service unavailable');
    return Response.json({ boardVersion: data.boardVersion, issue }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const timeout = ['TimeoutError', 'AbortError'].includes(error?.name);
    return failure(timeout ? 504 : 502, timeout ? 'GATEWAY_TIMEOUT' : 'GATEWAY_UNREACHABLE', 'Board service unavailable');
  }
}
