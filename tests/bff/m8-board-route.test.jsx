// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('next-auth/jwt', () => ({ getToken: vi.fn() }));
vi.mock('../../src/auth.js', () => ({ auth: vi.fn() }));
import { handleBoardRequest } from '../../src/features/milestone8/server/board-gateway.js';

const w = '28ebcd8e-48e3-4de3-9406-36bc06e42c9e';
const p = '894c85b9-776f-4ea8-8a84-0a070e7ceea5';
const i = '78cf4780-71a7-43e6-b056-bd9ca9a18e41';
const root = `http://localhost:3000/api/backend/workspaces/${w}/projects/${p}/board`;
const issue = { id: i, workspaceId: w, projectId: p, title: 'Fix login', description: 'Fix validation',
  type: 'BUG', status: 'TODO', priority: 'HIGH', assigneeId: null, boardPosition: '0', version: 3, secret: 'HIDDEN' };
const principal = async () => ({ accessToken: 'SERVER_ONLY_TOKEN' });
const args = (operation, fetchImpl, extra = {}) => ({ operation, workspaceId: w, projectId: p,
  authorize: principal, fetchImpl, ...extra });
const make = (operation = 'read', body, origin = 'http://localhost:3000') => new Request(root + (operation === 'move' ? '/moves' : ''), {
  method: operation === 'move' ? 'POST' : 'GET',
  headers: { origin, ...(body ? { 'content-type': 'application/json' } : {}) },
  ...(body ? { body: JSON.stringify(body) } : {}),
});
const validMove = { issueId: i, toStatus: 'DONE', targetIndex: 0, expectedBoardVersion: 5, expectedIssueVersion: 3 };
function setup() { vi.stubEnv('FORGEFLOW_GATEWAY_URL', 'http://gateway:3001'); vi.stubEnv('GATEWAY_BFF_KEY', 'x'.repeat(40)); }
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });

describe('M8 Board BFF', () => {
  it('GET returns only typed, tenant-scoped board data with no internal fields', async () => {
    setup();
    const fetchImpl = vi.fn(async () => Response.json({ boardVersion: 5, projectStatus: 'ACTIVE', issues: [issue], jwt: 'HIDDEN' }));
    const response = await handleBoardRequest(make(), args('read', fetchImpl));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ boardVersion: 5, projectStatus: 'ACTIVE', issues: [{ id: i, workspaceId: w, projectId: p,
      title: 'Fix login', description: 'Fix validation', type: 'BUG', status: 'TODO', priority: 'HIGH',
      assigneeId: null, boardPosition: '0', version: 3 }] });
    expect(JSON.stringify(body)).not.toContain('HIDDEN');
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(fetchImpl.mock.calls[0][0].pathname).toBe(`/api/workspaces/${w}/projects/${p}/board`);
    expect(fetchImpl.mock.calls[0][1].headers.authorization).toBe('Bearer SERVER_ONLY_TOKEN');
  });
  it('allows archived board to load but rejects malformed upstream issue and duplicate issue ID', async () => {
    setup();
    const good = await handleBoardRequest(make(), args('read', vi.fn(async () =>
      Response.json({ boardVersion: 2, projectStatus: 'ARCHIVED', issues: [] }))));
    expect(good.status).toBe(200);
    for (const list of [[{ ...issue, workspaceId: p }], [issue, issue], [{ ...issue, boardPosition: -1 }]]) {
      const result = await handleBoardRequest(make(), args('read', vi.fn(async () =>
        Response.json({ boardVersion: 2, projectStatus: 'ACTIVE', issues: list }))));
      expect(result.status).toBe(502);
    }
  });
  it('POST validates body and same-origin before forwarding a server-only token', async () => {
    setup(); const fetchImpl = vi.fn(async () => Response.json({ boardVersion: 6, issue: { ...issue, status: 'DONE', version: 4 } }));
    expect((await handleBoardRequest(make('move', validMove, 'https://evil.example'), args('move', fetchImpl))).status).toBe(403);
    expect((await handleBoardRequest(make('move', { ...validMove, unauthorized: true }), args('move', fetchImpl))).status).toBe(400);
    expect((await handleBoardRequest(make('move', { ...validMove, targetIndex: -1 }), args('move', fetchImpl))).status).toBe(400);
    expect((await handleBoardRequest(make('move', { ...validMove, expectedBoardVersion: 0 }), args('move', fetchImpl))).status).toBe(400);
    expect(fetchImpl).not.toHaveBeenCalled();
    const response = await handleBoardRequest(make('move', validMove), args('move', fetchImpl));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ boardVersion: 6, issue: { status: 'DONE', version: 4 } });
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body)).toEqual(validMove);
    expect(fetchImpl.mock.calls[0][0].pathname).toBe(`/api/workspaces/${w}/projects/${p}/board/moves`);
  });
  it('POST preserves stale board 409, without fake successful ordering', async () => {
    setup(); const fetchImpl = vi.fn(async () => Response.json({ error: { code: 'BOARD_VERSION_CONFLICT', message: 'Reload' } }, { status: 409 }));
    const response = await handleBoardRequest(make('move', validMove), args('move', fetchImpl));
    expect(response.status).toBe(409);
    expect((await response.json()).error.code).toBe('BOARD_VERSION_CONFLICT');
  });
  it('rejects bad IDs, query, absent session, bad gateway configuration', async () => {
    setup(); const fetchImpl = vi.fn();
    expect((await handleBoardRequest(make(), args('read', fetchImpl, { workspaceId: 'bad' }))).status).toBe(400);
    expect((await handleBoardRequest(new Request(root + '?url=https://evil.test'), args('read', fetchImpl))).status).toBe(400);
    expect((await handleBoardRequest(make(), args('read', fetchImpl, { authorize: async () => null }))).status).toBe(401);
    vi.stubEnv('FORGEFLOW_GATEWAY_URL', 'http://gateway:3001/bad');
    expect((await handleBoardRequest(make(), args('read', fetchImpl))).status).toBe(503);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
  it('does not reflect untrusted upstream payload or leak Retry-After format', async () => {
    setup();
    const response = await handleBoardRequest(make(), args('read', vi.fn(async () => Response.json({
      error: { code: 'TOO_MANY_REQUESTS', message: 'Please wait' } },
    { status: 429, headers: { 'Retry-After': '6' } }))));
    expect(response.status).toBe(429);
    expect(response.headers.get('retry-after')).toBe('6');
    expect((await response.json()).error.code).toBe('RATE_LIMITED');
  });
});
