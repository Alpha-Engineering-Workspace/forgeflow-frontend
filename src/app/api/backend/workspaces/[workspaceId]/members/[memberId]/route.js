import { handleDomainRequest } from '../../../../../../../features/milestone6/server/domain-gateway.js';
export async function PATCH(request, { params }) {
  const { workspaceId, memberId } = await params;
  return handleDomainRequest(request, { kind: 'member', method: 'PATCH', workspaceId, memberId });
}
export async function DELETE(request, { params }) {
  const { workspaceId, memberId } = await params;
  return handleDomainRequest(request, { kind: 'member', method: 'DELETE', workspaceId, memberId });
}
