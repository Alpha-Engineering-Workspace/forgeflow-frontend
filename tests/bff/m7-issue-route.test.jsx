// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('next-auth/jwt', () => ({ getToken: vi.fn() }));
vi.mock('../../src/auth.js', () => ({ auth: vi.fn() }));
import { handleIssueRequest } from '../../src/features/milestone7/server/issue-gateway.js';

const w = '28ebcd8e-48e3-4de3-9406-36bc06e42c9e';
const p = '894c85b9-776f-4ea8-8a84-0a070e7ceea5';
const i = '78cf4780-71a7-43e6-b056-bd9ca9a18e41';
const m = 'e4848668-2f41-47e4-b6a9-adb78ad6b82f';
const root = `http://localhost:3000/api/backend/workspaces/${w}/projects/${p}/issues`;
const principal = async () => ({ accessToken: 'PRIVATE_SERVER_TOKEN' });
const issue = { id: i, workspaceId: w, projectId: p, title: 'Fix login', description: 'Fix validation',
  type: 'BUG', status: 'TODO', priority: 'HIGH', assigneeId: m, createdBy: m, version: 1,
  createdAt: '2026-10-21T10:00:00Z', updatedAt: '2026-10-21T10:00:00Z', secret: 'DO_NOT_LEAK' };
const make = (suffix = '', method = 'GET', body, origin = 'http://localhost:3000') => new Request(root + suffix, {
  method, headers: { origin, ...(body ? { 'content-type': 'application/json' } : {}) },
  ...(body ? { body: JSON.stringify(body) } : {}),
});
const args = (kind, method, issueId, extra = {}) => ({ kind, method, workspaceId: w, projectId: p,
  ...(issueId ? { issueId } : {}), authorize: principal, ...extra });
function setup() { vi.stubEnv('FORGEFLOW_GATEWAY_URL', 'http://gateway:3001'); vi.stubEnv('GATEWAY_BFF_KEY', 'x'.repeat(40)); }
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });

describe('M7 issue BFF fixed routes and server token boundary', () => {
  it('GET list forwards only validated filters and sanitizes the DTO', async () => {
    setup();
    const fetchImpl = vi.fn(async () => Response.json({ issues: [issue], pagination: { page: 1, limit: 20, total: 1 }, jwt: 'NOT_EXPOSED' }));
    const res = await handleIssueRequest(make('?status=TODO&q=login&limit=20'), args('collection', 'GET', null, { fetchImpl }));
    expect(res.status).toBe(200);
    const payload = await res.json();
    expect(payload.issues).toHaveLength(1);
    expect(payload.issues[0]).toEqual(expect.objectContaining({ id: i, title: 'Fix login', status: 'TODO', version: 1 }));
    expect(payload.issues[0]).not.toHaveProperty('secret');
    expect(payload).not.toHaveProperty('jwt');
    expect(payload.pagination).toEqual({ page: 1, limit: 20, total: 1 });
    const url = fetchImpl.mock.calls[0][0];
    expect(url.pathname).toBe(`/api/workspaces/${w}/projects/${p}/issues`);
    expect(url.searchParams.get('status')).toBe('TODO');
    expect(url.searchParams.get('q')).toBe('login');
    expect(fetchImpl.mock.calls[0][1].headers.authorization).toBe('Bearer PRIVATE_SERVER_TOKEN');
    expect(JSON.stringify(payload)).not.toContain('NOT_EXPOSED');
  });
  it('POST creates only strictly validated issues and enforces same-origin', async () => {
    setup(); const fetchImpl = vi.fn(async () => Response.json({ issue }, { status: 201 }));
    const data = { title: ' Fix login ', description: '', type: 'BUG', status: 'TODO', priority: 'HIGH', assigneeId: null };
    const forbidden = await handleIssueRequest(make('', 'POST', data, 'https://evil.test'), args('collection', 'POST', null, { fetchImpl }));
    expect(forbidden.status).toBe(403);
    const extra = await handleIssueRequest(make('', 'POST', { ...data, workspaceId: w }), args('collection', 'POST', null, { fetchImpl }));
    expect(extra.status).toBe(400);
    expect(fetchImpl).not.toHaveBeenCalled();
    const created = await handleIssueRequest(make('', 'POST', data), args('collection', 'POST', null, { fetchImpl }));
    expect(created.status).toBe(201);
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body).title).toBe('Fix login');
    expect(JSON.stringify(await created.json())).not.toContain('DO_NOT_LEAK');
  });
  it('rejects duplicate/unknown query, invalid scoped IDs and missing session', async () => {
    setup(); const fetchImpl = vi.fn();
    expect((await handleIssueRequest(make('?status=TODO&status=DONE'), args('collection', 'GET', null, { fetchImpl }))).status).toBe(400);
    expect((await handleIssueRequest(make('?workspaceId=' + w), args('collection', 'GET', null, { fetchImpl }))).status).toBe(400);
    expect((await handleIssueRequest(make('?limit=101'), args('collection', 'GET', null, { fetchImpl }))).status).toBe(400);
    expect((await handleIssueRequest(make(), args('collection', 'GET', null, { projectId: 'bad', fetchImpl }))).status).toBe(400);
    expect((await handleIssueRequest(make(), args('collection', 'GET', null, { authorize: async () => null, fetchImpl }))).status).toBe(401);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
  it('PATCH propagates 409 instead of hiding version conflicts', async () => {
    setup(); const fetchImpl = vi.fn(async () => Response.json({ error: { code: 'VERSION_CONFLICT', message: 'Stale issue' } }, { status: 409 }));
    const r = await handleIssueRequest(make('/' + i, 'PATCH', { expectedVersion: 1, status: 'DONE' }), args('item', 'PATCH', i, { fetchImpl }));
    expect(r.status).toBe(409); expect((await r.json()).error.code).toBe('VERSION_CONFLICT');
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body)).toEqual({ expectedVersion: 1, status: 'DONE' });
  });
  it('DELETE requires expectedVersion and origin, then forwards the JSON body', async () => {
    setup(); const fetchImpl = vi.fn(async () => new Response(null, { status: 204 }));
    expect((await handleIssueRequest(make('/' + i, 'DELETE'), args('item', 'DELETE', i, { fetchImpl }))).status).toBe(415);
    const r = await handleIssueRequest(make('/' + i, 'DELETE', { expectedVersion: 3 }), args('item', 'DELETE', i, { fetchImpl }));
    expect(r.status).toBe(204);
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body)).toEqual({ expectedVersion: 3 });
  });
  it('rejects mismatched upstream tenant/project/issue to avoid leaking cross-scope data', async () => {
    setup(); const fetchImpl = vi.fn(async () => Response.json({ issue: { ...issue, projectId: m } }));
    const r = await handleIssueRequest(make('/' + i), args('item', 'GET', i, { fetchImpl }));
    expect(r.status).toBe(502);
  });
});
