"use client";

import {
  SettingsAlert,
  SettingsBlock,
  SettingsDangerZone,
  SettingsProfileStrip,
  SettingsRow,
  SettingsSection,
  StatusBadge,
} from "@/app/settings/settings-ui";
import { SetupGuide } from "@/app/settings/setup-guide";
import { DemoModeNotice } from "@/components/demo-mode-notice";
import { FakeDataToggle } from "@/components/fake-data-toggle";
import { DEMO_USER } from "@/lib/demo/user";
import type { SetupStatus } from "@/lib/setup/status";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  connected: boolean;
  user: {
    first_name: string;
    last_name: string;
    email: string;
    default_currency: string;
  } | null;
  setup: SetupStatus;
  showSetupDetails?: boolean;
  fakeDataOn?: boolean;
  guestDemo?: boolean;
  oauthConnected?: boolean;
  error?: string | null;
  justConnected?: boolean;
  showSyncTab?: boolean;
  bare?: boolean;
};

function userInitials(user: NonNullable<Props["user"]>): string {
  const a = user.first_name?.[0] ?? "";
  const b = user.last_name?.[0] ?? "";
  return (a + b).toUpperCase() || user.email[0]?.toUpperCase() || "?";
}

function connectionStatus(
  connected: boolean,
  guestDemo: boolean,
  fakeDataOn: boolean,
  oauthConfigured: boolean,
) {
  const tone = guestDemo
    ? "warn"
    : fakeDataOn
      ? "warn"
      : connected
        ? "ok"
        : oauthConfigured
          ? "warn"
          : "error";

  const label = guestDemo
    ? "Demo"
    : fakeDataOn
      ? "Sample data on"
      : connected
        ? "Connected"
        : oauthConfigured
          ? "Not connected"
          : "Needs setup";

  return { tone, label } as const;
}

