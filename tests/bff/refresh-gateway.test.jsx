// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { refreshWithGateway } from "../../src/features/auth/server/refresh-gateway.js";

const token = "opaque-" + "r".repeat(45);
const nextToken = "next-" + "n".repeat(45);
const access = "access-" + "a".repeat(45);
const env = { FORGEFLOW_GATEWAY_URL: "http://127.0.0.1:3001", GATEWAY_BFF_KEY: "k".repeat(40) };

function response() {
  return { accessToken: access, refreshToken: nextToken, expiresIn: 600, tokenType: "Bearer" };
}

describe("server-only refresh Gateway client", () => {
  it("sends only the refresh token through Gateway and validates rotation", async () => {
    const request = vi.fn().mockResolvedValue(Response.json({ ...response(), extra: "private" }));
    const result = await refreshWithGateway(token, { env, request });
    expect(result).toEqual({ kind: "success", accessToken: access, refreshToken: nextToken, expiresIn: 600 });
    const [url, options] = request.mock.calls[0];
    expect(String(url)).toBe("http://127.0.0.1:3001/api/auth/refresh");
    expect(options.method).toBe("POST");
    expect(options.headers["x-forgeflow-bff-key"]).toBe(env.GATEWAY_BFF_KEY);
    expect(JSON.parse(options.body)).toEqual({ refreshToken: token });
    expect(JSON.stringify(result)).not.toContain("private");
  });

  it("fails closed on unsafe config and malformed tokens", async () => {
    const request = vi.fn();
    expect(await refreshWithGateway("bad", { env, request })).toEqual({ kind: "invalid" });
    expect(await refreshWithGateway(token, { env: { ...env, GATEWAY_BFF_KEY: "short" }, request })).toEqual({ kind: "unavailable" });
    expect(await refreshWithGateway(token, { env: { ...env, FORGEFLOW_GATEWAY_URL: "http://localhost:3001/bad" }, request })).toEqual({ kind: "unavailable" });
    expect(request).not.toHaveBeenCalled();
  });

  it.each([401, 403, 429, 503])("maps HTTP %i without ever returning a token", async (status) => {
    const request = vi.fn().mockResolvedValue(new Response(null, { status }));
    const result = await refreshWithGateway(token, { env, request });
    expect(result).toEqual({ kind: status === 401 || status === 403 ? "invalid" : "unavailable" });
  });

  it("rejects malformed responses and ambiguous network failures", async () => {
    const request = vi.fn().mockResolvedValue(Response.json({ ...response(), refreshToken: undefined }));
    expect(await refreshWithGateway(token, { env, request })).toEqual({ kind: "unavailable" });
    request.mockRejectedValue(new Error("network failed after backend rotation"));
    expect(await refreshWithGateway(token, { env, request })).toEqual({ kind: "unavailable" });
  });
});
