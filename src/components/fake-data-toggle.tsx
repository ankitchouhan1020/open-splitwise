"use client";

import { invalidateExpenseCaches } from "@/lib/query/invalidate";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  enabled: boolean;
  /** Compact icon-only for mobile header */
  compact?: boolean;
};

function MaskIcon({ className }: { className?: string }) {
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
        d="M8 10h.01M16 10h.01M7.5 15.5c1.2 1.5 2.8 2.5 4.5 2.5s3.3-1 4.5-2.5M5 9.5C5 6.5 8 4 12 4s7 2.5 7 5.5c0 5.5-3.5 9.5-7 9.5S5 15 5 9.5Z"
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
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const label = enabled ? "Demo mode on" : "Demo mode off";
  const title = enabled
    ? "Showing fictional data — click to use your real expenses"
    : "Turn on demo mode to show fictional expenses";

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
        <MaskIcon className="h-[17px] w-[17px]" />
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
      <MaskIcon className="h-4 w-4 shrink-0" />
      <span>{enabled ? "On" : "Off"}</span>
    </button>
  );
}
