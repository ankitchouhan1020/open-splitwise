"use client";

import { InsightsFiltersCard } from "@/app/insights/insights-filters-card";
import { InsightsSummary } from "@/app/insights/insights-summary";
import {
  defaultDateRange,
  insightsPeriodLabel,
  presetRange,
  type DatePreset,
} from "@/app/insights/insights-toolbar";
import { InsightsDashboardSkeleton } from "@/components/insights-dashboard-skeleton";
import {
  INSIGHTS_CHART_HEIGHT,
  INSIGHTS_LIST_HEIGHT,
  INSIGHTS_TABLE,
  INSIGHTS_TABLE_BODY,
  INSIGHTS_TD,
  INSIGHTS_TD_NUM,
  INSIGHTS_TH,
} from "@/app/insights/insights-table-layout";
import { useFilterOptions, useInsights } from "@/lib/query/hooks";
import { filtersToSearchParams } from "@/lib/expenses/filters";
import { useTheme } from "@/components/theme-provider";
import { chartThemeFromDocument } from "@/lib/chart-theme";
import { formatAmount, formatMoney, formatPercent } from "@/lib/format";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const LINE_COLORS_LIGHT = ["#0d9488", "#0891b2", "#6366f1", "#a855f7"];
const LINE_COLORS_DARK = ["#2dd4bf", "#38bdf8", "#818cf8", "#c084fc"];

type ChartTooltipProps = {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number;
    color?: string;
    dataKey?: string | number;
  }>;
  label?: string | number;
  currency?: string;
};

