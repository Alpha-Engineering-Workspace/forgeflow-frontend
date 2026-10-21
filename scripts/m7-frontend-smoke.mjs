// Dependency-free structural smoke test. This does not replace Vitest or browser E2E.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const file = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const gateway = file('src/features/milestone7/server/issue-gateway.js');
const shell = file('src/components/layout/workspace-shell.jsx');
const detail = file('src/features/milestone6/components/project-detail.jsx');
const issueUI = file('src/features/milestone7/components/project-issues.jsx');
const itemUI = file('src/features/milestone7/components/issue-detail.jsx');
const apiCollection = file('src/app/api/backend/workspaces/[workspaceId]/projects/[projectId]/issues/route.js');
const apiItem = file('src/app/api/backend/workspaces/[workspaceId]/projects/[projectId]/issues/[issueId]/route.js');
assert.match(gateway, /FORBIDDEN_ORIGIN/);
assert.match(gateway, /workspacePrincipal/);
assert.match(gateway, /expectedVersion/);
assert.match(gateway, /Cache-Control/);
assert.match(gateway, /copyIssue/);
assert.match(apiCollection, /export async function GET/);
assert.match(apiCollection, /export async function POST/);
for (const method of ['GET', 'PATCH', 'DELETE']) assert.match(apiItem, new RegExp(`export async function ${method}`));
assert.match(shell, /selectedWorkspace\.id}\/issues/);
assert.match(detail, /projects\/\$\{projectId\}\/issues/);
assert.match(issueUI, /m7-issues/);
assert.match(itemUI, /VERSION_CONFLICT|status === 409/); // uses 409 status check
for (const ui of [issueUI, itemUI]) {
  assert.doesNotMatch(ui, /localStorage|sessionStorage|accessToken|GATEWAY_BFF_KEY/);
}
console.log('M7 frontend node smoke: passed (routes, origin guard, DTO, UI links, version UX).');
