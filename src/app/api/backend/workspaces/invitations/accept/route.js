import { handleDomainRequest } from '../../../../../../features/milestone6/server/domain-gateway.js';
export async function POST(request) {
  return handleDomainRequest(request, { kind: 'accept', method: 'POST' });
}
