import { z } from "zod";
import { loginSchema } from "../login-schema.js";

const responseSchema = z.object({
  accessToken: z.string().min(20),
  refreshToken: z.string().min(20),
  expiresIn: z.number().int().positive().max(600),
  tokenType: z.literal("Bearer"),
  user: z.object({
    id: z.uuid(),
    name: z.string().min(1).max(120),
    email: z.email(),
  }),
});

function loginUrl(base) {
  if (!base) return null;
  try {
    const url = new URL(base);
    if (!["http:", "https:"].includes(url.protocol) || url.username ||
        url.password || url.pathname !== "/" || url.search || url.hash) return null;
    url.pathname = "/api/auth/login";
    return url;
  } catch {
    return null;
  }
}

// Called from Auth.js on the server. Never return this DTO from a browser route.
export async function loginWithGateway(credentials, {
  env = process.env,
  request = fetch,
} = {}) {
  const parsed = loginSchema.safeParse(credentials);
  if (!parsed.success) return { kind: "invalid" };

  const url = loginUrl(env.FORGEFLOW_GATEWAY_URL);
  const key = env.GATEWAY_BFF_KEY;
  if (!url || !key || key.length < 32) return { kind: "unavailable" };

  try {
    const response = await request(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forgeflow-bff-key": key,
      },
      body: JSON.stringify(parsed.data),
      cache: "no-store",
      signal: AbortSignal.timeout(7000),
    });

    if (response.status === 401) return { kind: "invalid" };
    if (response.status === 403) {
      const body = await response.json().catch(() => null);
      return { kind: body?.error?.code === "EMAIL_NOT_VERIFIED" ? "unverified" : "invalid" };
    }
    if (response.status === 429) return { kind: "limited" };
    if (response.status !== 200) return { kind: "unavailable" };

    const raw = await response.json().catch(() => null);
    const data = responseSchema.safeParse(raw);
    if (!data.success) return { kind: "unavailable" };

    // Explicitly select fields: never leak backend additions to browser sessions.
    const { user, accessToken, refreshToken, expiresIn } = data.data;
    return {
      kind: "success",
      user: { id: user.id, name: user.name, email: user.email },
      accessToken,
      refreshToken,
      expiresIn,
    };
  } catch {
    return { kind: "unavailable" };
  }
}
