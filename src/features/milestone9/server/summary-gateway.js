import 'server-only';
import { z } from 'zod';
import { workspacePrincipal } from '@/features/workspaces/server/workspace-gateway';

const uuid = z.uuid();
const count = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
const counts = (names) => z.strictObject(Object.fromEntries(names.map((name) => [name, count])));
const summarySchema = z.object({
  scope: z.strictObject({ workspaceId: uuid, timeZone: z.literal('UTC'), createdDailyDays: z.literal(14),
    includesArchivedProjects: z.boolean(), excludesDeletedIssues: z.boolean() }),
  projects: z.strictObject({ total: count, active: count }),
  issues: z.strictObject({ total: count, open: count, done: count,
    byStatus: counts(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']),
    byPriority: counts(['LOW', 'MEDIUM', 'HIGH', 'URGENT']) }),
  createdDaily: z.array(z.strictObject({ day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), count })).max(14),
});
function failure(status, code, message) {
  return Response.json({ error: { code, message } }, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function handleSummaryRequest(req, workspaceId, { authorize = workspacePrincipal, fetchImpl = fetch } = {}) {
  if (!uuid.safeParse(workspaceId).success || new URL(req.url).search) {
    return failure(400, 'VALIDATION_ERROR', 'Invalid summary request');
  }
  let url;
  try {
    url = new URL(process.env.FORGEFLOW_GATEWAY_URL);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
      url.pathname !== '/' || url.search || url.hash) throw new Error('Invalid gateway');
    url.pathname = `/api/workspaces/${workspaceId}/summary`;
  } catch { return failure(503, 'NOT_CONFIGURED', 'Service unavailable'); }
  const key = process.env.GATEWAY_BFF_KEY;
  if (!key || key.length < 32) return failure(503, 'NOT_CONFIGURED', 'Service unavailable');
  let principal;
  try { principal = await authorize(req); } catch { return failure(503, 'SESSION_UNAVAILABLE', 'Session unavailable'); }
  if (!principal?.accessToken) return failure(401, 'UNAUTHORIZED', 'Sign in to continue');
  try {
    const upstream = await fetchImpl(url, { method: 'GET', headers: {
      'x-forgeflow-bff-key': key, authorization: `Bearer ${principal.accessToken}` },
      signal: AbortSignal.timeout(5000), cache: 'no-store' });
    if (![200, 400, 401, 403, 404, 429, 503].includes(upstream.status)) {
      return failure(502, 'UPSTREAM_INVALID', 'Summary service unavailable');
    }
    const data = await upstream.json();
    if (!upstream.ok) return failure(upstream.status, typeof data?.error?.code === 'string' ? data.error.code : 'SUMMARY_ERROR',
      typeof data?.error?.message === 'string' ? data.error.message : 'Summary unavailable');
    const parsed = summarySchema.safeParse(data);
    if (!parsed.success || parsed.data.scope.workspaceId !== workspaceId ||
      parsed.data.issues.total !== parsed.data.issues.open + parsed.data.issues.done ||
      parsed.data.issues.total !== Object.values(parsed.data.issues.byStatus).reduce((a, b) => a + b, 0)) {
      return failure(502, 'UPSTREAM_INVALID', 'Summary service unavailable');
    }
    return Response.json(parsed.data, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const timeout = ['TimeoutError','AbortError'].includes(error?.name);
    return failure(timeout ? 504 : 502, timeout ? 'GATEWAY_TIMEOUT' : 'GATEWAY_UNREACHABLE', 'Summary service unavailable');
  }
}
