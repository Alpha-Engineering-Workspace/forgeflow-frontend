import { handleBoardRequest } from '@/features/milestone8/server/board-gateway';

export async function GET(request, { params }) {
  const { workspaceId, projectId } = await params;
  return handleBoardRequest(request, { operation: 'read', workspaceId, projectId });
}
