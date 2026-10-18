# Milestone 3 — Frontend Login Slice (local integration)

This change adds a verified-user login page, Auth.js Credentials handling, a Redis-backed server token vault, and a **demo-only** authenticated `/dashboard` route. This is NOT the finished milestone.

## Local setup

1. With Node.js 24 selected, from `E:/ForgeFlow/forgeflow-frontend`, install and commit the updated **lockfile**:

   ```bash
   npm install next-auth@5.0.0-beta.32 redis@5 server-only
   ```

   IMPORTANT: plain `npm install next-auth` currently installs Auth.js v4, which is incompatible with this v5 configuration.

2. Keep the existing server-only `.env.local` values for `FORGEFLOW_GATEWAY_URL` and `GATEWAY_BFF_KEY`; **append** (do not share secrets):

   ```dotenv
   AUTH_TRUST_HOST=true
   FORGEFLOW_SESSION_REDIS_URL=redis://127.0.0.1:6380
   AUTH_SECRET=GENERATE_OWN_32_BYTE_RANDOM_SECRET
   ```

   Generate `AUTH_SECRET` locally with:

   ```bash
   node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
   ```

   Use only `http://localhost:3000` during the browser test, so cookies stay on one hostname. `AUTH_TRUST_HOST=true` is for controlled **local development** only; configure trusted hosts precisely for production. If frontend runs in Docker, `127.0.0.1` points to its own container: use the Compose service host and private network instead.

3. Run PostgreSQL, Redis, Auth Service, Gateway, and Next.js. Test:
   - Verified account + correct password → `/dashboard` with name/email.
   - Incorrect password → generic error.
   - Unverified account → verification guidance.
   - No session → navigating directly to `/dashboard` redirects to `/login`.
   - Redis stopped → login fails closed; tokens must not appear in page, browser session, localStorage, or console.
   - Check `/api/auth/session` only contains public user fields.
   - After 10 minutes without a newer login, Redis authorization expires (refresh not yet implemented).

4. Verify `npm run lint`, `npm test`, `npm run build`, and inspect `git status`. Never commit `.env.local`.

## Call flow

`/login` form → Auth.js built-in CSRF-protected Credentials callback (`/api/auth/*`) → `src/auth.js` → `loginWithGateway()` → Gateway `POST /api/auth/login` → Auth Service → PostgreSQL → Auth Service returns access/refresh tokens → `createServerSession()` stores tokens privately in Redis → Auth.js encrypted HttpOnly session cookie contains *only an opaque session identifier* plus non-sensitive user fields. Auth.js `session()` returns **only** the safe user DTO.

`/dashboard` server component → `auth()` → Auth.js JWT callback checks session still exists in Redis → page renders or redirects to `/login`.

## Deliberate limitations / next increment

- **Temporary 10-minute login sessions only.** Backend refresh-token rotation and retry-once are not yet wired into the frontend. Do **not** increase session maxAge to 30 days without implementing safe rotation and reuse detection.
- Backend logout revocation and Redis session deletion still need an explicit tested logout path. Browser closing or the Auth.js session cookie expiring does not automatically revoke the backend refresh family.
- A Redis session containing tokens is stored under a private backend-only key. Keep Redis private and authenticated; do not expose it to the browser or the public network.
- The protected `/dashboard` is a placeholder; workspace authorization and role checks belong to Core in Milestone 4.
- This implementation depends on Auth.js v5 beta APIs; run real browser integration and both CI pipelines before merging.
