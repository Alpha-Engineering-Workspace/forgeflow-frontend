import { handleDomainRequest } from '../../../../../../features/milestone6/server/domain-gateway.js';
export async function GET(request, { params }) {
  const { workspaceId } = await params;
  return handleDomainRequest(request, { kind: 'projects', method: 'GET', workspaceId });
}
export async function POST(request, { params }) {
  const { workspaceId } = await params;
  return handleDomainRequest(request, { kind: 'projects', method: 'POST', workspaceId });
}
