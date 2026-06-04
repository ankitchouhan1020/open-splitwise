import { AppNav } from "@/components/app-nav";
import { SyncStatusBanner } from "@/components/sync-status-banner";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppNav />
      <SyncStatusBanner />
      {children}
    </>
  );
}
