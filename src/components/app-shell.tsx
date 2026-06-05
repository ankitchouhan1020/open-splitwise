import { AppNav } from "@/components/app-nav";
import { AddExpenseProvider } from "@/components/add-expense-provider";
import { FakeDataBanner } from "@/components/fake-data-banner";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { SyncStatusBanner } from "@/components/sync-status-banner";
import { SyncStatusProvider } from "@/components/sync-status-provider";
import { sessionIsGuestDemo } from "@/lib/demo/session";
import { isDatabaseConfigured } from "@/lib/db/config";
import {
  getAppSession,
  sessionHasAccessToken,
  sessionIsActive,
  sessionShowsFakeData,
} from "@/lib/session";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await getAppSession();
  const connected = sessionIsActive(session);
  const oauthConnected = sessionHasAccessToken(session);
  const fakeDataOn = sessionShowsFakeData(session);
  const guestDemo = sessionIsGuestDemo(session);
  const dbConfigured = isDatabaseConfigured();
  const syncEnabled = oauthConnected && dbConfigured && !fakeDataOn;

  return (
    <AddExpenseProvider>
      <SyncStatusProvider enabled={syncEnabled}>
        <div
          className={
            connected
              ? "app-shell app-shell--connected flex min-h-dvh flex-col"
              : "app-shell flex min-h-dvh flex-col"
          }
        >
          <AppNav
            connected={connected}
            oauthConnected={oauthConnected}
            dbConfigured={dbConfigured}
            fakeDataOn={fakeDataOn}
          />
          {fakeDataOn && <FakeDataBanner guestDemo={guestDemo} />}
          <SyncStatusBanner connected={connected} dbConfigured={dbConfigured} />
          <main className="app-main flex-1">{children}</main>
          <MobileBottomNav
            connected={connected}
            fakeDataOn={fakeDataOn}
            oauthConnected={oauthConnected}
          />
        </div>
      </SyncStatusProvider>
    </AddExpenseProvider>
  );
}
