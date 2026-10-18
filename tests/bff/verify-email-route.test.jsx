// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "../../src/app/api/backend/auth/email/verify/route.js";

const site = "http://localhost:3000";
const token = "a".repeat(43);
const key = "b".repeat(48);

function request(body = { token }, origin = site) {
  return new Request(`${site}/api/backend/auth/email/verify`, {
    method: "POST",
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify(body),
  });
}
function configure() {
  vi.stubEnv("FORGEFLOW_GATEWAY_URL", "http://gateway:3001");
  vi.stubEnv("GATEWAY_BFF_KEY", key);
}
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("POST /api/backend/auth/email/verify", () => {
  it("refuses cross-origin POST", async () => {
    configure();
    const f = vi.fn(); vi.stubGlobal("fetch", f);
    const r = await POST(request({ token }, "https://attacker.example"));
    expect(r.status).toBe(403);
    expect(f).not.toHaveBeenCalled();
  });
  it("rejects missing and malformed tokens before Gateway", async () => {
    configure();
    const f = vi.fn(); vi.stubGlobal("fetch", f);
    expect((await POST(request({ token: "short" }))).status).toBe(400);
    expect((await POST(request({ token, extra: "bad" }))).status).toBe(400);
    expect(f).not.toHaveBeenCalled();
  });
  it("fails closed if Gateway config is missing", async () => {
    vi.stubEnv("FORGEFLOW_GATEWAY_URL", "");
    vi.stubEnv("GATEWAY_BFF_KEY", "");
    const f = vi.fn(); vi.stubGlobal("fetch", f);
    expect((await POST(request())).status).toBe(503);
    expect(f).not.toHaveBeenCalled();
  });
  it("verifies through exact Gateway route and does not echo token", async () => {
    configure();
    const f = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", f);
    const r = await POST(request());
    expect(r.status).toBe(204);
    expect(r.headers.get("cache-control")).toBe("no-store");
    expect(r.headers.get("referrer-policy")).toBe("no-referrer");
    const [url, options] = f.mock.calls[0];
    expect(url.toString()).toBe("http://gateway:3001/api/auth/email/verify");
    expect(options.headers["x-forgeflow-bff-key"]).toBe(key);
    expect(JSON.parse(options.body)).toEqual({ token });
    expect(await r.text()).toBe("");
  });
  it("maps invalid/expired token and rate-limits safely", async () => {
    configure();
    const f = vi.fn()
      .mockResolvedValueOnce(Response.json({ error: { code: "INVALID_VERIFICATION_TOKEN" } }, { status: 400 }))
      .mockResolvedValueOnce(new Response(null, { status: 429, headers: { "retry-after": "60" } }));
    vi.stubGlobal("fetch", f);
    const expired = await POST(request());
    expect(expired.status).toBe(400);
    expect((await expired.json()).error.code).toBe("INVALID_VERIFICATION_TOKEN");
    const rateLimited = await POST(request());
    expect(rateLimited.status).toBe(429);
    expect(rateLimited.headers.get("retry-after")).toBe("60");
  });
  it("handles timeout without leaking private URL", async () => {
    configure();
    const error = new Error("gateway:3001 timed out"); error.name = "TimeoutError";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(error));
    const r = await POST(request());
    expect(r.status).toBe(504);
    expect(JSON.stringify(await r.json())).not.toContain("gateway:3001");
  });
});
