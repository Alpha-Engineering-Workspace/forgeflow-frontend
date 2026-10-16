const responseHeaders = {
  "Cache-Control": "no-store",
};

function json(body, status = 200) {
  return Response.json(body, {
    status,
    headers: responseHeaders,
  });
}

function getGatewayHealthUrl() {
  const configuredUrl = process.env.FORGEFLOW_GATEWAY_URL;

  if (!configuredUrl) {
    return null;
  }

  try {
    const url = new URL(configuredUrl);

    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    ) {
      return null;
    }

    url.pathname = "/health/ready";

    return url;
  } catch {
    return null;
  }
}

export async function GET() {
  const url = getGatewayHealthUrl();

  if (!url) {
    return json(
      {
        connected: false,
        error: {
          code: "GATEWAY_NOT_CONFIGURED",
          message: "Gateway URL is not configured",
        },
      },
      503,
    );
  }

  try {
    const upstream = await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });

    if (!upstream.ok) {
      return json(
        {
          connected: false,
          error: {
            code: "GATEWAY_UNAVAILABLE",
            message: "Gateway health check failed",
          },
        },
        503,
      );
    }

    const body = await upstream.json();

    if (
      body?.service !== "api-gateway" ||
      body?.status !== "ready" ||
      body?.checks !== "process-only"
    ) {
      return json(
        {
          connected: false,
          error: {
            code: "INVALID_GATEWAY_RESPONSE",
            message: "Unexpected Gateway response",
          },
        },
        502,
      );
    }

    return json({
      connected: true,
      service: "api-gateway",
      readiness: "process-only",
    });
  } catch (error) {
    const timedOut =
      error?.name === "TimeoutError" ||
      error?.name === "AbortError";

    return json(
      {
        connected: false,
        error: {
          code: timedOut
            ? "GATEWAY_TIMEOUT"
            : "GATEWAY_UNREACHABLE",
          message: timedOut
            ? "Gateway request timed out"
            : "Could not reach Gateway",
        },
      },
      timedOut ? 504 : 502,
    );
  }
}