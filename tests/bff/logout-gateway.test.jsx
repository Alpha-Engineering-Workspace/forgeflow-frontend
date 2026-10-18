// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { logoutWithGateway } from "../../src/features/auth/server/logout-gateway.js";

const token = "opaque-" + "x".repeat(48);
const env = { FORGEFLOW_GATEWAY_URL: "http://127.0.0.1:3001", GATEWAY_BFF_KEY: "k".repeat(40) };

describe("server-only backend logout", () => {
  it("calls the gateway with only the refresh token and private BFF header", async () => {
    const request = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    const result = await logoutWithGateway(token, { env, request });
    expect(result).toEqual({ kind: "success" });
    const [url, options] = request.mock.calls[0];
    expect(url.toString()).toBe("http://127.0.0.1:3001/api/auth/logout");
    expect(options.method).toBe("POST");
    expect(options.headers["x-forgeflow-bff-key"]).toBe(env.GATEWAY_BFF_KEY);
    expect(JSON.parse(options.body)).toEqual({ refreshToken: token });
    expect(JSON.stringify(result)).not.toContain(token);
  });

  it("rejects invalid tokens and unsafe URLs without network calls", async () => {
    const request = vi.fn();
    expect((await logoutWithGateway("short", { env, request })).kind).toBe("invalid");
    expect((await logoutWithGateway(token, { env: { ...env, FORGEFLOW_GATEWAY_URL: "http://host/other" }, request })).kind).toBe("unavailable");
    expect((await logoutWithGateway(token, { env: { ...env, GATEWAY_BFF_KEY: "short" }, request })).kind).toBe("unavailable");
    expect(request).not.toHaveBeenCalled();
  });

  it("does not report backend revocation success on 503 or network failures", async () => {
    const bad = vi.fn().mockResolvedValue(new Response(null, { status: 503 }));
    expect((await logoutWithGateway(token, { env, request: bad })).kind).toBe("unavailable");
    const down = vi.fn().mockRejectedValue(new Error("private diagnostics"));
    expect((await logoutWithGateway(token, { env, request: down })).kind).toBe("unavailable");
  });
});
