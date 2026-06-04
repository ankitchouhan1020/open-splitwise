import { AppNav } from "@/components/app-nav";
import { SyncStatusBanner } from "@/components/sync-status-banner";
import { SyncStatusProvider } from "@/components/sync-status-provider";
import { isDatabaseConfigured } from "@/lib/db/config";
import { getAppSession, sessionHasAccessToken } from "@/lib/session";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await getAppSession();
  const connected = sessionHasAccessToken(session);
  const dbConfigured = isDatabaseConfigured();
  const syncEnabled = connected && dbConfigured;

  return (
    <SyncStatusProvider enabled={syncEnabled}>
      <AppNav connected={connected} dbConfigured={dbConfigured} />
      <SyncStatusBanner connected={connected} dbConfigured={dbConfigured} />
      {children}
    </SyncStatusProvider>
  );
}
