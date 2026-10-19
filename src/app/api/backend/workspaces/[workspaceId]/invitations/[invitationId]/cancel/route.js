import { handleDomainRequest } from '../../../../../../../../features/milestone6/server/domain-gateway.js';
export async function POST(request, { params }) {
  const { workspaceId, invitationId } = await params;
  return handleDomainRequest(request, { kind: 'cancel', method: 'POST', workspaceId, invitationId });
}
