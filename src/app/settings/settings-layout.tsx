"use client";

import { AiSection } from "@/app/settings/ai-section";
import { ConnectionPanel } from "@/app/settings/connection-panel";
import { SettingsNav } from "@/app/settings/settings-nav";
import type { SettingsTab } from "@/app/settings/settings-copy";
import { PrivacySection } from "@/app/settings/privacy-section";
import { SettingsAlert } from "@/app/settings/settings-ui";
import { SetupGuide } from "@/app/settings/setup-guide";
import { SyncPanel } from "@/app/settings/sync-panel";
import { SystemPanel } from "@/app/settings/system-panel";
import { ThemeSection } from "@/app/settings/theme-section";
import type { SetupStatus } from "@/lib/setup/status";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

type User = {
  first_name: string;
  last_name: string;
  email: string;
  default_currency: string;
} | null;

function parseTab(value: string | null, allowed: SettingsTab[]): SettingsTab {
  if (value && allowed.includes(value as SettingsTab)) {
    return value as SettingsTab;
  }
  return allowed[0] ?? "account";
}

type Props = {
  connected: boolean;
  user: User;
  setup: SetupStatus;
  showSetupDetails: boolean;
  fakeDataOn: boolean;
  guestDemo: boolean;
  oauthConnected: boolean;
  showSync: boolean;
  showAi: boolean;
  canDeleteSyncedData: boolean;
  oauthError?: string | null;
  justConnected?: boolean;
};

export function SettingsLayout({
  connected,
  user,
  setup,
  showSetupDetails,
  fakeDataOn,
  guestDemo,
  oauthConnected,
  showSync,
  showAi,
  canDeleteSyncedData,
  oauthError,
  justConnected,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tabs = useMemo(() => {
    const items: SettingsTab[] = ["account", "appearance"];
    if (showAi) items.push("ai");
    if (showSync) items.push("sync");
    items.push("data");
    if (
      showSetupDetails &&
      !(setup.oauthConfigured && setup.dbConfigured && connected)
    ) {
      items.push("setup");
    }
    return items;
  }, [showAi, showSync, showSetupDetails, setup, connected]);

  const activeTab = parseTab(searchParams.get("tab"), tabs);

  const setTab = useCallback(
    (tab: SettingsTab) => {
      const params = new URLSearchParams(searchParams.toString());
      if (tab === tabs[0]) params.delete("tab");
      else params.set("tab", tab);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams, tabs],
  );

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-16">
      <aside className="shrink-0 lg:sticky lg:top-4 lg:w-28">
        <SettingsNav tabs={tabs} activeTab={activeTab} onSelect={setTab} />
      </aside>

      <div className="min-w-0 flex-1">
        {activeTab === "account" && (
          <ConnectionPanel
            connected={connected}
            user={user}
            setup={setup}
            showSetupDetails={false}
            fakeDataOn={fakeDataOn}
            guestDemo={guestDemo}
            oauthConnected={oauthConnected}
            error={oauthError ?? null}
            justConnected={justConnected}
            showSyncTab={showSync}
            bare
          />
        )}

        {activeTab === "appearance" && <ThemeSection bare />}

        {activeTab === "ai" && showAi && (
          <AiSection
            bare
            dbConfigured={setup.dbConfigured}
            connected={connected}
            demoMode={fakeDataOn}
          />
        )}

        {activeTab === "sync" && showSync && (
          <SyncPanel
            dbConfigured={setup.dbConfigured}
            demoMode={fakeDataOn}
            bare
          />
        )}

        {activeTab === "data" && (
          <PrivacySection
            canDeleteSyncedData={canDeleteSyncedData}
            demoMode={fakeDataOn}
            bare
          />
        )}

        {activeTab === "setup" && (
          <div className="space-y-4">
            <SystemPanel setup={setup} bare />
            <SetupGuide setup={setup} connected={connected} defaultOpen bare />
          </div>
        )}
      </div>
    </div>
  );
}

export function SettingsPageAlerts({
  error,
  connected,
}: {
  error?: string;
  connected?: string;
}) {
  if (!error || connected) return null;
  return (
    <div className="mb-4">
      <SettingsAlert tone="error">{oauthErrorMessage(error)}</SettingsAlert>
    </div>
  );
}

function oauthErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    invalid_state:
      "Your sign-in session expired. Connect to Splitwise again to continue.",
    missing_code_or_state:
      "Splitwise did not finish signing you in. Try connecting again.",
    oauth_failed:
      "We could not connect to Splitwise. If you run this server, check the Server tab.",
    connect_required: "Connect Splitwise to use this app.",
  };
  return messages[code] ?? "Sign-in failed. Try connecting again.";
}
