import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth, signOut } from '../../../../../../../auth.js';
import { DashboardSkeleton } from '@/components/ui/skeleton';
import { IssueDetail } from '@/features/milestone7/components/issue-detail';
export const metadata = { title: 'Issue Detail | ForgeFlow' };
export default function Page({ params }) {
  return <Suspense fallback={<DashboardSkeleton />}><Content params={params}/></Suspense>;
}
async function Content({ params }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const { workspaceId, projectId, issueId } = await params;
  async function signOutAction() { 'use server'; await signOut({ redirectTo: '/login' }); }
  return <IssueDetail user={session.user} signOutAction={signOutAction} workspaceId={workspaceId} projectId={projectId} issueId={issueId}/>;
}
