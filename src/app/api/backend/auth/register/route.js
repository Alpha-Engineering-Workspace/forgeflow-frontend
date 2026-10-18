import { registerSchema } from "../../../../../features/auth/register-schema.js";

const MAX_REQUEST_BYTES = 4096;
const responseHeaders = { "Cache-Control": "no-store" };

function json(body, status = 200, extraHeaders = {}) {
  return Response.json(body, {
    status,
    headers: { ...responseHeaders, ...extraHeaders },
  });
}

function failure(code, message, status, headers) {
  return json({ error: { code, message } }, status, headers);
}

function registrationUrl() {
  const base = process.env.FORGEFLOW_GATEWAY_URL;
  if (!base) return null;
  try {
    const url = new URL(base);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username || url.password || url.pathname !== "/" ||
      url.search || url.hash
    ) return null;
    url.pathname = "/api/auth/register";
    return url;
  } catch {
    return null;
  }
}

async function readLimitedJson(request) {
  const declaredSize = Number(request.headers.get("content-length") || "0");
  if (declaredSize > MAX_REQUEST_BYTES) return { status: 413 };
  if (!request.body) return { status: 400 };

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let text = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_REQUEST_BYTES) {
        await reader.cancel();
        return { status: 413 };
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
  } catch {
    return { status: 400 };
  } finally {
    reader.releaseLock();
  }

  try {
    return { data: JSON.parse(text) };
  } catch {
    return { status: 400 };
  }
}

export async function POST(request) {
  // Registration is unauthenticated, but cross-site browser posts are denied.
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return failure("FORBIDDEN_ORIGIN", "Invalid request origin", 403);
  }

  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    return failure("UNSUPPORTED_MEDIA_TYPE", "JSON request required", 415);
  }

  const parsedBody = await readLimitedJson(request);
  if (parsedBody.status === 413) return failure("PAYLOAD_TOO_LARGE", "Request is too large", 413);
  if (parsedBody.status) return failure("INVALID_JSON", "Invalid JSON body", 400);

  const validation = registerSchema.safeParse(parsedBody.data);
  if (!validation.success) return failure("VALIDATION_ERROR", "Invalid registration details", 400);

  const url = registrationUrl();
  const key = process.env.GATEWAY_BFF_KEY;
  if (!url || !key || key.length < 32) {
    return failure("GATEWAY_NOT_CONFIGURED", "Registration is unavailable", 503);
  }

  try {
    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forgeflow-bff-key": key,
      },
      body: JSON.stringify(validation.data),
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });

    if (upstream.status === 429) {
      const retryAfter = upstream.headers.get("retry-after");
      const headers = retryAfter && /^\d+$/.test(retryAfter) ? { "Retry-After": retryAfter } : {};
      return failure("RATE_LIMITED", "Too many attempts. Please try later", 429, headers);
    }
    if (upstream.status === 409) return failure("EMAIL_TAKEN", "Email is already registered", 409);
    if (upstream.status === 400) return failure("VALIDATION_ERROR", "Invalid registration details", 400);
    if (upstream.status === 503) return failure("AUTH_UNAVAILABLE", "Registration is temporarily unavailable", 503);
    if (upstream.status !== 201) return failure("BAD_GATEWAY", "Registration failed", 502);

    const payload = await upstream.json();
    const user = payload?.user;
    if (!user || typeof user.id !== "string" || typeof user.name !== "string" || typeof user.email !== "string") {
      return failure("INVALID_GATEWAY_RESPONSE", "Registration failed", 502);
    }

    // Explicit DTO: never expose future token/password fields from backend.
    return json({ user: { id: user.id, name: user.name, email: user.email } }, 201);
  } catch (error) {
    const timeout = error?.name === "TimeoutError" || error?.name === "AbortError";
    return failure(timeout ? "GATEWAY_TIMEOUT" : "GATEWAY_UNREACHABLE", "Registration is temporarily unavailable", timeout ? 504 : 502);
  }
}
