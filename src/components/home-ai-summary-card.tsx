"use client";

import { AiSparkleIcon } from "@/components/ai-sparkle-icon";
import { DemoModeNotice } from "@/components/demo-mode-notice";
import { Shimmer } from "@/components/shimmer";
import { ui } from "@/lib/ui-classes";
import Link from "next/link";

type Props = {
  aiAvailable: boolean;
  aiStatusPending?: boolean;
  demoMode?: boolean;
  narrative: string | null;
  cacheLoading?: boolean;
  generating?: boolean;
  error: string | null;
  onGenerate: () => void;
};

function NarrativeSkeleton() {
  return (
    <div className="space-y-2" aria-hidden>
      <Shimmer className="h-3.5 w-full rounded-md" />
      <Shimmer className="h-3.5 w-[94%] rounded-md" />
      <Shimmer className="h-3.5 w-[82%] rounded-md" />
    </div>
  );
}

export function HomeAiSummaryCard({
  aiAvailable,
  aiStatusPending = false,
  demoMode = false,
  narrative,
  cacheLoading = false,
  generating = false,
  error,
  onGenerate,
}: Props) {
  const hasNarrative = Boolean(narrative);
  const busy = cacheLoading || generating || aiStatusPending;
  const interactive = aiAvailable && !demoMode && !busy;
  const actionLabel = generating
    ? "Generating…"
    : hasNarrative
      ? "Regenerate"
      : "Generate";

  const showBody =
    demoMode ||
    aiStatusPending ||
    !aiAvailable ||
    busy ||
    Boolean(error) ||
    hasNarrative ||
    interactive;

  return (
    <div className="border-border bg-card overflow-hidden rounded-lg border">
      <div className="flex items-start justify-between gap-3 p-2.5 sm:p-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="bg-accent/10 text-accent mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
            <AiSparkleIcon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold">AI summary</p>
            <p className="text-muted text-xs leading-relaxed">
              A quick read on this month&apos;s spending
            </p>
          </div>
        </div>

        {!demoMode && aiAvailable ? (
          <button
            type="button"
            onClick={onGenerate}
            disabled={!interactive}
            className={`inline-flex min-w-[5.5rem] shrink-0 items-center justify-center rounded-md border px-2.5 py-2 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50 ${
              !interactive
                ? "border-border text-muted"
                : hasNarrative
                  ? `${ui.btnSecondary} rounded-md py-2 text-xs`
                  : "bg-accent text-accent-foreground hover:bg-accent/90 border-accent"
            }`}
            aria-busy={busy}
          >
            {actionLabel}
          </button>
        ) : null}
      </div>

      {showBody ? (
        <div
          className="border-border border-t px-2.5 py-2.5 sm:px-3 sm:py-3"
          role="status"
          aria-live="polite"
          aria-busy={busy}
        >
          {demoMode ? (
            <DemoModeNotice feature="ai" />
          ) : aiStatusPending || cacheLoading ? (
            <NarrativeSkeleton />
          ) : !aiAvailable ? (
            <p className="text-muted text-sm leading-relaxed">
              Turn on AI in{" "}
              <Link
                href="/settings?tab=ai"
                className="text-accent font-medium hover:underline"
              >
                Settings → AI
              </Link>{" "}
              to get a short spending summary here.
            </p>
          ) : generating ? (
            <NarrativeSkeleton />
          ) : error ? (
            <p className={ui.errorBox}>{error}</p>
          ) : hasNarrative ? (
            <p className="border-accent/25 text-foreground border-l-2 pl-3 text-sm leading-relaxed">
              {narrative}
            </p>
          ) : (
            <p className="text-muted text-sm leading-relaxed">
              Get a short overview of what stood out this month—how spending
              shifted, who you spent with, and what&apos;s worth a second look.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
