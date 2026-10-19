import { handleDomainRequest } from '../../../../../../../features/milestone6/server/domain-gateway.js';
export async function GET(request, { params }) {
  const { workspaceId, projectId } = await params;
  return handleDomainRequest(request, { kind: 'project', method: 'GET', workspaceId, projectId });
}
export async function PATCH(request, { params }) {
  const { workspaceId, projectId } = await params;
  return handleDomainRequest(request, { kind: 'project', method: 'PATCH', workspaceId, projectId });
}
