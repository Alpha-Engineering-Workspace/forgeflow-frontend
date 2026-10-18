import "server-only";

import { randomUUID } from "node:crypto";
import { createClient } from "redis";
import { logoutWithGateway } from "./logout-gateway.js";

// Initial login slice: do NOT extend the session past the backend's 10-minute
// access token. Refresh rotation and rolling sessions are separate increments.
export const LOGIN_SESSION_SECONDS = 600;
const SESSION_PREFIX = "ff:web:auth:";
let clientPromise;

function redisClient() {
  if (!clientPromise) {
    const url = process.env.FORGEFLOW_SESSION_REDIS_URL;
    if (!url) throw new Error("Server session Redis is not configured");
    const client = createClient({
      url,
      socket: { connectTimeout: 2000, reconnectStrategy: false },
    });
    client.on("error", () => {}); // handled by connection/retrieval errors; no secrets in logs
    clientPromise = client.connect().then(() => client).catch((error) => {
      clientPromise = undefined;
      throw error;
    });
  }
  return clientPromise;
}

export async function createServerSession({ user, accessToken, refreshToken }) {
  const sessionId = randomUUID();
  const client = await redisClient();
  const result = await client.set(
    `${SESSION_PREFIX}${sessionId}`,
    JSON.stringify({ user, accessToken, refreshToken }),
    { EX: LOGIN_SESSION_SECONDS, NX: true },
  );
  if (result !== "OK") throw new Error("Could not create login session");
  return sessionId;
}

export async function hasServerSession(sessionId) {
  if (typeof sessionId !== "string" || !/^[0-9a-f-]{36}$/i.test(sessionId)) return false;
  const client = await redisClient();
  return (await client.exists(`${SESSION_PREFIX}${sessionId}`)) === 1;
}

// Remove the server session atomically, so the JWT cookie stops authorizing
// requests even if the browser has not finished clearing it. Only the server
// ever reads the refresh token; never return it to the client.
export async function revokeServerSession(sessionId, {
  client = redisClient,
  revoke = logoutWithGateway,
} = {}) {
  if (typeof sessionId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionId)) {
    return { kind: "absent" };
  }
  const redis = await client();
  const raw = await redis.getDel(`${SESSION_PREFIX}${sessionId}`);
  if (!raw) return { kind: "absent" };

  let session;
  try {
    session = JSON.parse(raw);
  } catch {
    return { kind: "invalid" };
  }
  if (typeof session?.refreshToken !== "string") return { kind: "invalid" };
  return revoke(session.refreshToken);
}
