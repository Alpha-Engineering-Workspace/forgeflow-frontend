// POST only: a mail-client link preview or GET must never consume a single-use token.
const MAX_BODY_BYTES = 2048;
const TOKEN_FORMAT = /^[A-Za-z0-9_-]{30,200}$/;
const responseHeaders = { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" };

function fail(code, message, status, extraHeaders = {}) {
  return Response.json({ error: { code, message } }, {
    status,
    headers: { ...responseHeaders, ...extraHeaders },
  });
}

function verificationUrl() {
  const base = process.env.FORGEFLOW_GATEWAY_URL;
  if (!base) return null;
  try {
    const url = new URL(base);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password ||
        url.pathname !== "/" || url.search || url.hash) return null;
    url.pathname = "/api/auth/email/verify";
    return url;
  } catch {
    return null;
  }
}

async function readToken(request) {
  const reportedLength = Number(request.headers.get("content-length") || 0);
  if (reportedLength > MAX_BODY_BYTES) return { status: 413 };
  if (!request.body) return { status: 400 };
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let raw = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_BODY_BYTES) {
        await reader.cancel();
        return { status: 413 };
      }
      raw += decoder.decode(value, { stream: true });
    }
    raw += decoder.decode();
  } catch {
    return { status: 400 };
  } finally {
    reader.releaseLock();
  }
  try {
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object" || Array.isArray(data) ||
        Object.keys(data).length !== 1 || !TOKEN_FORMAT.test(data.token ?? "")) {
      return { status: 400 };
    }
    return { token: data.token };
  } catch {
    return { status: 400 };
  }
}

export async function POST(request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return fail("FORBIDDEN_ORIGIN", "Invalid request origin", 403);
  }
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    return fail("UNSUPPORTED_MEDIA_TYPE", "JSON request required", 415);
  }
  const body = await readToken(request);
  if (body.status === 413) return fail("PAYLOAD_TOO_LARGE", "Request is too large", 413);
  if (body.status) return fail("VALIDATION_ERROR", "Invalid verification token", 400);

  const url = verificationUrl();
  const bffKey = process.env.GATEWAY_BFF_KEY;
  if (!url || !bffKey || bffKey.length < 32) {
    return fail("GATEWAY_NOT_CONFIGURED", "Verification is temporarily unavailable", 503);
  }

  try {
    const upstream = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-forgeflow-bff-key": bffKey },
      body: JSON.stringify({ token: body.token }),
      cache: "no-store",
      signal: AbortSignal.timeout(7000),
    });
    if (upstream.status === 204) return new Response(null, { status: 204, headers: responseHeaders });
    if (upstream.status === 400) return fail("INVALID_VERIFICATION_TOKEN", "Verification link invalid or expired", 400);
    if (upstream.status === 429) {
      const retryAfter = upstream.headers.get("retry-after");
      const extra = retryAfter && /^\d+$/.test(retryAfter) ? { "Retry-After": retryAfter } : {};
      return fail("RATE_LIMITED", "Too many verification attempts", 429, extra);
    }
    if (upstream.status === 503) return fail("AUTH_UNAVAILABLE", "Verification is temporarily unavailable", 503);
    return fail("UPSTREAM_ERROR", "Verification is temporarily unavailable", 502);
  } catch (error) {
    const timeout = error?.name === "TimeoutError" || error?.name === "AbortError";
    return fail(timeout ? "GATEWAY_TIMEOUT" : "GATEWAY_UNREACHABLE", "Verification is temporarily unavailable", timeout ? 504 : 502);
  }
}
