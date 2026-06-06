"use client";

import { filtersToSearchParams } from "@/lib/expenses/filters";
import type { DashboardSummary } from "@/lib/expenses/dashboard";
import { HomeInsightsSection } from "@/components/home-insights-section";
import { AddExpenseButton } from "@/components/add-expense-drawer";
import { ExpenseDetailDrawer } from "@/components/expense-detail-drawer";
import { ExpenseListItemRow } from "@/components/expense-list-item";
import { HomePeopleFeed } from "@/components/home-people-feed";
import { HomeDashboardSkeleton } from "@/components/home-dashboard-skeleton";
import { DataList } from "@/components/ui/data-list";
import { EmptyState } from "@/components/ui/empty-state";
import { SegmentTabs } from "@/components/ui/segment-tabs";
import { ui } from "@/lib/ui-classes";
import {
  useDashboard,
  useExpenseDetail,
  useAiStatus,
  useGenerateAiNarrative,
} from "@/lib/query/hooks";
import { FetchJsonError } from "@/lib/query/fetch-json";
import { balanceClasses, balanceNetLabel } from "@/lib/balance-style";
import { formatMoney } from "@/lib/format";
import { useSearchParams } from "next/navigation";
import { useEffect, useId, useMemo, useState } from "react";

type FeedTab = "activity" | "groups" | "people";

const FEED_TABS: { id: FeedTab; label: string }[] = [
  { id: "activity", label: "Activity" },
  { id: "groups", label: "Groups" },
  { id: "people", label: "People" },
];

function parseFeedTab(value: string | null): FeedTab | null {
  if (value === "activity" || value === "groups" || value === "people") {
    return value;
  }
  return null;
}

function timeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function HomeHero({
  userName,
  data,
  currency,
}: {
  userName: string;
  data: DashboardSummary;
  currency: string;
}) {
  const firstName = userName.split(" ")[0] ?? userName;
  const thisTotal = Number(data.thisMonth.total);
  const balances = data.balances;
  const settled =
    !balances ||
    (balances.net === 0 &&
      balances.topOwedToYou.length === 0 &&
      balances.topYouOwe.length === 0);
  const netTone = settled
    ? null
    : balances!.net < 0
      ? "you_owe"
      : "you_are_owed";

  return (
    <header className="space-y-1">
      <p className="text-muted text-sm">
        {timeGreeting()}, {firstName}
      </p>
      <p className="text-foreground text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
        {formatMoney(thisTotal, currency)}
        <span className="text-muted ml-2 text-base font-normal">
          this month
        </span>
      </p>
      {balances && !settled && netTone ? (
        <p className={`text-sm font-medium ${balanceClasses(netTone).label}`}>
          {formatMoney(Math.abs(balances.net), currency)}{" "}
          {balanceNetLabel(netTone).toLowerCase()}
        </p>
      ) : balances && settled ? (
        <p className="text-muted text-sm">All settled with friends</p>
      ) : null}
    </header>
  );
}

export function HomeDashboard({ userName }: { userName: string }) {
  const searchParams = useSearchParams();
  const {
    data,
    isLoading: loading,
    isError,
    error: queryError,
  } = useDashboard();
  const { data: aiAvailable = false } = useAiStatus();
  const generateNarrative = useGenerateAiNarrative();
  const [feedTab, setFeedTab] = useState<FeedTab>("activity");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const feedPanelId = useId();
  const { data: detail, isLoading: detailLoading } =
    useExpenseDetail(selectedId);

  useEffect(() => {
    const tab = parseFeedTab(searchParams.get("tab"));
    if (tab) setFeedTab(tab);
  }, [searchParams]);

  const error =
    isError && queryError instanceof FetchJsonError
      ? queryError.message
      : isError
        ? "Failed to load dashboard"
        : null;

  const exploreHref = useMemo(() => {
    if (!data) return "/explore";
    const params = filtersToSearchParams({
      dateFrom: data.thisMonth.dateFrom,
      dateTo: data.thisMonth.dateTo,
      payment: false,
      currency: data.currency,
    });
    return `/explore?${params}`;
  }, [data]);

  const currency = data?.currency ?? "USD";

  const seeAllHref = feedTab === "activity" ? exploreHref : undefined;

  function handleFeedTabChange(tab: FeedTab) {
    setFeedTab(tab);
    const url = new URL(window.location.href);
    if (tab === "activity") url.searchParams.delete("tab");
    else url.searchParams.set("tab", tab);
    window.history.replaceState(null, "", url);
  }

  return (
    <div className="space-y-4">
      {loading && <HomeDashboardSkeleton />}

      {error && !loading && (
        <p className={ui.errorBoxLg}>
          {error === "database_not_configured"
            ? "Database not configured. Set DATABASE_URL and run migrations in Settings."
            : error}
        </p>
      )}

      {!loading && data && (
        <div className="space-y-6">
          <HomeHero userName={userName} data={data} currency={currency} />

          {(data.insights.length > 0 || aiAvailable) && (
            <HomeInsightsSection
              insights={data.insights}
              aiAvailable={aiAvailable}
              narrative={generateNarrative.data?.narrative ?? null}
              narrativeLoading={generateNarrative.isPending}
              narrativeError={
                generateNarrative.isError
                  ? generateNarrative.error instanceof FetchJsonError
                    ? generateNarrative.error.message
                    : "Could not generate summary"
                  : null
              }
              onGenerateNarrative={() => void generateNarrative.mutate()}
            />
          )}

          <section>
            <SegmentTabs
              tabs={FEED_TABS}
              activeId={feedTab}
              onChange={handleFeedTabChange}
              ariaLabel="Home feed"
              panelId={feedPanelId}
              seeAllHref={seeAllHref}
              idPrefix="home-feed-"
            />

            <div
              id={feedPanelId}
              role="tabpanel"
              aria-labelledby={`home-feed-tab-${feedTab}`}
              className="pt-3"
            >
              {feedTab === "people" ? (
                <HomePeopleFeed scope="people" idPrefix="home-people-" />
              ) : feedTab === "groups" ? (
                <HomePeopleFeed scope="groups" idPrefix="home-groups-" />
              ) : data.recentExpenses.length > 0 ? (
                <DataList variant="flush">
                  {data.recentExpenses.map((expense) => (
                    <li key={expense.id}>
                      <ExpenseListItemRow
                        expense={expense}
                        compact
                        onSelect={() => setSelectedId(expense.id)}
                      />
                    </li>
                  ))}
                </DataList>
              ) : (
                <EmptyState
                  action={
                    <AddExpenseButton className="text-accent text-sm font-medium hover:underline">
                      Add expense
                    </AddExpenseButton>
                  }
                >
                  No expenses this month.
                </EmptyState>
              )}
            </div>
          </section>
        </div>
      )}

      <ExpenseDetailDrawer
        expense={detail ?? null}
        loading={detailLoading}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}
