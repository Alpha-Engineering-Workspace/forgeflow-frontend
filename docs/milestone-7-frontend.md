# ForgeFlow M7 Frontend — Issue Tracking

Scope: Issue tracking UI in Next.js; no Kanban drag-and-drop (M8).

## Existing M6 functionality preserved

- Auth.js server session + Redis-backed BFF token handling (no browser access token).
- Workspace shell, project listing/details, invitations, membership management.
- M6 invite acceptance `useSyncExternalStore` fix.

## Request path

`Browser -> /api/backend/workspaces/:workspaceId/projects/:projectId/issues[/:issueId] -> src/features/milestone7/server/issue-gateway.js -> Gateway /api/workspaces/... -> Core Issues API -> core.issues in PostgreSQL`

The browser does not pass upstream paths, BFF keys or JWT values. Only the fixed route handlers select method/path. Mutating requests require a matching Origin and a strict, size-limited JSON body. All identifiers, filters, and response DTO fields are validated. The Gateway/Core services remain responsible for tenant authorization and business rules.

## UI routes

- `/w/:workspaceId/issues` — active-project picker; no cross-project aggregation implied.
- `/w/:workspaceId/projects/:projectId/issues` — create, filter/search, paginate, list.
- `/w/:workspaceId/projects/:projectId/issues/:issueId` — detail, edit, owner/admin delete with confirmation.

`MEMBER` can create/edit, but cannot delete issues. Archived projects are read-only. Stale updates show a reload action on `409` instead of overwriting the current version. Assignees are selected from workspace member IDs because Auth profile names are not available in the M6 member DTO.

## Backend contract (as implemented by M7 backend patch)

- `GET/POST /api/workspaces/:workspaceId/projects/:projectId/issues`
- `GET/PATCH/DELETE /api/workspaces/:workspaceId/projects/:projectId/issues/:issueId`
- Status `TODO/IN_PROGRESS/IN_REVIEW/DONE`, priority `LOW/MEDIUM/HIGH/URGENT`, type `TASK/BUG/FEATURE`.
- `PATCH`/`DELETE` send `expectedVersion`. Deletion sends a JSON body, not a URL param.
- List filters: `page` (>=1), `limit` (1-100), `status`, `priority`, `type`, `assigneeId`, `q`.

## Verification

- Dependency-free structural smoke: `node scripts/m7-frontend-smoke.mjs`.
- Automated tests: `tests/bff/m7-issue-route.test.jsx` (run with `npm test`).
- React/Next checks: `npm run lint && npm test && npm run build`, then `docker build -t forgeflow-frontend:m7 .`.
- Manual two-user test: create/edit/delete permissions, filters, archived project, wrong workspace, assignee restrictions, stale version 409, refresh persistence.
- Do not treat smoke or unit tests as proof of actual database/role enforcement; verify with backend integration tests and real browser sessions.

## Limitations

- No cross-project issue aggregation, issue comments, realtime updates, or persistent Kanban ordering in M7.
- Only first 100 active projects are shown in the workspace Issues picker; Projects page can open the rest.
- UI displays member UUIDs until an authorized Auth-profile lookup is implemented.
