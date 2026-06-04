"use client";

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
  oauthConfigured: boolean;
  redirectUri: string;
  error?: string | null;
  justConnected?: boolean;
};

export function ConnectionPanel({
  connected,
  user,
  oauthConfigured,
  redirectUri,
  error,
  justConnected,
}: Props) {
  const router = useRouter();
  const [disconnecting, setDisconnecting] = useState(false);

  async function disconnect() {
    setDisconnecting(true);
    await fetch("/api/auth/disconnect", { method: "POST" });
    router.refresh();
    setDisconnecting(false);
  }

  return (
    <div className="border-border bg-card mt-8 space-y-6 rounded-xl border p-6">
      <h2 className="text-lg font-medium">Splitwise connection</h2>

      {justConnected && (
        <p className="rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-900">
          Connected successfully.
        </p>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      {!oauthConfigured ? (
        <p className="text-muted text-sm">
          OAuth is not configured on the server. Copy <code>.env.example</code>{" "}
          to <code>.env.local</code> and set <code>SPLITWISE_CLIENT_ID</code>,{" "}
          <code>SPLITWISE_CLIENT_SECRET</code>,{" "}
          <code>SPLITWISE_REDIRECT_URI</code>, and <code>SESSION_SECRET</code>{" "}
          (32+ characters).
        </p>
      ) : connected && user ? (
        <div className="space-y-4">
          <p className="text-sm">
            Signed in as{" "}
            <span className="font-medium">
              {user.first_name} {user.last_name}
            </span>{" "}
            ({user.email}) · default currency {user.default_currency}
          </p>
          <button
            type="button"
            onClick={() => void disconnect()}
            disabled={disconnecting}
            className="border-border rounded-lg border px-4 py-2 text-sm font-medium hover:bg-stone-50 disabled:opacity-50"
          >
            {disconnecting ? "Disconnecting…" : "Disconnect"}
          </button>
        </div>
      ) : (
        <a
          href="/api/auth/splitwise"
          className="bg-accent inline-block rounded-lg px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Connect Splitwise
        </a>
      )}

      <details className="text-muted text-sm">
        <summary className="text-foreground cursor-pointer font-medium">
          How to register your OAuth app (BYO)
        </summary>
        <ol className="mt-3 list-decimal space-y-2 pl-5">
          <li>
            Go to{" "}
            <a
              href="https://secure.splitwise.com/apps"
              className="text-accent underline"
              target="_blank"
              rel="noreferrer"
            >
              secure.splitwise.com/apps
            </a>{" "}
            and create an application.
          </li>
          <li>
            Set the callback / redirect URI to exactly:{" "}
            <code className="text-foreground bg-stone-100 px-1">
              {redirectUri}
            </code>
          </li>
          <li>
            Copy Client ID and Client Secret into your server environment (never
            commit secrets).
          </li>
          <li>
            Read the{" "}
            <a
              href="https://dev.splitwise.com/"
              className="text-accent underline"
              target="_blank"
              rel="noreferrer"
            >
              API terms
            </a>
            . This app is a personal analytics companion, not affiliated with
            Splitwise.
          </li>
        </ol>
      </details>
    </div>
  );
}
