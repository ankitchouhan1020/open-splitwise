import { AppNav } from "@/components/app-nav";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/toast-provider";
import { AddExpenseProvider } from "@/components/add-expense-provider";
import { DemoModeProvider } from "@/components/demo-mode-provider";
import { FakeDataBanner } from "@/components/fake-data-banner";
import { MobileAddFab } from "@/components/mobile-add-fab";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { SyncStatusBanner } from "@/components/sync-status-banner";
import { SyncStatusProvider } from "@/components/sync-status-provider";
import { sessionIsGuestDemo } from "@/lib/demo/session";
import { isShowcaseMode } from "@/lib/deploy-mode";
import { isDatabaseConfigured } from "@/lib/db/config";
import {
  getAppSession,
  sessionHasAccessToken,
  sessionIsActive,
  sessionShowsFakeData,
} from "@/lib/session";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await getAppSession();
  const showcase = isShowcaseMode();
  const connected = sessionIsActive(session);
  const oauthConnected = sessionHasAccessToken(session);
  const fakeDataOn = sessionShowsFakeData(session) || showcase;
  const guestDemo = sessionIsGuestDemo(session);
  const dbConfigured = isDatabaseConfigured();
  const syncEnabled = oauthConnected && dbConfigured;

  return (
    <ThemeProvider>
      <ToastProvider>
        <DemoModeProvider enabled={fakeDataOn}>
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
                {fakeDataOn && (
                  <FakeDataBanner guestDemo={guestDemo} showcase={showcase} />
                )}
                <SyncStatusBanner
                  connected={connected}
                  dbConfigured={dbConfigured}
                />
                <main className="app-main flex-1">{children}</main>
                <MobileBottomNav connected={connected} />
                <MobileAddFab
                  visible={connected && oauthConnected}
                  disabled={fakeDataOn}
                />
              </div>
            </SyncStatusProvider>
          </AddExpenseProvider>
        </DemoModeProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
