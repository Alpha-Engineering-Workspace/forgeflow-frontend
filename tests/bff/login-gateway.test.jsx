// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { loginWithGateway } from "../../src/features/auth/server/login-gateway.js";

const key = "x".repeat(40);
const env = { FORGEFLOW_GATEWAY_URL: "http://127.0.0.1:3001", GATEWAY_BFF_KEY: key };
const credentials = { email: "USER@example.com", password: "correct-secret" };
const response = {
  accessToken: "access-" + "a".repeat(40),
  refreshToken: "refresh-" + "b".repeat(40),
  expiresIn: 600,
  tokenType: "Bearer",
  user: { id: "78c1b040-38d4-4efb-8d6f-fd0477267c5a", name: "Owner", email: "user@example.com" },
};

describe("server-side Gateway login", () => {
  it("refuses malformed credentials without a network call", async () => {
    const request = vi.fn();
    expect((await loginWithGateway({ email: "bad", password: "secret" }, { env, request })).kind).toBe("invalid");
    expect(request).not.toHaveBeenCalled();
  });

  it("rejects unsafe configuration before calling Gateway", async () => {
    const request = vi.fn();
    expect((await loginWithGateway(credentials, { env: { ...env, FORGEFLOW_GATEWAY_URL: "http://gateway/private" }, request })).kind).toBe("unavailable");
    expect((await loginWithGateway(credentials, { env: { ...env, GATEWAY_BFF_KEY: "short" }, request })).kind).toBe("unavailable");
    expect(request).not.toHaveBeenCalled();
  });

  it("forwards credentials securely and accepts a strict result", async () => {
    const request = vi.fn().mockResolvedValue(Response.json({ ...response, otherSecret: "do not forward" }));
    const result = await loginWithGateway(credentials, { env, request });
    expect(result.kind).toBe("success");
    expect(result.accessToken).toBe(response.accessToken);
    expect(result.refreshToken).toBe(response.refreshToken);
    expect(result.user).toEqual(response.user);
    expect(JSON.stringify(result)).not.toContain("otherSecret");
    const [url, options] = request.mock.calls[0];
    expect(url.toString()).toBe("http://127.0.0.1:3001/api/auth/login");
    expect(options.method).toBe("POST");
    expect(options.headers["x-forgeflow-bff-key"]).toBe(key);
    expect(JSON.parse(options.body)).toEqual({ email: "user@example.com", password: "correct-secret" });
    expect(options.signal).toBeInstanceOf(AbortSignal);
  });

  it.each([
    [401, null, "invalid"],
    [403, { error: { code: "EMAIL_NOT_VERIFIED" } }, "unverified"],
    [403, { error: { code: "OTHER" } }, "invalid"],
    [429, null, "limited"],
    [503, null, "unavailable"],
  ])("maps upstream %i into %s safely", async (status, body, kind) => {
    const request = vi.fn().mockResolvedValue(body ? Response.json(body, { status }) : new Response(null, { status }));
    const result = await loginWithGateway(credentials, { env, request });
    expect(result).toEqual({ kind });
  });

  it("fails closed on invalid token response or timeout", async () => {
    const invalid = vi.fn().mockResolvedValue(Response.json({ ...response, refreshToken: null }));
    expect((await loginWithGateway(credentials, { env, request: invalid })).kind).toBe("unavailable");
    const timeout = vi.fn().mockRejectedValue(new Error("internal gateway address"));
    expect((await loginWithGateway(credentials, { env, request: timeout })).kind).toBe("unavailable");
  });
});
