"use client";

import {
  SettingsAlert,
  SettingsSection,
  StatusBadge,
} from "@/app/settings/settings-ui";
import { SetupGuide } from "@/app/settings/setup-guide";
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
  error?: string | null;
  justConnected?: boolean;
};

function userInitials(user: NonNullable<Props["user"]>): string {
  const a = user.first_name?.[0] ?? "";
  const b = user.last_name?.[0] ?? "";
  return (a + b).toUpperCase() || user.email[0]?.toUpperCase() || "?";
}

export function ConnectionPanel({
  connected,
  user,
  setup,
  showSetupDetails = true,
  fakeDataOn = false,
  guestDemo = false,
  error,
  justConnected,
}: Props) {
  const { oauthConfigured } = setup;
  const router = useRouter();
  const [disconnecting, setDisconnecting] = useState(false);

  async function disconnect() {
    const message = guestDemo
      ? "Exit demo and return to the home page?"
      : "Disconnect Splitwise? This ends your session on this server. Synced data in Postgres is kept until you delete it in Privacy & data.";
    if (!confirm(message)) return;

    setDisconnecting(true);
    await fetch(guestDemo ? "/api/demo/stop" : "/api/auth/disconnect", {
      method: "POST",
    });
    if (guestDemo) router.push("/");
    router.refresh();
    setDisconnecting(false);
  }

  return (
    <SettingsSection
      title="Splitwise account"
      description="OAuth token stored in an encrypted session cookie on this server."
      action={
        guestDemo ? (
          <StatusBadge tone="warn">Guest demo</StatusBadge>
        ) : fakeDataOn ? (
          <StatusBadge tone="warn">Sample data</StatusBadge>
        ) : connected ? (
          <StatusBadge tone="ok">Connected</StatusBadge>
        ) : oauthConfigured ? (
          <StatusBadge tone="warn">Not connected</StatusBadge>
        ) : (
          <StatusBadge tone="error">Setup required</StatusBadge>
        )
      }
    >
      <div className="space-y-4">
        {justConnected && (
          <SettingsAlert tone="success">
            Connected successfully. Use <strong>Sync</strong> in the header to
            pull your expenses.
          </SettingsAlert>
        )}

        {error && (
          <SettingsAlert tone="error">
            {formatConnectionError(error)}
          </SettingsAlert>
        )}

        {!oauthConfigured ? (
          <SettingsAlert tone="info">
            OAuth is not fully configured. Open the setup guide below for env
            vars, redirect URI, and migration steps tailored to this instance.
          </SettingsAlert>
        ) : connected && user ? (
          <div className="space-y-4">
            {fakeDataOn && !guestDemo && (
              <SettingsAlert tone="info">
                Sample data overlay is on. Use the mask icon in the header to
                show your real expenses — you stay connected to Splitwise.
              </SettingsAlert>
            )}
            {guestDemo && (
              <SettingsAlert tone="info">
                Guest demo with fictional data only. Connect Splitwise to use
                your own account.
              </SettingsAlert>
            )}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className="bg-accent/10 text-accent flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                  aria-hidden
                >
                  {userInitials(user)}
                </div>
                <div className="min-w-0">
                  <p className="text-foreground truncate font-medium">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-muted truncate text-sm">{user.email}</p>
                  <p className="text-muted mt-0.5 text-xs">
                    Default currency{" "}
                    <span className="text-foreground font-mono font-medium">
                      {user.default_currency}
                    </span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void disconnect()}
                disabled={disconnecting}
                className="border-border text-muted hover:text-foreground shrink-0 rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-red-50 hover:text-red-800 disabled:opacity-50"
              >
                {disconnecting
                  ? guestDemo
                    ? "Exiting…"
                    : "Disconnecting…"
                  : guestDemo
                    ? "Exit demo"
                    : "Disconnect"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-muted text-sm">
              Connect to search expenses, view insights, and add entries from
              this app.
            </p>
            <Link href="/api/auth/splitwise" className={btnPrimary}>
              Connect Splitwise
            </Link>
          </div>
        )}

        {showSetupDetails &&
          !(oauthConfigured && setup.dbConfigured && connected) && (
            <SetupGuide setup={setup} connected={connected} />
          )}
      </div>
    </SettingsSection>
  );
}

const btnPrimary =
  "bg-accent shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90";

function formatConnectionError(code: string): string {
  const messages: Record<string, string> = {
    invalid_state: "OAuth session expired or invalid. Try connecting again.",
    missing_code_or_state:
      "Incomplete sign-in response from Splitwise. Try connecting again.",
    oauth_failed:
      "Could not complete Splitwise sign-in. Check server configuration and logs.",
  };
  return messages[code] ?? "Sign-in failed. Try connecting again.";
}
