import 'server-only';
import { z } from 'zod';
import { workspacePrincipal } from '@/features/workspaces/server/workspace-gateway';

const uuid = z.uuid();
const type = z.enum(['TASK', 'BUG', 'FEATURE']);
const status = z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']);
const priority = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);
const title = z.string().trim().min(2).max(200);
const description = z.string().trim().max(4000);
const schemas = {
  create: z.strictObject({
    title,
    description: description.default(''),
    type: type.default('TASK'),
    status: status.default('TODO'),
    priority: priority.default('MEDIUM'),
    assigneeId: uuid.nullable().default(null),
  }),
  update: z.strictObject({
    expectedVersion: z.number().int().min(1),
    title: title.optional(),
    description: description.optional(),
    type: type.optional(),
    status: status.optional(),
    priority: priority.optional(),
    assigneeId: uuid.nullable().optional(),
  }).refine((value) => Object.keys(value).some((key) => key !== 'expectedVersion')),
  remove: z.strictObject({ expectedVersion: z.number().int().min(1) }),
};

function failure(statusCode, code, message) {
  return Response.json({ error: { code, message } }, { status: statusCode, headers: { 'Cache-Control': 'no-store' } });
}

function gatewayURL(path) {
  try {
    const url = new URL(process.env.FORGEFLOW_GATEWAY_URL);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
        url.pathname !== '/' || url.search || url.hash) return null;
    url.pathname = `/api/workspaces/${path}`;
    return url;
  } catch { return null; }
}

async function parseBody(request, schema) {
  if (request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() !== 'application/json') return { error: 415 };
  if (Number(request.headers.get('content-length') || 0) > 8192) return { error: 413 };
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > 8192) return { error: 413 };
    const parsed = schemas[schema].safeParse(JSON.parse(raw));
    if (!parsed.success) return { error: 400 };
    return { data: parsed.data };
  } catch { return { error: 400 }; }
}

function copyIssue(issue) {
  if (!issue || !uuid.safeParse(issue.id).success || !Number.isInteger(issue.version) || issue.version < 1) return null;
  if (!uuid.safeParse(issue.workspaceId).success || !uuid.safeParse(issue.projectId).success) return null;
  if (!type.safeParse(issue.type).success || !status.safeParse(issue.status).success || !priority.safeParse(issue.priority).success) return null;
  if (typeof issue.title !== 'string' || typeof issue.description !== 'string') return null;
  if (issue.assigneeId !== null && issue.assigneeId !== undefined && !uuid.safeParse(issue.assigneeId).success) return null;
  return { id: issue.id, workspaceId: issue.workspaceId, projectId: issue.projectId,
    title: issue.title, description: issue.description, type: issue.type, status: issue.status,
    priority: issue.priority, assigneeId: issue.assigneeId ?? null, createdBy: issue.createdBy,
    version: issue.version, createdAt: issue.createdAt, updatedAt: issue.updatedAt };
}

function checkedQuery(input, target) {
  const allowed = new Set(['page', 'limit', 'status', 'priority', 'type', 'assigneeId', 'q']);
  for (const key of input.keys()) {
    if (!allowed.has(key) || input.getAll(key).length !== 1) return false;
    const value = input.get(key);
    if (key === 'page' || key === 'limit') {
      const n = Number(value);
      if (!/^\d{1,4}$/.test(value) || !Number.isInteger(n) || n < 1 || (key === 'limit' && n > 100)) return false;
    }
    if (key === 'status' && !status.safeParse(value).success) return false;
    if (key === 'priority' && !priority.safeParse(value).success) return false;
    if (key === 'type' && !type.safeParse(value).success) return false;
    if (key === 'assigneeId' && !uuid.safeParse(value).success) return false;
    if (key === 'q' && (value.trim().length < 1 || value.trim().length > 100)) return false;
    target.set(key, key === 'q' ? value.trim() : value);
  }
  return true;
}

