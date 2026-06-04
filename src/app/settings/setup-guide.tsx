"use client";

import type { SetupStatus } from "@/lib/setup/status";
import { useState } from "react";

type Props = {
  setup: SetupStatus;
  connected: boolean;
  defaultOpen?: boolean;
};

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={() => void copy()}
      className="border-border text-muted hover:text-foreground shrink-0 rounded border bg-white px-2 py-0.5 text-[11px] font-medium hover:bg-stone-50"
    >
      {copied ? "Copied" : label}
    </button>
  );
}

export function SetupGuide({ setup, connected, defaultOpen }: Props) {
  const allDone = setup.oauthConfigured && setup.dbConfigured && connected;
  const openByDefault = defaultOpen ?? !allDone;

  const completedSteps =
    setup.steps.filter((s) => s.done).length + (connected ? 1 : 0);
  const totalSteps = setup.steps.length + 1;

  const redirectConfigured = setup.envVars.find(
    (v) => v.key === "SPLITWISE_REDIRECT_URI",
  )?.configured;

  return (
    <details className="group text-sm" open={openByDefault || undefined}>
      <summary className="text-foreground flex cursor-pointer list-none items-center justify-between gap-2 text-xs font-medium [&::-webkit-details-marker]:hidden">
        <span>
          Setup guide{" "}
          <span className="text-muted font-normal">
            ({completedSteps}/{totalSteps} complete)
          </span>
        </span>
        <span className="text-muted group-open:hidden">Show</span>
        <span className="text-muted hidden group-open:inline">Hide</span>
      </summary>

      <ol className="mt-3 space-y-4">
        {setup.steps.map((step, index) => (
          <li key={step.id} className="flex gap-3">
            <StepMarker done={step.done} n={index + 1} />
            <div className="min-w-0 flex-1">
              <p
                className={
                  step.done
                    ? "text-muted text-sm line-through"
                    : "text-foreground text-sm font-medium"
                }
              >
                {step.title}
              </p>
              {step.id === "splitwise-app" && (
                <p className="text-muted mt-1 text-xs leading-relaxed">
                  Register at{" "}
                  <a
                    href="https://secure.splitwise.com/apps"
                    className="text-accent underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    secure.splitwise.com/apps
                  </a>
                  . Read the{" "}
                  <a
                    href="https://dev.splitwise.com/"
                    className="text-accent underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    API terms
                  </a>
                  . This app is not affiliated with Splitwise.
                </p>
              )}
              {step.id === "redirect-uri" && (
                <div className="mt-2 space-y-2">
                  <p className="text-muted text-xs leading-relaxed">
                    In your Splitwise app, set the callback URL to exactly:
                  </p>
                  <div className="border-border flex flex-wrap items-center justify-between gap-2 rounded-md border bg-stone-50/80 px-2 py-1.5">
                    <code className="text-foreground text-xs break-all">
                      {setup.redirectUri}
                    </code>
                    <CopyButton text={setup.redirectUri} label="Copy URI" />
                  </div>
                  {!redirectConfigured && (
                    <p className="text-muted text-xs">
                      Derived from app URL{" "}
                      <code className="text-foreground">{setup.appUrl}</code>.
                      Set <code>APP_URL</code> (or{" "}
                      <code>SPLITWISE_REDIRECT_URI</code>) in production if this
                      instance sits behind a different domain.
                    </p>
                  )}
                  {setup.redirectUriMismatch && (
                    <p className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs text-amber-950">
                      Your <code>SPLITWISE_REDIRECT_URI</code> (
                      {setup.redirectUri}) differs from this instance&apos;s URL
                      ({setup.suggestedRedirectUri}). Splitwise, your env, and
                      this server must all use the same callback.
                    </p>
                  )}
                  <p className="text-muted text-xs leading-relaxed">
                    Using Cloudflare Access? Add a <strong>Bypass</strong>{" "}
                    policy for <code>/api/auth/splitwise</code> and{" "}
                    <code>/api/auth/splitwise/callback</code> so Splitwise can
                    complete OAuth.
                  </p>
                </div>
              )}
              {step.id === "env-vars" && (
                <div className="mt-2 space-y-2">
                  <ul className="space-y-1.5">
                    {setup.envVars.map((v) => (
                      <li
                        key={v.key}
                        className="flex items-start gap-2 text-xs"
                      >
                        <span
                          className={
                            v.configured ? "text-teal-700" : "text-amber-700"
                          }
                          aria-hidden
                        >
                          {v.configured ? "✓" : "○"}
                        </span>
                        <span className="min-w-0">
                          <code className="text-foreground">{v.key}</code>
                          <span className="text-muted"> — {v.hint}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="border-border rounded-md border bg-stone-950/5">
                    <div className="border-border flex items-center justify-between border-b px-2 py-1">
                      <span className="text-muted text-[11px] font-medium">
                        Suggested .env.local (no live secrets)
                      </span>
                      <CopyButton text={setup.envSnippet} label="Copy all" />
                    </div>
                    <pre className="text-foreground overflow-x-auto p-2 text-[11px] leading-relaxed">
                      {setup.envSnippet}
                    </pre>
                  </div>
                </div>
              )}
              {step.id === "migrate" && (
                <div className="mt-2 space-y-1">
                  <p className="text-muted text-xs leading-relaxed">
                    After setting <code>DATABASE_URL</code>, run migrations and
                    restart the server:
                  </p>
                  <div className="border-border flex flex-wrap items-center justify-between gap-2 rounded-md border bg-stone-50/80 px-2 py-1.5">
                    <code className="text-foreground text-xs">
                      pnpm db:migrate
                    </code>
                    <CopyButton text="pnpm db:migrate" label="Copy" />
                  </div>
                </div>
              )}
            </div>
          </li>
        ))}

        <li className="flex gap-3">
          <StepMarker done={connected} n={setup.steps.length + 1} />
          <div>
            <p
              className={
                connected
                  ? "text-muted text-sm line-through"
                  : "text-foreground text-sm font-medium"
              }
            >
              Connect your Splitwise account
            </p>
            {!connected && setup.oauthConfigured && (
              <p className="text-muted mt-1 text-xs">
                Use <strong>Connect</strong> in the header or the button above.
              </p>
            )}
            {!connected && !setup.oauthConfigured && (
              <p className="text-muted mt-1 text-xs">
                Complete the steps above first.
              </p>
            )}
          </div>
        </li>
      </ol>
    </details>
  );
}

function StepMarker({ done, n }: { done: boolean; n: number }) {
  return (
    <span
      className={
        done
          ? "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-100 text-[11px] font-semibold text-teal-800"
          : "border-border mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border bg-white text-[11px] font-semibold text-stone-500"
      }
      aria-hidden
    >
      {done ? "✓" : n}
    </span>
  );
}
