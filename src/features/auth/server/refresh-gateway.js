import "server-only";

import { z } from "zod";

const tokenSchema = z.object({
  accessToken: z.string().min(20),
  refreshToken: z.string().min(20),
  expiresIn: z.number().int().positive().max(600),
  tokenType: z.literal("Bearer"),
});

function refreshUrl(base) {
  if (!base) return null;
  try {
    const url = new URL(base);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password ||
        url.pathname !== "/" || url.search || url.hash) return null;
    url.pathname = "/api/auth/refresh";
    return url;
  } catch {
    return null;
  }
}

// Server-only: never expose refresh-token requests or results to the browser.
export async function refreshWithGateway(refreshToken, {
  env = process.env,
  request = fetch,
} = {}) {
  if (typeof refreshToken !== "string" || refreshToken.length < 20) return { kind: "invalid" };
  const url = refreshUrl(env.FORGEFLOW_GATEWAY_URL);
  const key = env.GATEWAY_BFF_KEY;
  if (!url || typeof key !== "string" || key.length < 32) return { kind: "unavailable" };

  try {
    const response = await request(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forgeflow-bff-key": key,
      },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
      signal: AbortSignal.timeout(7000),
    });
    if (response.status === 401 || response.status === 403) return { kind: "invalid" };
    if (response.status !== 200) return { kind: "unavailable" };

    const parsed = tokenSchema.safeParse(await response.json().catch(() => null));
    if (!parsed.success) return { kind: "unavailable" };
    return {
      kind: "success",
      accessToken: parsed.data.accessToken,
      refreshToken: parsed.data.refreshToken,
      expiresIn: parsed.data.expiresIn,
    };
  } catch {
    // A timeout is ambiguous: the backend may have rotated the token already.
    // The session-store MUST invalidate locally, not retry with this token.
    return { kind: "unavailable" };
  }
}
