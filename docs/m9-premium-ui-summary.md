# M9 — Premium product / real dashboard starter

**Based on M8 Frontend** `ee91cbe` (owner-reported), Backend `ed54a6c`.

## Changes

- New responsive landing with strong product hierarchy, working Register/Login calls, illustrative four-lane preview clearly labeled.
- Authenticated dark surfaces by default, functional workspace switcher and context navigation; removed decorative search/notifications and incorrect Board Soon label.
- Shared semantic gradients and labels across issue rows/details/board and projects. Values are never represented only by color.
- Workspace-level summary, via newly implemented backend `GET /api/workspaces/:id/summary`; real project KPIs, issue status donut, priorities and last-14-UTC-days issues-created bars. No fake dataset; proper zero/error/retry.

## Contract

1. Browser `GET /api/backend/workspaces/:id/summary`
2. Next BFF uses Auth.js + Redis-held private credentials; checks UUID, URL, upstream DTO, workspace ID and total consistency.
3. Gateway verifies JWT and BFF key; explicit allowlist routes to Core.
4. Core checks workspace membership, then runs tenant-scoped grouped SQL on `core.projects` and `core.issues`.

**Dependencies:** Backend summary PR must merge/deploy before this frontend PR. The existing M8 board remains unchanged in its move API.

**Not in this visual/data patch:** global self-profile mutation/password controls, avatar object storage, or global member identity editing. These need a dedicated Auth security implementation later in M9, without granting workspace Admin permission over `auth.users`.

## Local checks before PR

- Once per repository: `npm ci && npm run lint && npm test`; frontend also `npm run build`.
- Backend CI additionally runs disposable PostgreSQL + Redis integration/migration and Docker checks. This patch requires **no migration**.
- Browser spot check: landing CTA, workspace summary (with two distinct workspaces), issue list and Kanban after switching workspace, 375/768/1440px, reload shows persisted order.
- PR workflow: backend PR green/merge first, then frontend PR green/merge; record latest squash SHAs.