export function ConnectionPanel({
  connected,
  user,
  setup,
  showSetupDetails = true,
  fakeDataOn = false,
  guestDemo = false,
  oauthConnected = false,
  error,
  justConnected,
  showSyncTab = false,
  bare = false,
}: Props) {
  const { oauthConfigured } = setup;
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const status = connectionStatus(
    connected,
    guestDemo,
    fakeDataOn,
    oauthConfigured,
  );
  const displayUser = fakeDataOn
    ? {
        first_name: DEMO_USER.first_name,
        last_name: DEMO_USER.last_name,
        email: DEMO_USER.email,
        default_currency: DEMO_USER.default_currency,
      }
    : user;
  const signOutDisabled = fakeDataOn && oauthConnected;

  async function logout() {
    const message = guestDemo
      ? "Leave the demo and go back to the home page?"
      : "Sign out of open-splitwise on this device? Your synced expenses stay on this server until you remove them.";
    if (!confirm(message)) return;

    setLoggingOut(true);
    await fetch(guestDemo ? "/api/demo/stop" : "/api/auth/disconnect", {
      method: "POST",
    });
    if (guestDemo) router.push("/");
    router.refresh();
    setLoggingOut(false);
  }

  const content = (
    <div className="space-y-4">
      {justConnected && !fakeDataOn && (
        <SettingsAlert tone="success">
          You&apos;re connected to Splitwise.
          {showSyncTab ? (
            <>
              {" "}
              <Link href="/settings?tab=sync" className="font-medium underline">
                Sync your expenses
              </Link>{" "}
              to start exploring.
            </>
          ) : (
            " Use Sync in the header when it becomes available."
          )}
        </SettingsAlert>
      )}
      {error && (
        <SettingsAlert tone="error">
          {formatConnectionError(error)}
        </SettingsAlert>
      )}
      {!oauthConfigured && (
        <SettingsAlert tone="info">
          This server is not ready for sign-in yet. If you&apos;re the host,
          open the Server tab to finish setup.
        </SettingsAlert>
      )}

      {oauthConfigured && connected && displayUser ? (
        <>
          {fakeDataOn && (
            <SettingsAlert tone="info">
              <DemoModeNotice feature="identity" />
            </SettingsAlert>
          )}

          <SettingsProfileStrip
            initials={userInitials(displayUser)}
            name={`${displayUser.first_name} ${displayUser.last_name}`}
            email={displayUser.email}
            badge={<StatusBadge tone={status.tone}>{status.label}</StatusBadge>}
          />

          <SettingsBlock
            title="Preferences"
            description={
              fakeDataOn
                ? "Sample profile details shown while demo mode is on."
                : "Read-only details from your Splitwise profile."
            }
          >
            <SettingsRow
              label="Default currency"
              description="Shown on balances and summaries here."
            >
              <span className="text-foreground text-sm font-medium tabular-nums">
                {displayUser.default_currency}
              </span>
            </SettingsRow>
            {oauthConnected && (
              <SettingsRow
                label="Demo mode"
                description="Show fictional expenses instead of your real amounts — useful when sharing your screen."
              >
                <FakeDataToggle enabled={fakeDataOn} />
              </SettingsRow>
            )}
          </SettingsBlock>

          <SettingsDangerZone
            description={
              guestDemo
                ? "Leave the guest demo and return to the public home page."
                : signOutDisabled
                  ? "Account actions are paused while sample data is on."
                  : "Sign out on this device. This does not delete expenses on Splitwise or on this server."
            }
          >
            {signOutDisabled ? (
              <SettingsRow label="Sign out">
                <DemoModeNotice feature="signOut" />
              </SettingsRow>
            ) : (
              <SettingsRow label={guestDemo ? "Exit demo" : "Sign out"}>
                <button
                  type="button"
                  onClick={() => void logout()}
                  disabled={loggingOut}
                  className="border-error-border text-error-text hover:bg-error-bg rounded-lg border px-3 py-1.5 text-sm font-medium disabled:opacity-50"
                >
                  {loggingOut
                    ? guestDemo
                      ? "Leaving…"
                      : "Signing out…"
                    : guestDemo
                      ? "Exit demo"
                      : "Sign out"}
                </button>
              </SettingsRow>
            )}
          </SettingsDangerZone>
        </>
      ) : oauthConfigured ? (
        <SettingsBlock embedded>
          <div className="space-y-4 px-4 py-8 md:px-6">
            <div className="mx-auto max-w-sm text-center">
              <p className="text-foreground text-sm font-medium">
                Connect your Splitwise account
              </p>
              <p className="text-muted mt-2 text-sm leading-relaxed">
                We&apos;ll copy your expenses to this server so you can search,
                filter, and chart your share. You still add and settle up in the
                Splitwise app.
              </p>
            </div>
            <div className="flex justify-center">
              <Link href="/api/auth/splitwise" className={btnPrimary}>
                Connect with Splitwise
              </Link>
            </div>
          </div>
        </SettingsBlock>
      ) : null}

      {showSetupDetails &&
        !(oauthConfigured && setup.dbConfigured && connected) && (
          <SetupGuide setup={setup} connected={connected} />
        )}
    </div>
  );

  if (bare) return content;

  return (
    <SettingsSection
      title="Account"
      action={<StatusBadge tone={status.tone}>{status.label}</StatusBadge>}
    >
      {content}
    </SettingsSection>
  );
}

const btnPrimary =
  "bg-accent inline-flex rounded-lg px-4 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90";

function formatConnectionError(code: string): string {
  const messages: Record<string, string> = {
    invalid_state:
      "Your sign-in session expired. Connect to Splitwise again to continue.",
    missing_code_or_state:
      "Splitwise did not finish signing you in. Try connecting again.",
    oauth_failed:
      "We could not connect to Splitwise. If you run this server, check the Server tab.",
  };
  return messages[code] ?? "Sign-in failed. Try connecting again.";
}
