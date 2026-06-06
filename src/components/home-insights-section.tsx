"use client";

import { HomeAiSummaryCard } from "@/components/home-ai-summary-card";
import type { DynamicInsight } from "@/lib/expenses/dashboard";
import { insightToneClass } from "@/lib/tone-styles";
import Link from "next/link";

type Props = {
  insights: DynamicInsight[];
  aiAvailable?: boolean;
  aiStatusPending?: boolean;
  demoMode?: boolean;
  narrative?: string | null;
  narrativeCacheLoading?: boolean;
  narrativeGenerating?: boolean;
  narrativeError?: string | null;
  onGenerateNarrative?: () => void;
};

export function HomeInsightsSection({
  insights,
  aiAvailable = false,
  aiStatusPending = false,
  demoMode = false,
  narrative,
  narrativeCacheLoading = false,
  narrativeGenerating = false,
  narrativeError = null,
  onGenerateNarrative,
}: Props) {
  const showAiBlock = Boolean(onGenerateNarrative);

  if (insights.length === 0 && !showAiBlock) return null;

  return (
    <section className="space-y-3" aria-label="Insights">
      {showAiBlock && onGenerateNarrative ? (
        <HomeAiSummaryCard
          aiAvailable={aiAvailable}
          aiStatusPending={aiStatusPending}
          demoMode={demoMode}
          narrative={narrative ?? null}
          cacheLoading={narrativeCacheLoading}
          generating={narrativeGenerating}
          error={narrativeError}
          onGenerate={onGenerateNarrative}
        />
      ) : null}

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
