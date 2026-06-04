import { getConnectedUser } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import { getEnvOptional } from "@/lib/env";
import { ConnectionPanel } from "@/app/settings/connection-panel";
import { SyncPanel } from "@/app/settings/sync-panel";

type PageProps = {
  searchParams: Promise<{
    error?: string;
    connected?: string;
  }>;
};

export default async function SettingsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const env = getEnvOptional();
  const user = await getConnectedUser();
  const redirectUri =
    env?.SPLITWISE_REDIRECT_URI ??
    "http://localhost:3000/api/auth/splitwise/callback";

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <p className="text-muted mt-2">
        Connect your Splitwise account using your own OAuth application. Tokens
        are stored in an encrypted session cookie on this server.
      </p>

      <ConnectionPanel
        connected={!!user}
        user={user}
        oauthConfigured={!!env}
        redirectUri={redirectUri}
        error={params.error ?? null}
        justConnected={params.connected === "1"}
      />

      {user && <SyncPanel dbConfigured={isDatabaseConfigured()} />}
    </main>
  );
}
