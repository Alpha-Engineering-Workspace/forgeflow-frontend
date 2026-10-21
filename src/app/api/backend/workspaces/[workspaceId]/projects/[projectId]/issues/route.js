import { handleIssueRequest } from '@/features/milestone7/server/issue-gateway';

export async function GET(request, { params }) {
  const { workspaceId, projectId } = await params;
  return handleIssueRequest(request, { kind: 'collection', method: 'GET', workspaceId, projectId });
}
export async function POST(request, { params }) {
  const { workspaceId, projectId } = await params;
  return handleIssueRequest(request, { kind: 'collection', method: 'POST', workspaceId, projectId });
}
