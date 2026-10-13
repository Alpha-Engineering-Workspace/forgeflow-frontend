import AppShell from "@/components/layout/app-shell";
import QueryProvider from "@/providers/query-provider";

export const metadata = {
  title: "Workspace Preview | ForgeFlow",
};

export default function PreviewLayout({ children }) {
  return (
    <QueryProvider>
      <AppShell>{children}</AppShell>
    </QueryProvider>
  );
}