// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('redis', () => ({ createClient: vi.fn() }));
import { getServerAccessToken } from '../../src/features/auth/server/session-store.js';
const id = 'd809555e-cc46-4471-a595-aed1c2ccca44';
const data = { user: { id: 'safe-user-id' }, accessToken: 'server-secret', refreshToken: 'opaque', accessExpiresAt: Date.now() + 120000 };

describe('Server-side access token boundary', () => {
  it('returns a JWT only for verified, unexpired Redis session', async () => {
    const redis = { get: vi.fn(async () => JSON.stringify(data)) };
    expect(await getServerAccessToken(id, { client: async () => redis, validate: async () => true })).toEqual({ accessToken: 'server-secret', userId: 'safe-user-id' });
    expect(await getServerAccessToken(id, { client: async () => redis, validate: async () => false })).toBeNull();
    redis.get.mockResolvedValue(JSON.stringify({ ...data, accessExpiresAt: Date.now() - 1000 }));
    expect(await getServerAccessToken(id, { client: async () => redis, validate: async () => true })).toBeNull();
  });
});
