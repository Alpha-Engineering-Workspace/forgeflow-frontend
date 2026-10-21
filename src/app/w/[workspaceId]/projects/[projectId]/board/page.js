import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth, signOut } from '../../../../../../auth.js';
import { DashboardSkeleton } from '@/components/ui/skeleton';
import { ProjectBoard } from '@/features/milestone8/components/project-board';

export const metadata = { title: 'Kanban Board | ForgeFlow' };
export default function Page({ params }) {
  return <Suspense fallback={<DashboardSkeleton />}><Content params={params}/></Suspense>;
}
async function Content({ params }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const { workspaceId, projectId } = await params;
  async function signOutAction() { 'use server'; await signOut({ redirectTo: '/login' }); }
  return <ProjectBoard user={session.user} signOutAction={signOutAction} workspaceId={workspaceId} projectId={projectId}/>;
}
