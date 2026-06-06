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

  return (
    <div className="border-border bg-card overflow-hidden rounded-lg border">
      <div className="flex flex-col gap-2 p-2.5 sm:p-3">
        {disabled ? (
          demoMode ? (
            <DemoModeNotice feature="ai" />
          ) : (
            <p className="text-muted text-xs leading-relaxed">
              Turn on AI in Settings → AI to filter expenses with natural
              language.
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
    </div>
  );
}
