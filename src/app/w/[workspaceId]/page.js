import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth, signOut } from '../../../auth.js';
import { DashboardSkeleton } from '@/components/ui/skeleton';
import { WorkspaceHome } from '@/features/workspaces/components/workspace-home';

export const metadata = { title: 'Workspace | ForgeFlow' };

export default function WorkspacePage({ params }) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <WorkspaceContent params={params} />
    </Suspense>
  );
}

async function WorkspaceContent({ params }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const { workspaceId } = await params;

  async function signOutAction() {
    'use server';
    await signOut({ redirectTo: '/login' });
  }

  return <WorkspaceHome user={session.user} signOutAction={signOutAction} workspaceId={workspaceId} />;
}
