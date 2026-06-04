"use client";

import { formatSyncProgressMessage } from "@/lib/format";

type Progress = {
  phase: string;
  synced?: number;
  label?: string | null;
};

type Props = {
  progress: Progress | null | undefined;
  compact?: boolean;
  className?: string;
};

export function SyncProgressIndicator({
  progress,
  compact = false,
  className = "",
}: Props) {
  const message = formatSyncProgressMessage(progress);

  if (compact) {
    return (
      <span className={className} aria-live="polite">
        {message}
      </span>
    );
  }

  return (
    <div className={`space-y-2 ${className}`} aria-live="polite">
      <p className="text-foreground text-sm font-medium">{message}</p>
      <div
        className="bg-border h-1.5 overflow-hidden rounded-full"
        role="progressbar"
        aria-valuetext={message}
      >
        <div className="shimmer h-full w-full rounded-full" />
      </div>
    </div>
  );
}
