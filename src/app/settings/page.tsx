import { AppShell } from "@/components/app-shell";
import { PageContainer } from "@/components/page-container";
import {
  SettingsLayout,
  SettingsPageAlerts,
} from "@/app/settings/settings-layout";
import { getConnectedUser } from "@/lib/auth";
import { getSetupStatus } from "@/lib/setup/status";
import { requestOriginFromHeaders } from "@/lib/request-origin";
import { sessionIsGuestDemo } from "@/lib/demo/session";
import { isShowcaseMode } from "@/lib/deploy-mode";
import { shouldExposeSetupDetails } from "@/lib/security/production";
import {
  getAppSession,
  sessionIsActive,
  sessionShowsFakeData,
} from "@/lib/session";
import { connection } from "next/server";
import { headers } from "next/headers";
import { Suspense } from "react";

type PageProps = {
  searchParams: Promise<{
    error?: string;
    connected?: string;
    tab?: string;
  }>;
};

export const dynamic = "force-dynamic";

function SettingsSkeleton() {
  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:gap-16">
      <div className="bg-muted-surface h-24 w-28 animate-pulse rounded-md" />
      <div className="bg-muted-surface h-64 min-w-0 flex-1 animate-pulse rounded-lg" />
    </div>
  );
}

export default async function SettingsPage({ searchParams }: PageProps) {
  await connection();
  const params = await searchParams;
  const user = await getConnectedUser();
  const session = await getAppSession();
  const showcase = isShowcaseMode();
  const fakeDataOn = sessionShowsFakeData(session) || showcase;
  const guestDemo = sessionIsGuestDemo(session);
  const headerList = await headers();
  const setup = getSetupStatus(requestOriginFromHeaders(headerList));
  const showSetupDetails = shouldExposeSetupDetails({
    sessionActive: sessionIsActive(session),
    oauthConfigured: setup.oauthConfigured,
    dbConfigured: setup.dbConfigured,
  });
  const showSync = !!user || setup.dbConfigured;
  const oauthConnected = !!user && !guestDemo && !showcase;

  return (
    <AppShell>
      <PageContainer>
        <SettingsPageAlerts error={params.error} connected={params.connected} />

        <Suspense fallback={<SettingsSkeleton />}>
          <SettingsLayout
            connected={!!user}
            user={user}
            setup={setup}
            showSetupDetails={showSetupDetails}
            fakeDataOn={fakeDataOn}
            guestDemo={guestDemo}
            oauthConnected={oauthConnected}
            showSync={showSync}
            showAi={!!user && setup.dbConfigured && !guestDemo}
            canDeleteSyncedData={!!user && !guestDemo && setup.dbConfigured}
            oauthError={params.connected ? null : (params.error ?? null)}
            justConnected={params.connected === "1"}
          />
        </Suspense>
      </PageContainer>
    </AppShell>
  );
}
