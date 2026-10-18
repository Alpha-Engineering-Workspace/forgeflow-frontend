// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ config: null, revoke: vi.fn() }));
vi.mock("next-auth", () => ({
  CredentialsSignin: class CredentialsSignin extends Error {},
  default: (config) => {
    mocks.config = config;
    return { handlers: {}, auth: vi.fn(), signIn: vi.fn(), signOut: vi.fn() };
  },
}));
vi.mock("next-auth/providers/credentials", () => ({ default: (config) => config }));
vi.mock("../../src/features/auth/server/login-gateway.js", () => ({ loginWithGateway: vi.fn() }));
vi.mock("../../src/features/auth/server/session-store.js", () => ({
  LOGIN_SESSION_SECONDS: 600,
  createServerSession: vi.fn(),
  hasServerSession: vi.fn(),
  revokeServerSession: mocks.revoke,
}));
await import("../../src/auth.js");

const id = "a8618aba-f14b-497c-91e4-8f46946a52df";

describe("Auth.js signOut callback", () => {
  it("revokes Redis/backend session referenced by the private JWT field", async () => {
    mocks.revoke.mockResolvedValue({ kind: "success" });
    await mocks.config.events.signOut({ token: { ffSessionId: id } });
    expect(mocks.revoke).toHaveBeenCalledWith(id);
  });

  it("is safe without a valid session ID", async () => {
    mocks.revoke.mockClear();
    await mocks.config.events.signOut({ token: null });
    await mocks.config.events.signOut({ session: null });
    expect(mocks.revoke).not.toHaveBeenCalled();
  });

  it("does not log refresh credentials on a failed revocation", async () => {
    mocks.revoke.mockResolvedValue({ kind: "unavailable" });
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      await mocks.config.events.signOut({ token: { ffSessionId: id } });
      expect(log).toHaveBeenCalledWith("ForgeFlow backend logout revocation unavailable");
      expect(JSON.stringify(log.mock.calls)).not.toContain("refreshToken");
    } finally {
      log.mockRestore();
    }
  });
});
