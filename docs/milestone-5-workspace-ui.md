# ForgeFlow Milestone 5 — Frontend Workspace MVP

- `/dashboard`: protected real workspace list, empty/error/loading states, accessible Create Workspace form.
- `/w/[workspaceId]`: real workspace detail, Owner/Admin rename; Member read-only.
- WorkspaceShell shows real workspace names from server responses. No invented users, projects, or tenant metrics.
- TanStack Query keys contain authenticated user ID + workspace ID (or page). Mutations invalidate workspace queries.
- All user input → Browser BFF (`/api/backend/workspaces[...]`) → server-only `auth()` + Auth.js `getToken()` cookie → Redis access token → Gateway signed JWT → Core membership authorization → SQL.
- Redis access/refresh token stays on Next.js server. Nothing secret is returned in the browser's Auth.js session or workspace DTO.
- PATCH/POST BFF validates same-origin, JSON, name length and body size. No wildcard BFF route.
- Error states render safe messages; on logout session invalidation from Milestone 3 is preserved.
- No password/auth API changes. Current target includes only create/list/select/detail/rename and basic membership count. Invites/role editing/project features are deferred.

Environment: frontend retains existing `FORGEFLOW_GATEWAY_URL`, `GATEWAY_BFF_KEY`, `FORGEFLOW_SESSION_REDIS_URL`, `AUTH_SECRET`. No new frontend key required. The new `CORE_INTERNAL_KEY` belongs only to backend Gateway/Core.

New tests cover BFF no-token, cross-origin, invalid form, safe response DTO, and server-only token extraction. Test live cookie/refresh flow locally before declaring completion. Run frontend `npm run lint && npm test && npm run build`, then configured Docker CI. Compare at 375px/768px/desktop and verify other user's UUID is inaccessible through Gateway/BFF. Frontend PR merges **after** backend PR.