function ChartTooltip({ active, payload, label, currency }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="border-border bg-card rounded-md border px-3 py-2 text-xs shadow-sm">
      {label != null && <p className="text-muted mb-1 font-medium">{label}</p>}
      <ul className="space-y-0.5">
        {payload.map((entry) => (
          <li
            key={String(entry.dataKey)}
            className="flex justify-between gap-4"
          >
            <span style={{ color: entry.color }}>{entry.name}</span>
            <span className="font-medium tabular-nums">
              {currency
                ? formatMoney(Number(entry.value ?? 0), currency)
                : formatAmount(Number(entry.value ?? 0), { currency })}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function fmtAmount(n: number, currency?: string) {
  if (currency) return formatMoney(n, currency);
  return formatAmount(n);
}

function InsightsCardHeader({
  title,
  detail,
}: {
  title: string;
  detail?: string;
}) {
  return (
    <div className="border-border border-b px-3 py-2.5 sm:px-4">
      <p className="text-sm font-semibold">{title}</p>
      {detail ? <p className="text-muted text-xs">{detail}</p> : null}
    </div>
  );
}

export function InsightsDashboard() {
  const { resolved: theme } = useTheme();
  const chart = chartThemeFromDocument();
  const lineColors = theme === "dark" ? LINE_COLORS_DARK : LINE_COLORS_LIGHT;
  const defaults = useMemo(() => defaultDateRange(), []);
  const [from, setFrom] = useState(defaults.from);
  const [to, setTo] = useState(defaults.to);
  const [activePreset, setActivePreset] = useState<DatePreset | null>("all");
  const [groupId, setGroupId] = useState("");

  const { data: filterOptions } = useFilterOptions();
  const groups = (filterOptions?.groups ?? []).filter((g) => g.id > 0);

  const insightsParams = useMemo(
    () => ({ from, to, groupId }),
    [from, to, groupId],
  );
  const { data, isLoading: loading } = useInsights(insightsParams);

  const displayCurrency = data?.summary.currency ?? undefined;

  const monthlyChart = useMemo(() => {
    if (!data?.monthly.length) return [];
    const byMonth = new Map<
      string,
      { month: string } & Record<string, number | string>
    >();
    for (const row of data.monthly) {
      const entry = byMonth.get(row.month) ?? { month: row.month };
      entry[row.currency] = Number(row.total);
      byMonth.set(row.month, entry);
    }
    return [...byMonth.values()].sort((a, b) => a.month.localeCompare(b.month));
  }, [data?.monthly]);

  const categoryMax = useMemo(() => {
    const cats = data?.categories ?? [];
    return Math.max(...cats.map((c) => Number(c.total)), 1);
  }, [data?.categories]);

  function exploreLink(patch: Record<string, string | number | undefined>) {
    const params = filtersToSearchParams({
      dateFrom: from ? new Date(from).toISOString() : undefined,
      dateTo: to ? new Date(to).toISOString() : undefined,
      groupId: groupId ? Number(groupId) : undefined,
      categoryId:
        patch.categoryId !== undefined ? Number(patch.categoryId) : undefined,
      friendId:
        patch.friendId !== undefined ? Number(patch.friendId) : undefined,
    });
    if (patch.groupId !== undefined) params.set("group", String(patch.groupId));
    return `/explore?${params}`;
  }

  const current = Number(data?.trends.currentTotal ?? 0);
  const previous = Number(data?.trends.previousTotal ?? 0);
  const yearAgo = Number(data?.trends.yearAgoTotal ?? 0);
  const delta = current - previous;
  const deltaPct = previous === 0 ? null : (delta / previous) * 100;
  const yoyDelta = current - yearAgo;
  const yoyDeltaPct = yearAgo === 0 ? null : (yoyDelta / yearAgo) * 100;

  const isAllTime = !from && !to;
  const periodLabel = insightsPeriodLabel(from, to, activePreset);
  const fmt = (n: number) => fmtAmount(n, displayCurrency);

  return (
    <div className="space-y-6">
      <InsightsFiltersCard
        from={from}
        to={to}
        groupId={groupId}
        activePreset={activePreset}
        groups={groups}
        onFromChange={setFrom}
        onToChange={setTo}
        onGroupChange={setGroupId}
        onPreset={(p) => {
          const range = presetRange(p);
          setFrom(range.from);
          setTo(range.to);
          setActivePreset(p);
        }}
        onClearPreset={() => setActivePreset(null)}
      />

      {loading && <InsightsDashboardSkeleton />}

      {!loading && data && (
        <>
          <InsightsSummary
            totalSpend={Number(data.summary.totalSpend)}
            expenseCount={data.summary.expenseCount}
            currency={displayCurrency}
            periodLabel={periodLabel}
            isAllTime={isAllTime}
            delta={delta}
            deltaPct={deltaPct}
            yoyDelta={yoyDelta}
            yoyDeltaPct={yoyDeltaPct}
            topCategory={data.summary.topCategory}
            exploreCategoryHref={
              data.summary.topCategory
                ? exploreLink({
                    categoryId:
                      data.summary.topCategory.categoryId ?? undefined,
                  })
                : undefined
            }
          />

          <div className="grid gap-4 lg:grid-cols-5">
            <div className="border-border bg-card overflow-hidden rounded-lg border lg:col-span-3">
              <InsightsCardHeader
                title="Monthly spend"
                detail="Your share · settlements excluded"
              />
              <div className={`${INSIGHTS_CHART_HEIGHT} p-3 sm:p-4`}>
                {monthlyChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyChart}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={chart.grid}
                      />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 10, fill: chart.axis }}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: chart.axis }}
                        width={52}
                        tickFormatter={(v) =>
                          formatAmount(Number(v), {
                            compact: true,
                            maximumFractionDigits: 1,
                            currency: displayCurrency,
                          })
                        }
                      />
                      <Tooltip
                        content={<ChartTooltip currency={displayCurrency} />}
                      />
                      {[...new Set(data.monthly.map((m) => m.currency))].map(
                        (cur, i) => (
                          <Line
                            key={cur}
                            type="monotone"
                            dataKey={cur}
                            stroke={lineColors[i % lineColors.length]}
                            strokeWidth={2}
                            dot={false}
                            name={cur}
                          />
                        ),
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted text-sm">No data for this range.</p>
                )}
              </div>
            </div>

            <div className="border-border bg-card overflow-hidden rounded-lg border lg:col-span-2">
              <InsightsCardHeader title="By category" />
              <ul
                className={`${INSIGHTS_LIST_HEIGHT} space-y-2 overflow-y-auto p-3 sm:p-4`}
              >
                {(data.categories ?? []).slice(0, 8).map((c) => {
                  const total = Number(c.total);
                  return (
                    <li key={c.categoryName}>
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <Link
                          href={exploreLink({
                            categoryId: c.categoryId ?? undefined,
                          })}
                          className="text-foreground hover:text-accent truncate font-medium"
                        >
                          {c.categoryName}
                        </Link>
                        <span className="text-muted shrink-0 tabular-nums">
                          {fmt(total)}
                        </span>
                      </div>
                      <div className="bg-muted-surface mt-1 h-1 overflow-hidden rounded-full">
                        <div
                          className="bg-accent h-full rounded-full"
                          style={{ width: `${(total / categoryMax) * 100}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {!isAllTime && data.trends.categories.length > 0 ? (
            <div className="border-border bg-card overflow-hidden rounded-lg border">
              <InsightsCardHeader
                title="Category trends"
                detail="Change vs previous period and vs same period last year"
              />
              <div className={INSIGHTS_TABLE_BODY}>
                <table className={INSIGHTS_TABLE}>
                  <thead>
                    <tr>
                      <th className={INSIGHTS_TH}>Category</th>
                      <th className={`${INSIGHTS_TH} text-right`}>Current</th>
                      <th className={`${INSIGHTS_TH} text-right`}>Δ prev</th>
                      <th className={`${INSIGHTS_TH} text-right`}>Δ YoY</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.trends.categories.slice(0, 12).map((c) => (
                      <tr key={c.categoryName} className="hover:bg-hover">
                        <td className={INSIGHTS_TD}>
                          <Link
                            href={exploreLink({
                              categoryId: c.categoryId ?? undefined,
                            })}
                            className="text-accent font-medium hover:underline"
                          >
                            {c.categoryName}
                          </Link>
                        </td>
                        <td className={INSIGHTS_TD_NUM}>
                          {fmt(Number(c.current))}
                        </td>
                        <td className={INSIGHTS_TD_NUM}>
                          <span
                            className={
                              c.delta > 0
                                ? "text-balance-pay"
                                : c.delta < 0
                                  ? "text-balance-get"
                                  : ""
                            }
                          >
                            {c.delta >= 0 ? "+" : ""}
                            {fmt(c.delta)}
                            {c.deltaPct != null && (
                              <span className="text-muted ml-1 text-[11px]">
                                ({formatPercent(c.deltaPct)})
                              </span>
                            )}
                          </span>
                        </td>
                        <td className={INSIGHTS_TD_NUM}>
                          <span
                            className={
                              c.yoyDelta > 0
                                ? "text-balance-pay"
                                : c.yoyDelta < 0
                                  ? "text-balance-get"
                                  : ""
                            }
                          >
                            {c.yoyDelta >= 0 ? "+" : ""}
                            {fmt(c.yoyDelta)}
                            {c.yoyDeltaPct != null && (
                              <span className="text-muted ml-1 text-[11px]">
                                ({formatPercent(c.yoyDeltaPct)})
                              </span>
                            )}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="border-border bg-card overflow-hidden rounded-lg border">
              <InsightsCardHeader title="By group" />
              <div className={INSIGHTS_TABLE_BODY}>
                {data.groups.length > 0 ? (
                  <table className={INSIGHTS_TABLE}>
                    <thead>
                      <tr>
                        <th className={INSIGHTS_TH}>Group</th>
                        <th className={`${INSIGHTS_TH} text-right`}>Count</th>
                        <th className={`${INSIGHTS_TH} text-right`}>Share</th>
                        <th className={`${INSIGHTS_TH} text-right`}>%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.groups.map((g) => (
                        <tr key={g.groupId} className="hover:bg-hover">
                          <td className={INSIGHTS_TD}>
                            <Link
                              href={exploreLink({ groupId: g.groupId })}
                              className="text-accent font-medium hover:underline"
                            >
                              {g.groupName}
                            </Link>
                          </td>
                          <td className={INSIGHTS_TD_NUM}>{g.expenseCount}</td>
                          <td className={INSIGHTS_TD_NUM}>
                            {fmt(Number(g.myShareTotal))}
                          </td>
                          <td className={INSIGHTS_TD_NUM}>
                            {g.percentOfTotal.toFixed(0)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-muted px-3 py-4 text-sm">
                    No group expenses in range.
                  </p>
                )}
              </div>
            </div>

            <div className="border-border bg-card overflow-hidden rounded-lg border">
              <InsightsCardHeader
                title="By friend"
                detail="Non-group expenses"
              />
              <div className={INSIGHTS_TABLE_BODY}>
                {data.friends.length > 0 ? (
                  <table className={INSIGHTS_TABLE}>
                    <thead>
                      <tr>
                        <th className={INSIGHTS_TH}>Friend</th>
                        <th className={`${INSIGHTS_TH} text-right`}>Count</th>
                        <th className={`${INSIGHTS_TH} text-right`}>Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.friends.map((f) => (
                        <tr key={f.friendId} className="hover:bg-hover">
                          <td className={INSIGHTS_TD}>
                            <Link
                              href={exploreLink({ friendId: f.friendId })}
                              className="text-accent font-medium hover:underline"
                            >
                              {f.friendName}
                            </Link>
                          </td>
                          <td className={INSIGHTS_TD_NUM}>{f.expenseCount}</td>
                          <td className={INSIGHTS_TD_NUM}>
                            {fmt(Number(f.myShareTotal))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-muted px-3 py-4 text-sm">
                    No non-group expenses in range.
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
