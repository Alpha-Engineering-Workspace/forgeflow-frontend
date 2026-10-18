import "server-only";

import { randomUUID } from "node:crypto";
import { createClient } from "redis";
import { logoutWithGateway } from "./logout-gateway.js";
import { refreshWithGateway } from "./refresh-gateway.js";

// The browser's encrypted Auth.js session and server-side Redis state have a
// 24-hour upper bound. Backend access tokens still expire in up to 10 minutes.
export const LOGIN_SESSION_SECONDS = 24 * 60 * 60;
const SESSION_PREFIX = "ff:web:auth:";
const REFRESH_EARLY_MS = 60 * 1000;
const WAIT_ATTEMPTS = 60;
const WAIT_INTERVAL_MS = 150;
const SESSION_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Redis CAS prevents concurrent replicas from refreshing the SAME backend token.
// The persistent "refreshing" marker is deliberately not a lease: if the
// request crashes after backend rotation, nobody may replay the old token.
const CLAIM_REFRESH = `
if redis.call('GET', KEYS[1]) ~= ARGV[1] then return 0 end
if redis.call('SET', KEYS[1], ARGV[2], 'XX', 'KEEPTTL') == 'OK' then return 1 end
return 0
`;
const REPLACE_REFRESHED = `
if redis.call('GET', KEYS[1]) ~= ARGV[1] then return 0 end
if redis.call('SET', KEYS[1], ARGV[2], 'XX', 'EX', tonumber(ARGV[3])) == 'OK' then return 1 end
return 0
`;
const DELETE_IF_UNCHANGED = `
if redis.call('GET', KEYS[1]) ~= ARGV[1] then return 0 end
return redis.call('DEL', KEYS[1])
`;

let clientPromise;

function redisClient() {
  if (!clientPromise) {
    const url = process.env.FORGEFLOW_SESSION_REDIS_URL;
    if (!url) throw new Error("Server session Redis is not configured");
    const client = createClient({
      url,
      socket: { connectTimeout: 2000, reconnectStrategy: false },
    });
    client.on("error", () => {}); // never log tokens/connection credentials
    clientPromise = client.connect().then(() => client).catch((error) => {
      clientPromise = undefined;
      throw error;
    });
  }
  return clientPromise;
}

function keyFor(sessionId) {
  return typeof sessionId === "string" && SESSION_ID.test(sessionId)
    ? `${SESSION_PREFIX}${sessionId}` : null;
}

function parseSession(raw) {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object" || typeof data.refreshToken !== "string" ||
        typeof data.accessToken !== "string") return null;
    return data;
  } catch {
    return null;
  }
}

async function compareDelete(redis, key, raw) {
  try {
    await redis.eval(DELETE_IF_UNCHANGED, { keys: [key], arguments: [raw] });
  } catch {
    // Redis outage: fail closed and let its preexisting TTL expire.
  }
}

const waitBriefly = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export async function createServerSession({ user, accessToken, refreshToken, expiresIn }) {
  if (!Number.isInteger(expiresIn) || expiresIn < 1 || expiresIn > 600) {
    throw new Error("Invalid access-token lifetime");
  }
  const sessionId = randomUUID();
  const client = await redisClient();
  const result = await client.set(
    `${SESSION_PREFIX}${sessionId}`,
    JSON.stringify({
      user, accessToken, refreshToken,
      accessExpiresAt: Date.now() + expiresIn * 1000,
    }),
    { EX: LOGIN_SESSION_SECONDS, NX: true },
  );
  if (result !== "OK") throw new Error("Could not create login session");
  return sessionId;
}

// Called from the Auth.js jwt callback on each session access. No token is
// returned to Auth.js or browser; the JWT still contains only the opaque ID.
export async function hasServerSession(sessionId, {
  client = redisClient,
  refresh = refreshWithGateway,
  sleep = waitBriefly,
  now = Date.now,
} = {}) {
  const key = keyFor(sessionId);
  if (!key) return false;

  try {
    const redis = await client();
    for (let attempt = 0; attempt < WAIT_ATTEMPTS; attempt += 1) {
      const raw = await redis.get(key);
      const session = parseSession(raw);
      if (!session) return false;

      // Previously issued 10-minute sessions have no expiry metadata. Do not
      // extend their lifetime or try to rotate their tokens; they age out.
      if (session.state !== undefined && session.state !== "refreshing") return false;
      if (session.accessExpiresAt === undefined && session.state === undefined) return true;
      if (session.state === "refreshing") {
        await sleep(WAIT_INTERVAL_MS);
        continue;
      }
      if (!Number.isFinite(session.accessExpiresAt)) return false;
      if (session.accessExpiresAt - now() > REFRESH_EARLY_MS) return true;

      const pendingRaw = JSON.stringify({ ...session, state: "refreshing" });
      const acquired = await redis.eval(CLAIM_REFRESH, {
        keys: [key], arguments: [raw, pendingRaw],
      });
      if (acquired !== 1) continue; // another process won the atomic claim

      // Only the process that successfully wrote the marker calls Gateway.
      // Never retry this particular token after ANY ambiguous backend failure.
      let result;
      try {
        result = await refresh(session.refreshToken);
      } catch {
        result = { kind: "unavailable" };
      }
      if (result?.kind !== "success" ||
          typeof result.accessToken !== "string" || result.accessToken.length < 20 ||
          typeof result.refreshToken !== "string" || result.refreshToken.length < 20 ||
          result.refreshToken === session.refreshToken ||
          !Number.isInteger(result.expiresIn) || result.expiresIn < 1 || result.expiresIn > 600) {
        await compareDelete(redis, key, pendingRaw);
        return false;
      }
      const refreshedRaw = JSON.stringify({
        user: session.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        accessExpiresAt: now() + result.expiresIn * 1000,
      });
      try {
        const updated = await redis.eval(REPLACE_REFRESHED, {
          keys: [key], arguments: [pendingRaw, refreshedRaw, String(LOGIN_SESSION_SECONDS)],
        });
        if (updated === 1) return true;
      } catch {
        // Backend rotation may have succeeded but Redis write failed.
      }
      await compareDelete(redis, key, pendingRaw);
      return false;
    }
    // A crashed refresh leaves a marker behind. Do not replay old credentials.
    // A waiting request fails closed; the marker expires with the session.
    return false;
  } catch {
    // A Redis error must never allow an unverified session to proceed.
    return false;
  }
}

// Atomic local invalidation prevents a parallel request from restoring a
// logged-out session; pending rotation uses CAS and cannot resurrect it.
export async function revokeServerSession(sessionId, {
  client = redisClient,
  revoke = logoutWithGateway,
} = {}) {
  const key = keyFor(sessionId);
  if (!key) return { kind: "absent" };
  const redis = await client();
  const raw = await redis.getDel(key);
  if (!raw) return { kind: "absent" };

  // Logout needs only the refresh token; it remains safe for legacy records
  // and for an in-progress rotation that still stores the old credential.
  let session;
  try {
    session = JSON.parse(raw);
  } catch {
    return { kind: "invalid" };
  }
  if (typeof session?.refreshToken !== "string") return { kind: "invalid" };
  return revoke(session.refreshToken);
}
