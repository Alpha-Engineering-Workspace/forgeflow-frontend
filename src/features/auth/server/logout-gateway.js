// Auth.js server-side only: never expose the refresh token to browser routes.
function gatewayLogoutUrl(base) {
  if (!base) return null;
  try {
    const url = new URL(base);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password ||
        url.pathname !== "/" || url.search || url.hash) return null;
    url.pathname = "/api/auth/logout";
    return url;
  } catch {
    return null;
  }
}

export async function logoutWithGateway(refreshToken, {
  env = process.env,
  request = fetch,
} = {}) {
  if (typeof refreshToken !== "string" || refreshToken.length < 20) return { kind: "invalid" };
  const url = gatewayLogoutUrl(env.FORGEFLOW_GATEWAY_URL);
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
    return { kind: response.status === 204 ? "success" : "unavailable" };
  } catch {
    return { kind: "unavailable" };
  }
}
