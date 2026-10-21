# ForgeFlow M8 — Persisted Kanban Frontend

**Source:** frontend M7 merged `a651bab` → backend M8 merged `ed54a6c` (#10).
**Scope:** project-level read/move board UI and BFF. No new DB migrations or frontend library dependencies. M9 owns full design system, dashboard and gradients.

## Flow and contracts

1. Auth.js `auth()` protects `/w/[workspaceId]/projects/[projectId]/board`.
2. Board UI fetches `GET /api/backend/workspaces/:workspaceId/projects/:projectId/board` via same-origin fetch. Next BFF authenticates with `workspacePrincipal`, fixed gateway URL and private `GATEWAY_BFF_KEY`, then validates/sanitizes the upstream DTO.
3. Four ordered lanes: `TODO → IN_PROGRESS → IN_REVIEW → DONE`. M8 response: `{ boardVersion, projectStatus, issues }`. Each issue includes `boardPosition` (pg BIGINT may be decimal text), `version`, title, type, priority and assignee ID.
4. Desktop HTML5 drag-and-drop inserts *before* the hovered card or at the end of a lane. Touch/keyboard accessible alternative: per-card Move status + Move button; Up/Down controls change same-lane order. `targetIndex` is zero-based **after removing** moved issue. No cross-project drag.
5. `POST /board/moves` submits `{issueId,toStatus,targetIndex,expectedBoardVersion,expectedIssueVersion}`. The client previews the move, locks controls until settled, rolls back on failure, and invalidates board plus Issue queries. On `409`, it reloads authoritative data and asks the user to retry. This is not realtime. Archived project = read-only.

## Security/UX notes

- No backend tokens exposed to React; same-origin mutation Origin check; 2 KB JSON bound; Zod strict body and IDs; no arbitrary URL proxy; no response caching; tenant/project DTO scope checks.
- Project-level membership/role checks are **backend** enforced. UI state alone is not authorization.
- No client-only ordering persistence, no localStorage and no fake stats; `boardPosition` is informational only.
- Focused tests cover BFF origin/body/tenant/409, and same/cross-lane indices. Manual verify pointer drag on desktop, explicit controls on mobile/touch and keyboard, 375px/768px/1440px, reduced-motion, two-tab 409, archived and role denial.

## Git workflow

From clean frontend `main` at `a651bab`: `git switch -c feat/m8-kanban-ui`, apply patch once. `npm ci`, `npm run lint`, `npm test`, `npm run build`, Docker build, smoke. Review staged diff, commit/push, PR. Merge only after required latest-commit CI passes; never commit generated `.next`, `.env`, or unrelated docs.
