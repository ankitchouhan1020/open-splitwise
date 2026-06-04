import { AppNav } from "@/components/app-nav";
import { AddExpenseProvider } from "@/components/add-expense-provider";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
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
    <AddExpenseProvider>
      <SyncStatusProvider enabled={syncEnabled}>
        <div
          className={
            connected ? "app-shell app-shell--connected flex min-h-dvh flex-col" : "app-shell flex min-h-dvh flex-col"
          }
        >
          <AppNav connected={connected} dbConfigured={dbConfigured} />
          <SyncStatusBanner connected={connected} dbConfigured={dbConfigured} />
          <main className="app-main flex-1">{children}</main>
          <MobileBottomNav connected={connected} />
        </div>
      </SyncStatusProvider>
    </AddExpenseProvider>
  );
}
