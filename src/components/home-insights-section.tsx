"use client";

import type { DynamicInsight } from "@/lib/expenses/dashboard";
import { insightToneClass } from "@/lib/tone-styles";
import Link from "next/link";

type Props = {
  insights: DynamicInsight[];
  aiAvailable?: boolean;
  narrative?: string | null;
  narrativeLoading?: boolean;
  narrativeError?: string | null;
  onGenerateNarrative?: () => void;
};

export function HomeInsightsSection({
  insights,
  aiAvailable = false,
  narrative,
  narrativeLoading = false,
  narrativeError = null,
  onGenerateNarrative,
}: Props) {
  if (insights.length === 0 && !aiAvailable) return null;

  const showAiBlock = aiAvailable && onGenerateNarrative;
  const hasNarrative = Boolean(narrative);

  return (
    <section className="space-y-3" aria-label="Insights">
      {showAiBlock && (
        <div className="border-border bg-muted-surface/60 rounded-lg border px-3.5 py-3">
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
            <p className="text-muted text-xs font-medium tracking-wide uppercase">
              AI insight
            </p>
            {!narrativeLoading && (
              <button
                type="button"
                onClick={onGenerateNarrative}
                className="text-accent text-xs font-medium hover:underline"
              >
                {hasNarrative ? "Regenerate" : "Generate summary"}
              </button>
            )}
          </div>
          {narrativeLoading ? (
            <p className="text-muted text-sm">Generating summary…</p>
          ) : narrativeError ? (
            <p className="text-error-text text-sm">{narrativeError}</p>
          ) : hasNarrative ? (
            <p className="text-foreground text-sm leading-relaxed">
              {narrative}
            </p>
          ) : (
            <p className="text-muted text-sm">
              Get a short AI-written summary of this month&apos;s spending.
            </p>
          )}
        </div>
      )}

      {insights.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-3">
          {insights.map((insight) => {
            const className = `rounded-lg border px-3.5 py-3 ${insightToneClass[insight.tone]}`;
            const inner = (
              <>
                <p className="text-sm font-semibold">{insight.headline}</p>
                <p className="mt-1 text-xs leading-relaxed opacity-90">
                  {insight.detail}
                </p>
              </>
            );

            if (insight.href) {
              return (
                <Link
                  key={insight.id}
                  href={insight.href}
                  className={`${className} hover:opacity-90`}
                >
                  {inner}
                </Link>
              );
            }

            return (
              <div key={insight.id} className={className}>
                {inner}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
