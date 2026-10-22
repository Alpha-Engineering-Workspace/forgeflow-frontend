// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('next-auth/jwt', () => ({ getToken: vi.fn() }));
vi.mock('../../src/auth.js', () => ({ auth: vi.fn() }));
import { handleSummaryRequest } from '../../src/features/milestone9/server/summary-gateway.js';

const w = '28ebcd8e-48e3-4de3-9406-36bc06e42c9e';
const path = `http://localhost:3000/api/backend/workspaces/${w}/summary`;
const principal = async () => ({ accessToken: 'PRIVATE_SERVER_TOKEN' });
const summary = { scope: { workspaceId: w, timeZone: 'UTC', createdDailyDays: 14, includesArchivedProjects: true, excludesDeletedIssues: true },
  projects: { total: 1, active: 1 }, issues: { total: 2, open: 1, done: 1,
    byStatus: { TODO: 1, IN_PROGRESS: 0, IN_REVIEW: 0, DONE: 1 },
    byPriority: { LOW: 1, MEDIUM: 0, HIGH: 1, URGENT: 0 } },
  createdDaily: [{ day: '2026-10-21', count: 2 }] };
function setup() { vi.stubEnv('FORGEFLOW_GATEWAY_URL', 'http://gateway:3001'); vi.stubEnv('GATEWAY_BFF_KEY', 'x'.repeat(40)); }
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });
describe('M9 workspace summary BFF', () => {
  it('forwards authenticated GET only and drops undeclared private keys', async () => {
    setup(); const upstream = vi.fn(async () => Response.json({ ...summary, secret: 'NEVER_EXPOSE' }));
    const response = await handleSummaryRequest(new Request(path), w, { authorize: principal, fetchImpl: upstream });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(summary);
    expect(upstream.mock.calls[0][0].pathname).toBe(`/api/workspaces/${w}/summary`);
    expect(upstream.mock.calls[0][1].headers.authorization).toBe('Bearer PRIVATE_SERVER_TOKEN');
    expect(response.headers.get('cache-control')).toBe('no-store');
  });
  it('rejects mismatched tenant, invalid counts, query smuggling and absent identity', async () => {
    setup(); const fetchImpl = vi.fn(async () => Response.json({ ...summary, scope: { ...summary.scope, workspaceId: '19ec9deb-0768-4a98-ae04-f9995ed1b99d' } }));
    expect((await handleSummaryRequest(new Request(path), w, { authorize: principal, fetchImpl })).status).toBe(502);
    expect((await handleSummaryRequest(new Request(`${path}?secret=true`), w, { authorize: principal, fetchImpl })).status).toBe(400);
    expect((await handleSummaryRequest(new Request(path), w, { authorize: async () => null, fetchImpl })).status).toBe(401);
    expect((await handleSummaryRequest(new Request(path), w, { authorize: principal, fetchImpl: async () => Response.json({ ...summary, issues: { ...summary.issues, total: 99 } }) })).status).toBe(502);
  });
  it('preserves authorized upstream denial', async () => {
    setup(); const result = await handleSummaryRequest(new Request(path), w, { authorize: principal,
      fetchImpl: async () => Response.json({ error: { code: 'WORKSPACE_NOT_FOUND', message: 'Workspace not found' } }, { status: 404 }) });
    expect(result.status).toBe(404);
  });
});
