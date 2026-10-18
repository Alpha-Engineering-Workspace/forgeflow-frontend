# Milestone 3 — Redis-coordinated refresh checkpoint

**Scope:** Frontend only: `E:/ForgeFlow/forgeflow-frontend`, branch `feat/auth-ui`.
Backend `E:/ForgeFlow/forgeflow-backend` is unchanged by this patch. This checkpoint does **not** complete Milestone 3.

## Why this is needed

Backend `POST /api/auth/refresh` rotates the **single-use** refresh token. Reusing an old token revokes its entire PostgreSQL refresh family. Multiple frontend replicas (or tabs triggering simultaneous server requests) must not refresh the same token independently.

## Request/data flow

```text
Browser → Next.js /dashboard → Auth.js auth()
        → Auth.js jwt callback → hasServerSession(ffSessionId)
        → Redis ff:web:auth:<session-uuid>
          ├─ access token has >60 s remaining → allow
          ├─ access token nearing expiry → Redis atomic CAS claim
          │     → mark session as "refreshing" (keeps Redis TTL)
          │     → Gateway POST /api/auth/refresh (server-only key)
          │     → Auth Service transactional PostgreSQL rotation
          │     → Redis atomic CAS replace new tokens (24-h TTL)
          └─ another server sees "refreshing" → wait for new state
```

The user's browser never sees access tokens, refresh tokens, the Redis UUID, or the Gateway BFF key. Auth.js has only the session UUID in its **encrypted HttpOnly JWT cookie**. Session duration is now up to 24 hours, while backend access tokens still expire after up to 10 minutes. Redis session TTL is 24 hours and can extend on successful refresh; Auth.js cookie expiry also limits access. Backend refresh TTL is 30 days but **does not** imply a 30-day frontend login.

New Login stores `accessExpiresAt` in Redis. A request within the last minute of the access-token lifetime triggers refresh. No background scheduler is used. Existing 10-minute sessions from before this patch do not have expiry metadata; they are not silently extended and should be replaced by signing in again after deployment.

**Concurrency:** Redis Lua compare-and-swap is atomic across Next.js replicas. The first request changes session JSON to `state:"refreshing"`. A second request waits (max ~9 s); it cannot replay the old refresh token. A crash leaves the marker, deliberately fails closed, and requires a new login rather than risking backend family revocation. Redis state is never reconstructed from a browser cookie.

**Failure behavior:** Backend 401/403, timeout, malformed result, or CAS replacement failure causes local authentication to fail closed. Failed refresh after network timeout **must not** automatically retry, because the backend might have rotated already. Redis delete uses CAS to avoid deleting a newer session. Logout uses Redis GETDEL and backend family revocation; refresh CAS cannot resurrect a session removed by logout.

**Known limitations:** This slice does not yet provide server-side Core API forwarding with **one** 401 refresh-and-retry (read requests only); it does not implement a durable backend logout revocation outbox when Gateway is unavailable. Authorization/membership changes are not cached or addressed here. A Redis outage invalidates authorization. Cross-replica real Redis integration and load/failover testing are still pending; unit tests use an atomic-operation fake. Auth.js cookies remain subject to its own expiry/rotation mechanics.

## Checks on Windows / Git Bash

1. Apply patch with `git apply --check` then `git apply` on branch `feat/auth-ui`.
2. Confirm `.env.local` has `FORGEFLOW_SESSION_REDIS_URL`, `FORGEFLOW_GATEWAY_URL`, `GATEWAY_BFF_KEY`, `AUTH_SECRET`. Do not expose or commit their values.
3. `npm run lint && npm test && npm run build`.
4. Restart Next.js to load new session TTL. Sign out and **sign in again** to issue a fresh 24-hour cookie/Redis record.
5. Keep Gateway/Auth/PostgreSQL/Redis up. Login, wait >10 minutes, then visit/reload `/dashboard`. You should remain signed in; there should be no password prompt. Open two tabs and reload around the 9-minute mark; both should remain authenticated.
6. Sign out and verify `/dashboard` redirects to `/login`. Verify `GET /api/auth/session` shows no previous user (do not paste sensitive outputs).
7. Run backend refresh-family regression tests on backend branch before final integration merge.

## Files

- `src/features/auth/server/session-store.js` — Redis session expiry and atomic single-flight refresh
- `src/features/auth/server/refresh-gateway.js` — server-only Gateway request/response validation
- `tests/bff/refresh-gateway.test.jsx`, `tests/bff/refresh-session.test.jsx` — isolation, atomic claim, race, fail-closed tests

**Commit only after local lint, Vitest, build and browser verification.** Do not PR/squash-merge until the backend email verification contract and frontend auth features have passing CI.
