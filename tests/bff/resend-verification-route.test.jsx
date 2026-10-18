// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "../../src/app/api/backend/auth/email/resend/route.js";

const site = "http://localhost:3000";
const key = "k".repeat(48);
const email = "owner@example.com";

function request(data = { email }, origin = site, options = {}) {
  return new Request(`${site}/api/backend/auth/email/resend`, {
    method: "POST",
    headers: {
      "content-type": options.contentType ?? "application/json",
      ...(origin ? { origin } : {}),
    },
    body: typeof data === "string" ? data : JSON.stringify(data),
  });
}

function configure() {
  vi.stubEnv("FORGEFLOW_GATEWAY_URL", "http://gateway:3001");
  vi.stubEnv("GATEWAY_BFF_KEY", key);
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("POST /api/backend/auth/email/resend", () => {
  it("refuses foreign origins before contacting the Gateway", async () => {
    configure();
    const upstream = vi.fn();
    vi.stubGlobal("fetch", upstream);
    const response = await POST(request({ email }, "https://attacker.example"));
    expect(response.status).toBe(403);
    expect(upstream).not.toHaveBeenCalled();
  });

  it("rejects invalid content type, email and extra fields", async () => {
    configure();
    const upstream = vi.fn();
    vi.stubGlobal("fetch", upstream);
    expect((await POST(request({ email }, site, { contentType: "text/plain" }))).status).toBe(415);
    expect((await POST(request({ email: "not-an-email" }))).status).toBe(400);
    expect((await POST(request({ email, other: "unexpected" }))).status).toBe(400);
    expect((await POST(request("{"))).status).toBe(400);
    expect(upstream).not.toHaveBeenCalled();
  });

  it("rejects oversized bodies before upstream", async () => {
    configure();
    const upstream = vi.fn();
    vi.stubGlobal("fetch", upstream);
    const response = await POST(request({ email, extra: "a".repeat(3000) }));
    expect(response.status).toBe(413);
    expect(upstream).not.toHaveBeenCalled();
  });

  it("fails closed on missing or unsafe Gateway configuration", async () => {
    configure();
    vi.stubEnv("FORGEFLOW_GATEWAY_URL", "http://gateway:3001/unsafe");
    const upstream = vi.fn();
    vi.stubGlobal("fetch", upstream);
    expect((await POST(request())).status).toBe(503);
    expect(upstream).not.toHaveBeenCalled();
    vi.stubEnv("FORGEFLOW_GATEWAY_URL", "http://gateway:3001");
    vi.stubEnv("GATEWAY_BFF_KEY", "");
    expect((await POST(request())).status).toBe(503);
    expect(upstream).not.toHaveBeenCalled();
  });

  it("calls only the allowlisted endpoint and returns a generic 202", async () => {
    configure();
    const upstream = vi.fn().mockResolvedValue(Response.json({
      message: "If this address is pending verification, a new link will be sent.",
      backendOnly: "do not forward",
    }, { status: 202 }));
    vi.stubGlobal("fetch", upstream);
    const response = await POST(request({ email: " OWNER@Example.Com " }));
    expect(response.status).toBe(202);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({
      message: "If this address needs verification, a new link will be sent.",
    });
    const [url, options] = upstream.mock.calls[0];
    expect(url.toString()).toBe("http://gateway:3001/api/auth/email/resend");
    expect(options).toMatchObject({ method: "POST", cache: "no-store" });
    expect(options.headers["x-forgeflow-bff-key"]).toBe(key);
    expect(options.signal).toBeInstanceOf(AbortSignal);
    expect(JSON.parse(options.body)).toEqual({ email });
  });

  it("preserves a safe Retry-After for rate-limited requests", async () => {
    configure();
    const upstream = vi.fn().mockResolvedValue(new Response(null, {
      status: 429,
      headers: { "retry-after": "180" },
    }));
    vi.stubGlobal("fetch", upstream);
    const response = await POST(request());
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("180");
    expect((await response.json()).error.code).toBe("RATE_LIMITED");
  });

  it("does not leak internal Gateway errors", async () => {
    configure();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("private gateway:3001")));
    const response = await POST(request());
    expect(response.status).toBe(502);
    expect(JSON.stringify(await response.json())).not.toContain("gateway:3001");
  });

  it("returns a controlled timeout", async () => {
    configure();
    const error = new Error("timed out");
    error.name = "TimeoutError";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(error));
    const response = await POST(request());
    expect(response.status).toBe(504);
    expect((await response.json()).error.code).toBe("GATEWAY_TIMEOUT");
  });
});
