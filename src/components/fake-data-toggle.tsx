"use client";

import { invalidateExpenseCaches } from "@/lib/query/invalidate";
import { queryKeys } from "@/lib/query/keys";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  enabled: boolean;
  /** Compact icon-only for mobile header */
  compact?: boolean;
};

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      className={className}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
      />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      className={className}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
      />
    </svg>
  );
}

export function FakeDataToggle({ enabled, compact = false }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      const res = await fetch("/api/fake-data/toggle", { method: "POST" });
      if (!res.ok) return;
      await invalidateExpenseCaches(queryClient);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.ai.settings() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.ai.status() }),
      ]);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const label = enabled
    ? "Real amounts hidden — showing sample data"
    : "Showing your real amounts";
  const title = enabled
    ? "Real amounts hidden — click to show your expenses"
    : "Hide real amounts and show sample data";
  const Icon = enabled ? EyeOffIcon : EyeIcon;

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => void toggle()}
        disabled={busy}
        aria-label={label}
        title={title}
        aria-pressed={enabled}
        className={
          enabled
            ? "bg-balance-pay-bg text-warn-text ring-warn-border hover:bg-warn-bg inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 disabled:opacity-50"
            : "border-border text-muted hover:text-foreground bg-card hover:bg-hover inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border disabled:opacity-50"
        }
      >
        <Icon className="h-[17px] w-[17px]" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      disabled={busy}
      aria-label={label}
      title={title}
      aria-pressed={enabled}
      className={
        enabled
          ? "bg-balance-pay-bg text-warn-text ring-warn-border hover:bg-warn-bg inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold ring-1 disabled:opacity-50 md:px-3 md:text-sm"
          : "border-border text-muted hover:text-foreground bg-card hover:bg-hover inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium disabled:opacity-50 md:px-3 md:text-sm"
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{enabled ? "On" : "Off"}</span>
    </button>
  );
}
