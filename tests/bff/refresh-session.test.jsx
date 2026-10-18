// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { createClient } from "redis";
vi.mock("server-only", () => ({}));
vi.mock("redis", () => ({ createClient: vi.fn() }));
import {
  createServerSession,
  hasServerSession,
  revokeServerSession,
  LOGIN_SESSION_SECONDS,
} from "../../src/features/auth/server/session-store.js";

const id = "a8618aba-f14b-497c-91e4-8f46946a52df";
const user = { id: "u1", name: "Owner", email: "owner@example.com" };
const oldRefresh = "old-" + "o".repeat(45);
const newRefresh = "new-" + "n".repeat(45);
const access = "access-" + "a".repeat(45);
const futureAccess = "access-" + "b".repeat(45);
const key = `ff:web:auth:${id}`;

// Tiny Redis fake: atomic eval does CAS on the raw JSON string just like the
// Lua scripts in production. No tokens ever leave this server-only test.
function redisFake(session) {
  let raw = session ? JSON.stringify(session) : null;
  return {
    get: vi.fn(async (requestedKey) => { expect(requestedKey).toBe(key); return raw; }),
    getDel: vi.fn(async () => { const value = raw; raw = null; return value; }),
    set: vi.fn(async (requestedKey, next) => { expect(requestedKey).toMatch(/^ff:web:auth:/); raw = next; return "OK"; }),
    eval: vi.fn(async (script, { keys, arguments: args }) => {
      expect(keys).toEqual([key]);
      if (raw !== args[0]) return 0;
      if (script.includes("redis.call('DEL'")) { raw = null; return 1; }
      raw = args[1];
      return 1;
    }),
    raw: () => raw,
  };
}

function soonExpiring() {
  return { user, accessToken: access, refreshToken: oldRefresh, accessExpiresAt: Date.now() + 20_000 };
}
function rotated() {
  return { kind: "success", accessToken: futureAccess, refreshToken: newRefresh, expiresIn: 600 };
}

describe("Redis-coordinated refresh", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("persists new login tokens with access expiry and a longer server TTL", async () => {
    // Vitest does not load Next.js .env.local. The Redis client is mocked,
    // so this URL is only configuration for the unit test, not a real connection.
    vi.stubEnv("FORGEFLOW_SESSION_REDIS_URL", "redis://127.0.0.1:6379");
    const redis = {
      connect: vi.fn().mockResolvedValue(undefined),
      on: vi.fn(),
      set: vi.fn().mockResolvedValue("OK"),
    };
    vi.mocked(createClient).mockReturnValue(redis);
    expect(LOGIN_SESSION_SECONDS).toBe(24 * 60 * 60);
    await createServerSession({ user, accessToken: access, refreshToken: oldRefresh, expiresIn: 600 });
    expect(redis.set).toHaveBeenCalledTimes(1);
    const [writtenKey, writtenRaw, options] = redis.set.mock.calls[0];
    expect(writtenKey).toMatch(/^ff:web:auth:[0-9a-f-]{36}$/);
    expect(JSON.parse(writtenRaw)).toEqual(expect.objectContaining({
      user, accessToken: access, refreshToken: oldRefresh,
      accessExpiresAt: expect.any(Number),
    }));
    expect(options).toEqual({ EX: 24 * 60 * 60, NX: true });
  });

  it("does not refresh a valid access token", async () => {
    const redis = redisFake({ ...soonExpiring(), accessExpiresAt: Date.now() + 240_000 });
    const refresh = vi.fn();
    const ok = await hasServerSession(id, { client: async () => redis, refresh });
    expect(ok).toBe(true);
    expect(refresh).not.toHaveBeenCalled();
    expect(redis.eval).not.toHaveBeenCalled();
  });

  it("one request rotates and atomically persists new credentials", async () => {
    const redis = redisFake(soonExpiring());
    const refresh = vi.fn().mockResolvedValue(rotated());
    expect(await hasServerSession(id, { client: async () => redis, refresh })).toBe(true);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(refresh).toHaveBeenCalledWith(oldRefresh);
    expect(JSON.parse(redis.raw())).toEqual(expect.objectContaining({
      refreshToken: newRefresh,
      accessToken: futureAccess,
      user,
    }));
    expect(JSON.parse(redis.raw()).state).toBeUndefined();
    expect(redis.eval).toHaveBeenCalledTimes(2);
    expect(redis.eval.mock.calls[1][1].arguments[2]).toBe(String(LOGIN_SESSION_SECONDS));
  });

  it("two concurrent requests only send ONE rotating refresh token", async () => {
    const redis = redisFake(soonExpiring());
    let complete;
    const refresh = vi.fn(() => new Promise((resolve) => { complete = resolve; }));
    const options = { client: async () => redis, refresh, sleep: async () => Promise.resolve() };
    const first = hasServerSession(id, options);
    // Wait for CAS + refresh to start, then let the second request see the
    // persisted in-progress marker.
    for (let attempt = 0; attempt < 20 && !complete; attempt += 1) await Promise.resolve();
    expect(typeof complete).toBe("function");
    let switched = false;
    const second = hasServerSession(id, {
      ...options,
      sleep: async () => {
        if (!switched) { switched = true; complete(rotated()); }
        await Promise.resolve();
      },
    });
    expect(await first).toBe(true);
    expect(await second).toBe(true);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("does not re-use a token after 401 or an ambiguous timeout", async () => {
    for (const kind of ["invalid", "unavailable"]) {
      const redis = redisFake(soonExpiring());
      const refresh = vi.fn().mockResolvedValue({ kind });
      expect(await hasServerSession(id, { client: async () => redis, refresh })).toBe(false);
      expect(redis.raw()).toBeNull();
      expect(await hasServerSession(id, { client: async () => redis, refresh })).toBe(false);
      expect(refresh).toHaveBeenCalledTimes(1);
    }
  });

  it("a crash-pending marker must never trigger a replay", async () => {
    const redis = redisFake({ ...soonExpiring(), state: "refreshing" });
    const refresh = vi.fn();
    expect(await hasServerSession(id, {
      client: async () => redis, refresh, sleep: async () => {},
    })).toBe(false);
    expect(refresh).not.toHaveBeenCalled();
  });

  it("logout during refresh cannot resurrect the deleted session", async () => {
    const redis = redisFake(soonExpiring());
    let complete;
    const refresh = vi.fn(() => new Promise((resolve) => { complete = resolve; }));
    const first = hasServerSession(id, { client: async () => redis, refresh });
    for (let attempt = 0; attempt < 20 && !complete; attempt += 1) await Promise.resolve();
    expect(typeof complete).toBe("function");
    const revoke = vi.fn().mockResolvedValue({ kind: "success" });
    expect(await revokeServerSession(id, { client: async () => redis, revoke })).toEqual({ kind: "success" });
    expect(revoke).toHaveBeenCalledWith(oldRefresh);
    complete(rotated());
    expect(await first).toBe(false);
    expect(redis.raw()).toBeNull();
  });

  it("lets existing 10-minute sessions expire without unsafe refresh", async () => {
    const redis = redisFake({ user, accessToken: access, refreshToken: oldRefresh });
    const refresh = vi.fn();
    expect(await hasServerSession(id, { client: async () => redis, refresh })).toBe(true);
    expect(refresh).not.toHaveBeenCalled();
  });
});
