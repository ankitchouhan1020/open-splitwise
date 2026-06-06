"use client";

import { ExploreAiResult } from "@/app/explore/explore-ai-result";
import { buildSmartFilterExamples } from "@/app/explore/smart-filter-examples";
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
};

function AiSparkleIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.847a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.847.813a4.5 4.5 0 0 0-3.09 3.09Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.455 2.456Z"
      />
    </svg>
  );
}

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
  const canSubmit = prompt.trim().length > 0 && !pending;

  return (
    <div className="border-border bg-card overflow-hidden rounded-lg border">
      <div className="flex flex-col gap-2 p-2.5 sm:p-3">
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <AiSparkleIcon className="text-accent pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Ask AI"
              value={prompt}
              onChange={(e) => onPromptChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canSubmit) {
                  e.preventDefault();
                  onAskAi();
                }
              }}
              className={`${ui.input} py-2 pr-9 pl-8 text-sm`}
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
            className={`inline-flex min-w-[4.75rem] shrink-0 items-center justify-center rounded-md border px-2.5 py-2 text-xs font-medium ${
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
              className={`${ui.chip} text-xs`}
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
    </div>
  );
}
