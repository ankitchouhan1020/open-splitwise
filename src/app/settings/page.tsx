import { AppShell } from "@/components/app-shell";
import { ConnectionPanel } from "@/app/settings/connection-panel";
import { PrivacySection } from "@/app/settings/privacy-section";
import { SettingsAlert } from "@/app/settings/settings-ui";
import { SyncPanel } from "@/app/settings/sync-panel";
import { SystemPanel } from "@/app/settings/system-panel";
import { getConnectedUser } from "@/lib/auth";
import { getSetupStatus } from "@/lib/setup/status";
import { requestOriginFromHeaders } from "@/lib/request-origin";
import { sessionIsGuestDemo } from "@/lib/demo/session";
import { shouldExposeSetupDetails } from "@/lib/security/production";
import {
  getAppSession,
  sessionIsActive,
  sessionShowsFakeData,
} from "@/lib/session";
import { connection } from "next/server";
import { headers } from "next/headers";

type PageProps = {
  searchParams: Promise<{
    error?: string;
    connected?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function SettingsPage({ searchParams }: PageProps) {
  await connection();
  const params = await searchParams;
  const user = await getConnectedUser();
  const session = await getAppSession();
  const fakeDataOn = sessionShowsFakeData(session);
  const guestDemo = sessionIsGuestDemo(session);
  const headerList = await headers();
  const setup = getSetupStatus(requestOriginFromHeaders(headerList));
  const showSetupDetails = shouldExposeSetupDetails({
    sessionActive: sessionIsActive(session),
    oauthConfigured: setup.oauthConfigured,
    dbConfigured: setup.dbConfigured,
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 md:py-6">
        <header className="mb-4 hidden md:block">
          <h1 className="text-foreground text-xl font-semibold tracking-tight">
            Settings
          </h1>
          <p className="text-muted mt-1 text-sm">
            Account connection, data sync, and server configuration for this
            instance.
          </p>
        </header>

        {params.error && !params.connected && (
          <div className="mb-4">
            <SettingsAlert tone="error">
              {oauthErrorMessage(params.error)}
            </SettingsAlert>
          </div>
        )}

        <div className="space-y-4">
          <ConnectionPanel
            connected={!!user}
            user={user}
            setup={setup}
            showSetupDetails={showSetupDetails}
            fakeDataOn={fakeDataOn}
            guestDemo={guestDemo}
            error={params.connected ? null : (params.error ?? null)}
            justConnected={params.connected === "1"}
          />

          {!fakeDataOn && (user || setup.dbConfigured) && (
            <SyncPanel dbConfigured={setup.dbConfigured} />
          )}

          {showSetupDetails && <SystemPanel setup={setup} />}

          <PrivacySection
            canDeleteSyncedData={
              !!user && !guestDemo && setup.dbConfigured && !fakeDataOn
            }
          />
        </div>
      </div>
    </AppShell>
  );
}

function oauthErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    invalid_state: "OAuth session expired or invalid. Try connecting again.",
    missing_code_or_state:
      "Incomplete sign-in response from Splitwise. Try connecting again.",
    oauth_failed:
      "Could not complete Splitwise sign-in. Check server configuration and logs.",
    connect_required: "Connect Splitwise to use this app.",
  };
  return messages[code] ?? "Sign-in failed. Try connecting again.";
}
