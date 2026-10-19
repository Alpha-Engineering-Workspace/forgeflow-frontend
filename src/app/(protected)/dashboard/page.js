import { redirect } from "next/navigation";
import { auth, signOut } from "../../../auth.js";
import { WorkspaceHome } from "@/features/workspaces/components/workspace-home";

export const metadata = { title: "Workspaces | ForgeFlow" };

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return <WorkspaceHome user={session.user} signOutAction={signOutAction} />;
}
