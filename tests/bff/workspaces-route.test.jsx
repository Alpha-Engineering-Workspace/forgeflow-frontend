// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('next-auth/jwt', () => ({ getToken: vi.fn() }));
vi.mock('../../src/auth.js', () => ({ auth: vi.fn() }));
import { handleWorkspaceRequest } from '../../src/features/workspaces/server/workspace-gateway.js';

const base = 'http://localhost:3000/api/backend/workspaces';
const userId = '9be175f1-b898-401b-b1c6-c4b1e270474f';
const workspaceId = '28ebcd8e-48e3-4de3-9406-36bc06e42c9e';
const key = 'w'.repeat(42);
const authorize = vi.fn(async () => ({ accessToken: 'server-secret-jwt', userId }));
function setup() {
  vi.stubEnv('FORGEFLOW_GATEWAY_URL', 'http://gateway:3001');
  vi.stubEnv('GATEWAY_BFF_KEY', key);
}
function req(path = '', method = 'GET', data, origin = 'http://localhost:3000') {
  return new Request(`${base}${path}`, {
    method, headers: { origin, ...(data ? { 'content-type': 'application/json' } : {}) },
    ...(data ? { body: JSON.stringify(data) } : {}),
  });
}
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });

describe('Workspace BFF guard and DTO', () => {
  it('requires an authenticated Redis session', async () => {
    setup(); const fetchImpl = vi.fn();
    const res = await handleWorkspaceRequest(req(), { method: 'GET', fetchImpl, authorize: async () => null });
    expect(res.status).toBe(401); expect(fetchImpl).not.toHaveBeenCalled();
  });
  it('rejects forged origin and invalid body before calling Gateway', async () => {
    setup(); const fetchImpl = vi.fn();
    expect((await handleWorkspaceRequest(req('', 'POST', { name: 'New workspace' }, 'https://evil.test'),
      { method: 'POST', fetchImpl, authorize })).status).toBe(403);
    expect((await handleWorkspaceRequest(req('', 'POST', { name: '' }),
      { method: 'POST', fetchImpl, authorize })).status).toBe(400);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
  it('creates workspace via server-only bearer JWT, returns safe DTO', async () => {
    setup();
    const fetchImpl = vi.fn(async () => Response.json({ workspace: { id: workspaceId, name: 'Team A', role: 'OWNER', accessToken: 'must-not-leak' } }, { status: 201 }));
    const res = await handleWorkspaceRequest(req('', 'POST', { name: '  Team A  ' }), { method: 'POST', fetchImpl, authorize });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ workspace: { id: workspaceId, name: 'Team A', role: 'OWNER' } });
    const [url, options] = fetchImpl.mock.calls[0];
    expect(url.toString()).toBe('http://gateway:3001/api/workspaces');
    expect(options.headers.authorization).toBe('Bearer server-secret-jwt');
    expect(options.headers['x-forgeflow-bff-key']).toBe(key);
    expect(JSON.parse(options.body)).toEqual({ name: 'Team A' });
  });
  it('returns only current tenant list and blocks unexpected query options', async () => {
    setup(); const fetchImpl = vi.fn(async () => Response.json({ workspaces: [], pagination: { page: 1, limit: 20, total: 0 } }));
    const res = await handleWorkspaceRequest(req('?page=1&limit=20'), { method: 'GET', fetchImpl, authorize });
    expect(res.status).toBe(200);
    expect(fetchImpl.mock.calls[0][0].search).toBe('?page=1&limit=20');
    const bad = await handleWorkspaceRequest(req('?role=OWNER'), { method: 'GET', fetchImpl, authorize });
    expect(bad.status).toBe(400);
  });
  it('rejects a foreign workspace ID format and maps 404 safely', async () => {
    setup(); const fetchImpl = vi.fn(async () => Response.json({ error: { code: 'WORKSPACE_NOT_FOUND', message: 'Workspace not found' } }, { status: 404 }));
    expect((await handleWorkspaceRequest(req('/bad'), { method: 'GET', workspaceId: 'bad', fetchImpl, authorize })).status).toBe(400);
    expect((await handleWorkspaceRequest(req(`/${workspaceId}`), { method: 'GET', workspaceId, fetchImpl, authorize })).status).toBe(404);
  });
});
