import { resendVerificationSchema } from "../../../../../../features/auth/resend-schema.js";

const MAX_BODY_BYTES = 2048;
const responseHeaders = { "Cache-Control": "no-store" };

function fail(code, message, status, extraHeaders = {}) {
  return Response.json({ error: { code, message } }, {
    status,
    headers: { ...responseHeaders, ...extraHeaders },
  });
}

function resendUrl() {
  const base = process.env.FORGEFLOW_GATEWAY_URL;
  if (!base) return null;

  try {
    const url = new URL(base);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username || url.password || url.pathname !== "/" ||
      url.search || url.hash
    ) return null;

    url.pathname = "/api/auth/email/resend";
    return url;
  } catch {
    return null;
  }
}

async function readLimitedJson(request) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (!Number.isFinite(contentLength) || contentLength < 0) return { status: 400 };
  if (contentLength > MAX_BODY_BYTES) return { status: 413 };
  if (!request.body) return { status: 400 };

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let length = 0;
  let raw = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_BODY_BYTES) {
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
    return { data: JSON.parse(raw) };
  } catch {
    return { status: 400 };
  }
}

export async function POST(request) {
  // A cross-site browser cannot use this public BFF as an email-sending endpoint.
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return fail("FORBIDDEN_ORIGIN", "Invalid request origin", 403);
  }

  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    return fail("UNSUPPORTED_MEDIA_TYPE", "JSON request required", 415);
  }

  const body = await readLimitedJson(request);
  if (body.status === 413) return fail("PAYLOAD_TOO_LARGE", "Request is too large", 413);
  if (body.status) return fail("VALIDATION_ERROR", "Invalid request body", 400);

  const parsed = resendVerificationSchema.safeParse(body.data);
  if (!parsed.success) return fail("VALIDATION_ERROR", "Enter a valid email address", 400);

  const url = resendUrl();
  const key = process.env.GATEWAY_BFF_KEY;
  if (!url || !key || key.length < 32) {
    return fail("GATEWAY_NOT_CONFIGURED", "Email verification is temporarily unavailable", 503);
  }

  try {
    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forgeflow-bff-key": key,
      },
      body: JSON.stringify(parsed.data),
      cache: "no-store",
      signal: AbortSignal.timeout(7000),
    });

    if (upstream.status === 202) {
      // Do not reveal whether an account exists or needs verification.
      return Response.json({ message: "If this address needs verification, a new link will be sent." }, {
        status: 202,
        headers: responseHeaders,
      });
    }
    if (upstream.status === 429) {
      const retryAfter = upstream.headers.get("retry-after");
      const headers = retryAfter && /^\d+$/.test(retryAfter) ? { "Retry-After": retryAfter } : {};
      return fail("RATE_LIMITED", "Too many requests. Please try again later.", 429, headers);
    }
    if (upstream.status === 400) return fail("VALIDATION_ERROR", "Invalid email address", 400);
    if (upstream.status === 503) return fail("AUTH_UNAVAILABLE", "Email verification is temporarily unavailable", 503);
    return fail("UPSTREAM_ERROR", "Email verification is temporarily unavailable", 502);
  } catch (error) {
    const timeout = error?.name === "TimeoutError" || error?.name === "AbortError";
    return fail(
      timeout ? "GATEWAY_TIMEOUT" : "GATEWAY_UNREACHABLE",
      "Email verification is temporarily unavailable",
      timeout ? 504 : 502,
    );
  }
}
