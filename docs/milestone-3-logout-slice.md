# Milestone 3 — Logout checkpoint (not the completed auth milestone)

## Flow

Browser submits the `/dashboard` sign-out form → Next.js Server Action → Auth.js `signOut({ redirectTo: "/login" })` → Auth.js `events.signOut({ token })` → `revokeServerSession(ffSessionId)` → Redis `GETDEL ff:web:auth:<UUID>` atomically deletes local login state → server-only Gateway `POST /api/auth/logout` with stored refresh token → Auth Service revokes entire refresh family in PostgreSQL → Auth.js clears HttpOnly session cookie.

- The token is read only by server code; there is no public logout BFF route with a refresh token body.
- The existing 10-minute login expiry remains intact; refresh rotation is **not** implemented yet.
- Redis `GETDEL` requires Redis 6.2+. Use the Redis version supplied by the project Compose setup.
- Because a logged-out cookie may still be presented by a racing request, the `jwt` callback still requires Redis session existence.
- A second sign-out performs no additional refresh-family call.

## Important limitation before production

For this small slice, local Redis session deletion succeeds before requesting backend revocation. If Gateway is down after deletion, the local session is invalidated and the user is signed out, **but remote refresh-family revocation is not guaranteed**. The server logs a non-secret operational failure; a durable revocation outbox/retry path is required before treating this as production-grade. Avoid claiming global logout succeeds under provider/network outages.

## Required local verification

1. `npm run lint`, `npm test`, `npm run build`.
2. Log in and click **Sign out**. Confirm `/login` loads and `/dashboard` redirects to `/login`.
3. Confirm Auth.js `/api/auth/session` no longer returns the former user.
4. With backend available, verify backend logout endpoint returns 204 via server logs or an authorized integration test. Do **not** print tokens.
5. Login again, verify the new session works. Existing sessions from before patch will naturally expire in up to 10 minutes.
6. Keep `.env.local` and real tokens out of Git, chat and logs.

## Separate next slice

Implement Redis-coordinated **refresh rotation** with cross-replica single-use token handling, refreshed Redis expiry and safe failure handling before increasing Auth.js JWT maxAge beyond 600 seconds. Check backend rate limits and replay/family revocation semantics.
