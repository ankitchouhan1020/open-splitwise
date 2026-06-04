import { AppShell } from "@/components/app-shell";
import { ConnectionPanel } from "@/app/settings/connection-panel";
import { PrivacySection } from "@/app/settings/privacy-section";
import { SettingsAlert } from "@/app/settings/settings-ui";
import { SyncPanel } from "@/app/settings/sync-panel";
import { SystemPanel } from "@/app/settings/system-panel";
import { getConnectedUser } from "@/lib/auth";
import { getSetupStatus } from "@/lib/setup/status";
import { headers } from "next/headers";

type PageProps = {
  searchParams: Promise<{
    error?: string;
    connected?: string;
  }>;
};

function requestOriginFromHeaders(headerList: Headers): string {
  const host =
    headerList.get("x-forwarded-host") ??
    headerList.get("host") ??
    "localhost:3000";
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export default async function SettingsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const user = await getConnectedUser();
  const headerList = await headers();
  const setup = getSetupStatus(requestOriginFromHeaders(headerList));

  return (
    <AppShell>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <header className="mb-4">
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
            <SettingsAlert tone="error">{params.error}</SettingsAlert>
          </div>
        )}

        <div className="space-y-4">
          <ConnectionPanel
            connected={!!user}
            user={user}
            setup={setup}
            error={params.connected ? null : (params.error ?? null)}
            justConnected={params.connected === "1"}
          />

          {(user || setup.dbConfigured) && (
            <SyncPanel dbConfigured={setup.dbConfigured} />
          )}

          <SystemPanel setup={setup} />

          <PrivacySection />
        </div>
      </main>
    </AppShell>
  );
}
