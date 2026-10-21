import { handleBoardRequest } from '@/features/milestone8/server/board-gateway';

export async function POST(request, { params }) {
  const { workspaceId, projectId } = await params;
  return handleBoardRequest(request, { operation: 'move', workspaceId, projectId });
}
