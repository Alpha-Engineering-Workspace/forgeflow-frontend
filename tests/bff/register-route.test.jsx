// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "../../src/app/api/backend/auth/register/route.js";

const base = "http://localhost:3000";
const key = "a".repeat(48);
const valid = { name: " Test User ", email: "TEST@example.com", password: "ValidPassword123!" };

function request(body = valid, origin = base) {
  return new Request(`${base}/api/backend/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify(body),
  });
}

function setup() {
  vi.stubEnv("FORGEFLOW_GATEWAY_URL", "http://gateway:3001");
  vi.stubEnv("GATEWAY_BFF_KEY", key);
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("POST /api/backend/auth/register", () => {
  it("rejects missing Gateway configuration without a request", async () => {
    vi.stubEnv("FORGEFLOW_GATEWAY_URL", "");
    vi.stubEnv("GATEWAY_BFF_KEY", "");
    const upstream = vi.fn();
    vi.stubGlobal("fetch", upstream);
    const result = await POST(request());
    expect(result.status).toBe(503);
    expect(upstream).not.toHaveBeenCalled();
  });

  it("rejects invalid registration fields locally", async () => {
    setup();
    const upstream = vi.fn();
    vi.stubGlobal("fetch", upstream);
    const result = await POST(request({ ...valid, password: "short" }));
    expect(result.status).toBe(400);
    expect(upstream).not.toHaveBeenCalled();
  });

  it("rejects browser requests from foreign origins", async () => {
    setup();
    const upstream = vi.fn();
    vi.stubGlobal("fetch", upstream);
    const result = await POST(request(valid, "https://foreign.example"));
    expect(result.status).toBe(403);
    expect(upstream).not.toHaveBeenCalled();
  });

  it("forwards only validated fields and a server-only BFF key", async () => {
    setup();
    const upstream = vi.fn().mockResolvedValue(Response.json({
      user: { id: "user-1", name: "Test User", email: "test@example.com", password_hash: "secret" },
      accessToken: "should-never-reach-browser",
    }, { status: 201 }));
    vi.stubGlobal("fetch", upstream);
    const response = await POST(request());
    expect(response.status).toBe(201);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    const content = await response.json();
    expect(content).toEqual({ user: { id: "user-1", name: "Test User", email: "test@example.com" } });
    const [url, options] = upstream.mock.calls[0];
    expect(url.toString()).toBe("http://gateway:3001/api/auth/register");
    expect(options.headers["x-forgeflow-bff-key"]).toBe(key);
    expect(JSON.parse(options.body)).toEqual({ name: "Test User", email: "test@example.com", password: valid.password });
    expect(options.signal).toBeInstanceOf(AbortSignal);
  });

  it("maps duplicate email safely", async () => {
    setup();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ error: { code: "EMAIL_TAKEN" } }, { status: 409 })));
    const result = await POST(request());
    expect(result.status).toBe(409);
    expect((await result.json()).error.code).toBe("EMAIL_TAKEN");
  });

  it("preserves a rate limit Retry-After", async () => {
    setup();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 429, headers: { "retry-after": "30" } })));
    const result = await POST(request());
    expect(result.status).toBe(429);
    expect(result.headers.get("retry-after")).toBe("30");
  });

  it("handles Gateway outages without exposing private URLs", async () => {
    setup();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("gateway:3001 unreachable")));
    const result = await POST(request());
    expect(result.status).toBe(502);
    expect(JSON.stringify(await result.json())).not.toContain("gateway:3001");
  });
});