// Fixed Next.js route handlers choose the operation. The browser never selects an upstream URL.
export async function handleIssueRequest(request, {
  kind, method, workspaceId, projectId, issueId,
  authorize = workspacePrincipal, fetchImpl = fetch,
}) {
  if (!uuid.safeParse(workspaceId).success || !uuid.safeParse(projectId).success ||
      (issueId !== undefined && !uuid.safeParse(issueId).success)) {
    return failure(400, 'VALIDATION_ERROR', 'Invalid record ID');
  }
  if (!((kind === 'collection' && !issueId && ['GET', 'POST'].includes(method)) ||
        (kind === 'item' && issueId && ['GET', 'PATCH', 'DELETE'].includes(method)))) {
    return failure(404, 'NOT_FOUND', 'Route not found');
  }
  if (method !== 'GET') {
    const origin = request.headers.get('origin');
    if (!origin || origin !== new URL(request.url).origin) return failure(403, 'FORBIDDEN_ORIGIN', 'Invalid origin');
  }
  const path = `${workspaceId}/projects/${projectId}/issues${issueId ? `/${issueId}` : ''}`;
  const url = gatewayURL(path);
  const key = process.env.GATEWAY_BFF_KEY;
  if (!url || !key || key.length < 32) return failure(503, 'NOT_CONFIGURED', 'Issue service unavailable');
  const params = new URL(request.url).searchParams;
  if (method === 'GET' && kind === 'collection') {
    if (!checkedQuery(params, url.searchParams)) return failure(400, 'VALIDATION_ERROR', 'Invalid issue filters');
  } else if (params.size) return failure(400, 'VALIDATION_ERROR', 'Unexpected query');

  let body;
  if (method !== 'GET') {
    const result = await parseBody(request, method === 'POST' ? 'create' : method === 'PATCH' ? 'update' : 'remove');
    if (result.error) return failure(result.error, 'VALIDATION_ERROR', 'Invalid issue request');
    body = result.data;
  }
  let principal;
  try { principal = await authorize(request); } catch { return failure(503, 'SESSION_UNAVAILABLE', 'Session unavailable'); }
  if (!principal?.accessToken) return failure(401, 'UNAUTHORIZED', 'Sign in to continue');
  try {
    const upstream = await fetchImpl(url, { method,
      headers: { 'content-type': 'application/json', 'x-forgeflow-bff-key': key, authorization: `Bearer ${principal.accessToken}` },
      ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(5000), cache: 'no-store' });
    if (method === 'DELETE' && upstream.status === 204) return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
    if (![200, 201, 400, 401, 403, 404, 409, 429, 503].includes(upstream.status)) {
      return failure(502, 'UPSTREAM_INVALID', 'Issue service unavailable');
    }
    const data = await upstream.json();
    if (!data || typeof data !== 'object') return failure(502, 'UPSTREAM_INVALID', 'Issue service unavailable');
    if (!upstream.ok) {
      if (upstream.status === 429) {
        const retry = upstream.headers.get('retry-after');
        const headers = { 'Cache-Control': 'no-store' };
        if (retry && /^\d+$/.test(retry)) headers['Retry-After'] = retry;
        return Response.json({ error: { code: 'RATE_LIMITED', message: 'Too many requests' } }, { status: 429, headers });
      }
      return failure(upstream.status, typeof data.error?.code === 'string' ? data.error.code : 'ISSUE_ERROR',
        typeof data.error?.message === 'string' ? data.error.message : 'Issue request failed');
    }
    if (method === 'GET' && kind === 'collection') {
      if (!Array.isArray(data.issues) || !data.pagination) return failure(502, 'UPSTREAM_INVALID', 'Issue service unavailable');
      const issues = data.issues.map(copyIssue);
      if (issues.some((issue) => !issue || issue.workspaceId !== workspaceId || issue.projectId !== projectId)) return failure(502, 'UPSTREAM_INVALID', 'Issue service unavailable');
      const { page, limit, total } = data.pagination;
      if (![page, limit, total].every((n) => Number.isInteger(n) && n >= 0)) return failure(502, 'UPSTREAM_INVALID', 'Issue service unavailable');
      return Response.json({ issues, pagination: { page, limit, total } }, { status: upstream.status, headers: { 'Cache-Control': 'no-store' } });
    }
    const issue = copyIssue(data.issue);
    if (!issue || issue.workspaceId !== workspaceId || issue.projectId !== projectId || (kind === 'item' && issue.id !== issueId)) {
      return failure(502, 'UPSTREAM_INVALID', 'Issue service unavailable');
    }
    return Response.json({ issue }, { status: upstream.status, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const timedOut = ['TimeoutError', 'AbortError'].includes(error?.name);
    return failure(timedOut ? 504 : 502, timedOut ? 'GATEWAY_TIMEOUT' : 'GATEWAY_UNREACHABLE', 'Issue service unavailable');
  }
}
