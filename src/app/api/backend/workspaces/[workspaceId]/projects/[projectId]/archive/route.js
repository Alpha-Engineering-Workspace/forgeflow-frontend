import { handleDomainRequest } from '../../../../../../../../features/milestone6/server/domain-gateway.js';
export async function POST(request, { params }) {
  const { workspaceId, projectId } = await params;
  return handleDomainRequest(request, { kind: 'archive', method: 'POST', workspaceId, projectId });
}
