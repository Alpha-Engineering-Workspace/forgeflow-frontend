// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("redis", () => ({ createClient: vi.fn() }));
import { revokeServerSession } from "../../src/features/auth/server/session-store.js";

const id = "a8618aba-f14b-497c-91e4-8f46946a52df";
const refreshToken = "opaque-" + "x".repeat(48);

describe("logout token isolation", () => {
  it("atomically removes the session before revoking the backend family", async () => {
    const order = [];
    const redis = { getDel: vi.fn(async () => {
      order.push("removed");
      return JSON.stringify({ user: { id: "x" }, accessToken: "private-access", refreshToken });
    }) };
    const revoke = vi.fn(async () => { order.push("revoked"); return { kind: "success" }; });
    const result = await revokeServerSession(id, { client: async () => redis, revoke });
    expect(result).toEqual({ kind: "success" });
    expect(order).toEqual(["removed", "revoked"]);
    expect(redis.getDel).toHaveBeenCalledWith(`ff:web:auth:${id}`);
    expect(revoke).toHaveBeenCalledWith(refreshToken);
  });

  it("is safe on repeat logout and never replays backend revocation", async () => {
    const redis = { getDel: vi.fn().mockResolvedValue(null) };
    const revoke = vi.fn();
    expect(await revokeServerSession(id, { client: async () => redis, revoke })).toEqual({ kind: "absent" });
    expect(revoke).not.toHaveBeenCalled();
  });

  it("rejects malformed identifiers without touching Redis", async () => {
    const client = vi.fn();
    expect(await revokeServerSession("../../other", { client })).toEqual({ kind: "absent" });
    expect(client).not.toHaveBeenCalled();
  });

  it("invalidates Redis even if backend is down, without exposing a token", async () => {
    const redis = { getDel: vi.fn().mockResolvedValue(JSON.stringify({ refreshToken })) };
    const revoke = vi.fn().mockResolvedValue({ kind: "unavailable" });
    const result = await revokeServerSession(id, { client: async () => redis, revoke });
    expect(result).toEqual({ kind: "unavailable" });
    expect(JSON.stringify(result)).not.toContain(refreshToken);
  });
});
