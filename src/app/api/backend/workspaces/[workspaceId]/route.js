import { handleWorkspaceRequest } from '../../../../../features/workspaces/server/workspace-gateway.js';
export async function GET(request, { params }) {
  const { workspaceId } = await params;
  return handleWorkspaceRequest(request, { method: 'GET', workspaceId });
}
export async function PATCH(request, { params }) {
  const { workspaceId } = await params;
  return handleWorkspaceRequest(request, { method: 'PATCH', workspaceId });
}
