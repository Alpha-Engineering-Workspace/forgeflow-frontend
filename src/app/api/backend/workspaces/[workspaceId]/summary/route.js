import { handleSummaryRequest } from '@/features/milestone9/server/summary-gateway';

export async function GET(request, { params }) {
  const { workspaceId } = await params;
  return handleSummaryRequest(request, workspaceId);
}
