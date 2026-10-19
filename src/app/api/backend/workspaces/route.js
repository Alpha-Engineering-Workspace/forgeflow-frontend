import { handleWorkspaceRequest } from '../../../../features/workspaces/server/workspace-gateway.js';
export async function GET(request) { return handleWorkspaceRequest(request, { method: 'GET' }); }
export async function POST(request) { return handleWorkspaceRequest(request, { method: 'POST' }); }
