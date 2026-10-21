import { handleIssueRequest } from '@/features/milestone7/server/issue-gateway';

export async function GET(request, { params }) {
  const { workspaceId, projectId, issueId } = await params;
  return handleIssueRequest(request, { kind: 'item', method: 'GET', workspaceId, projectId, issueId });
}
export async function PATCH(request, { params }) {
  const { workspaceId, projectId, issueId } = await params;
  return handleIssueRequest(request, { kind: 'item', method: 'PATCH', workspaceId, projectId, issueId });
}
export async function DELETE(request, { params }) {
  const { workspaceId, projectId, issueId } = await params;
  return handleIssueRequest(request, { kind: 'item', method: 'DELETE', workspaceId, projectId, issueId });
}
