"use client";

import { ExploreAiResult } from "@/app/explore/explore-ai-result";
import { buildSmartFilterExamples } from "@/app/explore/smart-filter-examples";
import { AiSparkleIcon } from "@/components/ai-sparkle-icon";
import { DemoModeNotice } from "@/components/demo-mode-notice";
import { ui } from "@/lib/ui-classes";
import type { ExploreGroupStat } from "@/lib/expenses/explore-context";
import { useMemo } from "react";

type Props = {
  prompt: string;
  onPromptChange: (value: string) => void;
  onAskAi: () => void;
  onExampleQuery: (query: string) => void;
  pending: boolean;
  groupStats: ExploreGroupStat[];
  topCategories: Array<{ categoryName: string }>;
  friends: Array<{ name: string }>;
  explanation: string | null;
  warnings: string[];
  totalLine: string | null;
  error: string | null;
  onDismissResult: () => void;
  disabled?: boolean;
  demoMode?: boolean;
  categoryReviewEnabled?: boolean;
  onCategoryReviewToggle?: () => void;
  categoryReviewPending?: boolean;
  categoryReviewSuggestionCount?: number;
  categoryReviewError?: string | null;
};

export function ExploreAiCard({
  prompt,
  onPromptChange,
  onAskAi,
  onExampleQuery,
  pending,
  groupStats,
  topCategories,
  friends,
  explanation,
  warnings,
  totalLine,
  error,
  onDismissResult,
  disabled = false,
  demoMode = false,
  categoryReviewEnabled = false,
  onCategoryReviewToggle,
  categoryReviewPending = false,
  categoryReviewSuggestionCount = 0,
  categoryReviewError = null,
}: Props) {
  const exampleQueries = useMemo(
    () =>
      buildSmartFilterExamples({
        groups: groupStats,
        topCategories,
        friends,
      }),
    [groupStats, topCategories, friends],
  );

  const hasResult =
    pending || Boolean(error) || Boolean(explanation) || warnings.length > 0;
  const canSubmit = prompt.trim().length > 0 && !pending && !disabled;
  const showCategoryReview = !disabled && onCategoryReviewToggle;

  return (
    <div className="border-border bg-card overflow-hidden rounded-lg border">
      <div className="flex flex-col gap-2 p-2.5 sm:p-3">
        {disabled ? (
          demoMode ? (
            <DemoModeNotice feature="ai" />
          ) : (
            <p className="text-muted text-xs leading-relaxed">
              Turn on AI in Settings → AI to filter expenses with natural
              language and review categories.
            </p>
          )
        ) : null}
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <AiSparkleIcon className="text-accent pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Ask AI"
              value={prompt}
              disabled={disabled}
              onChange={(e) => onPromptChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canSubmit) {
                  e.preventDefault();
                  onAskAi();
                }
              }}
              className={`${ui.input} py-2 pr-9 pl-8 text-sm disabled:cursor-not-allowed disabled:opacity-60`}
              aria-busy={pending}
              aria-label="Ask AI"
            />
            {prompt.length > 0 && !pending ? (
              <button
                type="button"
                onClick={() => onPromptChange("")}
                className="text-muted hover:text-foreground hover:bg-hover absolute top-1/2 right-2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md"
                aria-label="Clear"
              >
                ×
              </button>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onAskAi}
            disabled={!canSubmit}
            className={`inline-flex min-w-[4.75rem] shrink-0 items-center justify-center rounded-md border px-2.5 py-2 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50 ${
              canSubmit
                ? "bg-accent text-accent-foreground hover:bg-accent/90 border-accent"
                : "border-border text-muted"
            }`}
            aria-busy={pending}
          >
            Submit
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-muted text-xs">Try:</span>
          {exampleQueries.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => onExampleQuery(example)}
              disabled={disabled}
              className={`${ui.chip} text-xs disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {hasResult ? (
        <div className="border-border border-t px-2.5 py-2">
          <ExploreAiResult
            explanation={explanation}
            warnings={warnings}
            totalLine={totalLine}
            loading={pending}
            error={error}
            onDismiss={onDismissResult}
            embedded
          />
        </div>
      ) : null}

      {showCategoryReview ? (
        <div className="border-border border-t px-2.5 py-2.5 sm:px-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold">Category review</p>
              <p className="text-muted text-xs leading-relaxed">
                Suggest categories for uncategorized or mismatched expenses in
                the list below.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {categoryReviewEnabled && categoryReviewPending ? (
                <span className="text-muted text-xs">
                  Fetching suggestions…
                </span>
              ) : null}
              {categoryReviewEnabled &&
              !categoryReviewPending &&
              categoryReviewSuggestionCount > 0 ? (
                <span className="bg-accent/10 text-accent rounded-full px-2 py-0.5 text-xs font-medium tabular-nums">
                  {categoryReviewSuggestionCount} suggestion
                  {categoryReviewSuggestionCount === 1 ? "" : "s"}
                </span>
              ) : null}
              <button
                type="button"
                onClick={onCategoryReviewToggle}
                className={
                  categoryReviewEnabled
                    ? "bg-pill-active text-pill-active-fg rounded-md px-3 py-1.5 text-xs font-medium"
                    : `${ui.btnSecondary} px-3 py-1.5 text-xs`
                }
                aria-pressed={categoryReviewEnabled}
              >
                {categoryReviewEnabled ? "On" : "Review categories"}
              </button>
            </div>
          </div>
          {categoryReviewError ? (
            <p className="bg-error-bg text-error-text mt-2 rounded-md px-2 py-1 text-xs">
              {categoryReviewError}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
