// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  config: null,
  login: vi.fn(),
  create: vi.fn(),
  exists: vi.fn(),
}));

vi.mock("next-auth", () => ({
  CredentialsSignin: class CredentialsSignin extends Error {},
  default: (config) => {
    mocks.config = config;
    return { handlers: {}, auth: vi.fn(), signIn: vi.fn(), signOut: vi.fn() };
  },
}));
vi.mock("next-auth/providers/credentials", () => ({ default: (config) => config }));
vi.mock("../../src/features/auth/server/login-gateway.js", () => ({ loginWithGateway: mocks.login }));
vi.mock("../../src/features/auth/server/session-store.js", () => ({
  LOGIN_SESSION_SECONDS: 600,
  createServerSession: mocks.create,
  hasServerSession: mocks.exists,
}));

await import("../../src/auth.js");

const user = { id: "user-id", name: "Owner", email: "owner@example.com" };

function loginSuccess() {
  mocks.login.mockResolvedValue({
    kind: "success",
    user,
    accessToken: "private-access",
    refreshToken: "private-refresh",
    expiresIn: 600,
  });
  mocks.create.mockResolvedValue("a8618aba-f14b-497c-91e4-8f46946a52df");
  mocks.exists.mockResolvedValue(true);
}

describe("Auth.js server-session boundaries", () => {
  it("forwards only email and password when Auth.js includes extra form fields", async () => {
    loginSuccess();
    mocks.login.mockClear();
    const authorize = mocks.config.providers[0].authorize;
    await authorize({
      email: user.email,
      password: "secret",
      csrfToken: "authjs-csrf",
      callbackUrl: "/dashboard",
    });
    expect(mocks.login).toHaveBeenCalledTimes(1);
    expect(mocks.login).toHaveBeenCalledWith({
      email: user.email,
      password: "secret",
    });
  });

  it("stores backend credentials in Redis and puts only an opaque ID in JWT", async () => {
    loginSuccess();
    const authorize = mocks.config.providers[0].authorize;
    const authUser = await authorize({ email: user.email, password: "secret" });
    expect(authUser).toEqual({ ...user, ffSessionId: "a8618aba-f14b-497c-91e4-8f46946a52df" });
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({
      accessToken: "private-access",
      refreshToken: "private-refresh",
    }));

    const jwt = await mocks.config.callbacks.jwt({ token: {}, user: authUser });
    expect(jwt).toEqual({
      ffSessionId: authUser.ffSessionId,
      sub: user.id,
      name: user.name,
      email: user.email,
    });
    expect(JSON.stringify(jwt)).not.toContain("private-access");
    expect(JSON.stringify(jwt)).not.toContain("private-refresh");

    const browserSession = await mocks.config.callbacks.session({ session: { expires: "later" }, token: jwt });
    expect(browserSession).toEqual({ expires: "later", user });
    expect(JSON.stringify(browserSession)).not.toContain("ffSessionId");
  });

  it("rejects a removed Redis session even if the cookie JWT exists", async () => {
    mocks.exists.mockResolvedValue(false);
    expect(await mocks.config.callbacks.jwt({ token: { ffSessionId: "a8618aba-f14b-497c-91e4-8f46946a52df" } })).toBeNull();
  });

  it("fails closed when Redis cannot persist the backend refresh token", async () => {
    loginSuccess();
    mocks.create.mockRejectedValue(new Error("redis unavailable"));
    await expect(mocks.config.providers[0].authorize({ email: user.email, password: "secret" }))
      .rejects.toMatchObject({ code: "login_unavailable" });
  });
});
