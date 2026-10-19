import 'server-only';

import { getToken } from 'next-auth/jwt';
import { auth } from '../../../auth.js';
import { getServerAccessToken } from '../../auth/server/session-store.js';
import { uuidSchema, workspaceSchema } from '../workspace-schema.js';

function failure(code, message, status) {
  return Response.json({ error: { code, message } }, { status, headers: { 'Cache-Control': 'no-store' } });
}

// First check Auth.js (including the Redis-coordinated refresh callback),
// then decrypt only the *server-side* Auth.js cookie to locate Redis credentials.
// The session ID/backend JWT is never part of the public session JSON.
export async function workspacePrincipal(request) {
  const session = await auth();
  if (!session?.user?.id) return null;
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: new URL(request.url).protocol === 'https:',
  });
  if (!token?.ffSessionId || token.sub !== session.user.id) return null;
  const credentials = await getServerAccessToken(token.ffSessionId);
  return credentials?.userId === session.user.id ? credentials : null;
}

function workspaceUrl(path) {
  try {
    const raw = process.env.FORGEFLOW_GATEWAY_URL;
    const url = new URL(raw);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
      url.pathname !== '/' || url.search || url.hash) return null;
    url.pathname = `/api/workspaces${path}`;
    return url;
  } catch { return null; }
}

const MAX_BODY = 4096;
async function limitedBody(request) {
  if (Number(request.headers.get('content-length') ?? 0) > MAX_BODY) return { status: 413 };
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') return { status: 415 };
  try {
    const body = await request.text();
    if (new TextEncoder().encode(body).byteLength > MAX_BODY) return { status: 413 };
    const validation = workspaceSchema.safeParse(JSON.parse(body));
    if (!validation.success) return { status: 400 };
    return { data: validation.data };
  } catch { return { status: 400 }; }
}

export async function handleWorkspaceRequest(request, { method, workspaceId, members = false, authorize = workspacePrincipal, fetchImpl = fetch } = {}) {
  if (method === 'POST' || method === 'PATCH') {
    const origin = request.headers.get('origin');
    if (!origin || origin !== new URL(request.url).origin) return failure('FORBIDDEN_ORIGIN', 'Invalid origin', 403);
  }
  if (workspaceId && !uuidSchema.safeParse(workspaceId).success) return failure('VALIDATION_ERROR', 'Invalid workspace ID', 400);
  if (members && (method !== 'GET' || !workspaceId)) return failure('NOT_FOUND', 'Route not found', 404);
  const path = `${workspaceId ? `/${workspaceId}` : ''}${members ? '/members' : ''}`;
  const url = workspaceUrl(path);
  const key = process.env.GATEWAY_BFF_KEY;
  if (!url || !key || key.length < 32) return failure('NOT_CONFIGURED', 'Workspace service unavailable', 503);
  if (method === 'GET' && !workspaceId) {
    const original = new URL(request.url);
    for (const field of original.searchParams.keys()) {
      if (!['page', 'limit'].includes(field)) return failure('VALIDATION_ERROR', 'Invalid pagination', 400);
    }
    for (const field of ['page', 'limit']) {
      const value = original.searchParams.get(field);
      if (value !== null) {
        if (!/^\d{1,4}$/.test(value)) return failure('VALIDATION_ERROR', 'Invalid pagination', 400);
        url.searchParams.set(field, value);
      }
    }
  } else if (new URL(request.url).search) return failure('VALIDATION_ERROR', 'Unexpected query parameters', 400);
  let body;
  if (['POST', 'PATCH'].includes(method)) {
    body = await limitedBody(request);
    if (body.status) return failure('VALIDATION_ERROR', body.status === 413 ? 'Request too large' : 'Invalid workspace name or request', body.status);
  }
  let principal;
  try { principal = await authorize(request); } catch { return failure('SESSION_UNAVAILABLE', 'Session unavailable', 503); }
  if (!principal?.accessToken) return failure('UNAUTHORIZED', 'Sign in to continue', 401);
  try {
    const upstream = await fetchImpl(url, {
      method,
      headers: {
        'content-type': 'application/json',
        'x-forgeflow-bff-key': key,
        authorization: `Bearer ${principal.accessToken}`,
      },
      ...(body ? { body: JSON.stringify(body.data) } : {}),
      signal: AbortSignal.timeout(5000),
      cache: 'no-store',
    });
    if (![200, 201, 400, 401, 403, 404, 409, 429, 503].includes(upstream.status)) {
      return failure('UPSTREAM_INVALID', 'Workspace service unavailable', 502);
    }
    const data = await upstream.json();
    if (!data || typeof data !== 'object') return failure('UPSTREAM_INVALID', 'Workspace service unavailable', 502);
    if (upstream.ok) {
      // Explicit DTO: only current workspace response fields are exposed.
      const project = (entry) => ({ id: entry.id, name: entry.name, role: entry.role, createdAt: entry.createdAt, updatedAt: entry.updatedAt });
      if (method === 'GET' && !workspaceId) {
        if (!Array.isArray(data.workspaces) || !data.pagination) return failure('UPSTREAM_INVALID', 'Workspace service unavailable', 502);
        return Response.json({ workspaces: data.workspaces.map(project),
          pagination: { page: data.pagination.page, limit: data.pagination.limit, total: data.pagination.total } },
          { headers: { 'Cache-Control': 'no-store' } });
      }
      if (members) {
        if (!Array.isArray(data.members)) return failure('UPSTREAM_INVALID', 'Workspace service unavailable', 502);
        return Response.json({ members: data.members.map((m) => ({ userId: m.userId, role: m.role, joinedAt: m.joinedAt })) }, { headers: { 'Cache-Control': 'no-store' } });
      }
      if (!data.workspace?.id || !data.workspace.name) return failure('UPSTREAM_INVALID', 'Workspace service unavailable', 502);
      return Response.json({ workspace: project(data.workspace) }, { status: upstream.status, headers: { 'Cache-Control': 'no-store' } });
    }
    const error = data.error;
    if (upstream.status === 429) {
      const retry = upstream.headers.get('retry-after');
      const headers = { 'Cache-Control': 'no-store' };
      if (retry && /^\d+$/.test(retry)) headers['Retry-After'] = retry;
      return Response.json({ error: { code: 'RATE_LIMITED', message: 'Too many requests. Try later.' } }, { status: 429, headers });
    }
    return failure(typeof error?.code === 'string' ? error.code : 'WORKSPACE_ERROR',
      typeof error?.message === 'string' ? error.message : 'Workspace request failed', upstream.status);
  } catch (error) {
    const timeout = error?.name === 'TimeoutError' || error?.name === 'AbortError';
    return failure(timeout ? 'GATEWAY_TIMEOUT' : 'GATEWAY_UNREACHABLE', 'Workspace service unavailable', timeout ? 504 : 502);
  }
}
