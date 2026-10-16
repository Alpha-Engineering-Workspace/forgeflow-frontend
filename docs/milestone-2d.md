# Milestone 2D — First real BFF to Gateway connection

## Goal / লক্ষ্য

Build and verify **one** real HTTP request path while keeping backend addresses server-only:

```text
Browser GET /api/backend/health
       |
       v
Next.js Route Handler: src/app/api/backend/health/route.js
       | uses process.env.FORGEFLOW_GATEWAY_URL
       v
GET http://gateway:3001/health/ready     (all services in Docker)
   OR http://127.0.0.1:3001/health/ready  (frontend on Windows)
       |
       v
Gateway: apps/api-gateway/src/app.js → shared/http.js
       |
       v
{ service: "api-gateway", status: "ready", checks: "process-only" }
       |
       v
Next.js BFF response: { connected: true, service: "api-gateway", readiness: "process-only" }
       |
       v
Browser shows status on /preview/connection
```

**This does not yet connect Gateway to Auth/Core real business routes, or verify PostgreSQL/Redis readiness.** Auth, RBAC, JWT, cookies, generic forwarding and billing are later milestones.

## Files and why they exist

| Repo / file | Responsibility |
| --- | --- |
| Frontend `src/app/api/backend/health/route.js` | **BFF server route**. Whitelisted GET to Gateway process readiness only. Strict 3-second timeout. Stable safe errors, no browser tokens. |
| Frontend `src/components/connection/gateway-connection-status.jsx` | Client component fetches only the local BFF path, displays status and retry. |
| Frontend `src/app/preview/connection/page.js` | Visible browser demo at `/preview/connection`. |
| Frontend `tests/bff/health-route.test.jsx` | Verifies allowlist, correct request, no forwarded headers, failure and timeout. |
| Frontend `Dockerfile` + `.dockerignore` | Builds Next.js with `npm ci`, runs as unprivileged Node user, excludes local secrets. |
| Frontend `.github/workflows/container-build.yml` | Builds frontend Docker image and smoke-checks its HTTP endpoint on GitHub CI. Does not use another repo. |
| Backend `compose.frontend.yml` | **Compose override** that starts frontend beside the 2B/2C containers via sibling repo build context. |

## Git branches / separate PRs

Frontend repo: `feat/bff-connection`, Backend repo: `feat/bff-compose`.

Two independent histories, tests and pipelines. The backend PR is additive Compose documentation/config; the frontend PR adds actual connection functionality. Merge compatible changes after both PRs have green CI. Do not edit `main` directly.

## A. Start with locally running Gateway + Next.js dev server (simplest)

1. In the backend repo, start Gateway and its dependencies (2C already configured):

   ```bash
   cd /e/ForgeFlow/forgeflow-backend
   docker-compose -f compose.yml -f compose.apps.yml up -d --build --wait
   curl http://127.0.0.1:3001/health/ready
   ```

2. In frontend repo, add this line to **your local ignored** `.env.local` (do not commit):

   ```dotenv
   FORGEFLOW_GATEWAY_URL=http://127.0.0.1:3001
   ```

   Why? Next.js on your **Windows host** calls Gateway through the published host port 3001.

3. In frontend repo, after applying the patch:

   ```bash
   cd /e/ForgeFlow/forgeflow-frontend
   npm run dev
   ```

   Visit <http://localhost:3000/preview/connection> and see **Connected**; browse <http://localhost:3000/api/backend/health> for JSON.

## B. Full Docker stack test (optional, but part of Milestone 2D)

From the backend repo (next to sibling frontend repo):

```bash
cd /e/ForgeFlow/forgeflow-backend
docker-compose -f compose.yml -f compose.apps.yml -f compose.frontend.yml config --quiet
docker-compose -f compose.yml -f compose.apps.yml -f compose.frontend.yml up -d --build --wait
docker-compose -f compose.yml -f compose.apps.yml -f compose.frontend.yml ps
curl http://127.0.0.1:3000/api/backend/health
```

In Docker, frontend uses `FORGEFLOW_GATEWAY_URL=http://gateway:3001`. This value is **not** `NEXT_PUBLIC_...`; only Next server reads it. A Docker container's `localhost` points at **that container**, not Gateway.

If a **Windows** dev server is using port 3000, stop it before starting the frontend Docker container. For containers, the frontend build reads the folder `../forgeflow-frontend` relative to the **backend** Compose base directory.

**No `down -v`**: never remove your PostgreSQL data volume just to retest 2D.

## C. Checks and expected results

Frontend:

```bash
npm run lint
npm test
npm run build
```

Expected additional **six BFF route tests**. In the backend repo, the existing `npm run lint`, `npm test`, and `npm run test:integration` still apply. New Compose override must pass `config --quiet` plus full-stack smoke.

Failure experiments:

1. Stop only Gateway with `docker-compose -f compose.yml -f compose.apps.yml stop gateway` while frontend dev server is running; refresh `/preview/connection` → **Unavailable**. Restart Gateway with the 2C Compose command. (This stop command affects the existing backend stack; no data deletion.)
2. Remove the local frontend env variable and restart `npm run dev` → BFF responds **503 GATEWAY_NOT_CONFIGURED**.
3. Never use `NEXT_PUBLIC_FORGEFLOW_GATEWAY_URL` or call `http://gateway:3001` from browser code.

## Security / limitations

- The route has **no dynamic destination/path input**. Only `GET /health/ready` is fetched.
- BFF does not forward cookies, Authorization, user input, or arbitrary headers.
- A 3-second timeout avoids hanging requests. Responses are `no-store` and contain safe messages.
- A valid Gateway response is `checks: "process-only"`; showing Connected means its **Express process** answered, not that downstream services are healthy.
- Current readiness is public and non-sensitive. Future domain BFF endpoints will need authentication, origin/CSRF controls and explicit permission contracts.
- Frontend Dockerfile currently copies the built app with `node_modules` into the runtime image for cross-version compatibility. This increases image size. Adopt verified Next.js `standalone` output in a later optimization.
