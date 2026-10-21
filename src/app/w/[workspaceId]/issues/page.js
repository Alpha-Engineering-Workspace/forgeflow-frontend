import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth, signOut } from '../../../../auth.js';
import { DashboardSkeleton } from '@/components/ui/skeleton';
import { WorkspaceIssues } from '@/features/milestone7/components/workspace-issues';
export const metadata = { title: 'Issues | ForgeFlow' };
export default function Page({ params }) {
  return <Suspense fallback={<DashboardSkeleton />}><Content params={params}/></Suspense>;
}
async function Content({ params }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const { workspaceId } = await params;
  async function signOutAction() { 'use server'; await signOut({ redirectTo: '/login' }); }
  return <WorkspaceIssues user={session.user} signOutAction={signOutAction} workspaceId={workspaceId}/>;
}
