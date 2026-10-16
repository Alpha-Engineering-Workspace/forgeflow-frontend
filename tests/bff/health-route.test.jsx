// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "../../src/app/api/backend/health/route.js";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("GET /api/backend/health (server-only BFF)", () => {
  it("fails closed when the Gateway URL is missing", async () => {
    vi.stubEnv("FORGEFLOW_GATEWAY_URL", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET();
    expect(response.status).toBe(503);
    expect((await response.json()).error.code).toBe("GATEWAY_NOT_CONFIGURED");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("requests only Gateway process readiness without passing credentials", async () => {
    vi.stubEnv("FORGEFLOW_GATEWAY_URL", "http://gateway:3001");
    const fetchMock = vi.fn().mockResolvedValue(Response.json({
      service: "api-gateway", status: "ready", checks: "process-only",
    }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({
      connected: true, service: "api-gateway", readiness: "process-only",
    });
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, options] = fetchMock.mock.calls[0];
    expect(url.toString()).toBe("http://gateway:3001/health/ready");
    expect(options).toMatchObject({ method: "GET", cache: "no-store" });
    expect(options).not.toHaveProperty("headers");
    expect(options.signal).toBeInstanceOf(AbortSignal);
  });

  it("rejects unsafe base URL configuration", async () => {
    vi.stubEnv("FORGEFLOW_GATEWAY_URL", "http://gateway:3001/other?path=login");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = await GET();
    expect(response.status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not mistake unrelated upstream JSON for a ready Gateway", async () => {
    vi.stubEnv("FORGEFLOW_GATEWAY_URL", "http://gateway:3001");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ service: "core-service", status: "ready" })));
    const response = await GET();
    expect(response.status).toBe(502);
    expect((await response.json()).error.code).toBe("INVALID_GATEWAY_RESPONSE");
  });

  it("handles unreachable Gateway without revealing the internal URL", async () => {
    vi.stubEnv("FORGEFLOW_GATEWAY_URL", "http://gateway:3001");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("private network address")));
    const response = await GET();
    expect(response.status).toBe(502);
    expect(JSON.stringify(await response.json())).not.toContain("gateway:3001");
  });

  it("returns a controlled timeout response", async () => {
    vi.stubEnv("FORGEFLOW_GATEWAY_URL", "http://gateway:3001");
    const error = new Error("timed out");
    error.name = "TimeoutError";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(error));
    const response = await GET();
    expect(response.status).toBe(504);
    expect((await response.json()).error.code).toBe("GATEWAY_TIMEOUT");
  });
});
