"use client";

import {
  InsightsToolbar,
  defaultDateRange,
  presetRange,
  type DatePreset,
} from "@/app/insights/insights-toolbar";
import { InsightsDashboardSkeleton } from "@/components/insights-dashboard-skeleton";
import { useFilterOptions, useInsights } from "@/lib/query/hooks";
import {
  INSIGHTS_TABLE,
  INSIGHTS_TD,
  INSIGHTS_TD_NUM,
  INSIGHTS_TH,
} from "@/app/insights/insights-table-layout";
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
            <span className="font-mono font-medium tabular-nums">
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

function DeltaBadge({
  value,
  pct,
  label,
}: {
  value: number;
  pct: number | null;
  label: string;
}) {
  const up = value > 0;
  const down = value < 0;
  return (
    <span
      className={
        up ? "text-balance-pay" : down ? "text-balance-get" : "text-muted"
      }
    >
      {label} {up ? "+" : ""}
      {pct != null ? formatPercent(pct) : "—"}
    </span>
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
  const [currency, setCurrency] = useState("");

  const { data: filterOptions } = useFilterOptions();
  const groups = (filterOptions?.groups ?? []).filter((g) => g.id > 0);
  const currencies = filterOptions?.currencies ?? [];

  const insightsParams = useMemo(
    () => ({ from, to, groupId, currency }),
    [from, to, groupId, currency],
  );
  const { data, isLoading: loading } = useInsights(insightsParams);

  const displayCurrency =
    currency || data?.summary.currency || currencies[0] || undefined;

  const monthlyChart = useMemo(() => {
    if (!data?.monthly.length) return [];
    const byMonth = new Map<
      string,
      { month: string } & Record<string, number | string>
    >();
    for (const row of data.monthly) {
      if (currency && row.currency !== currency) continue;
      const entry = byMonth.get(row.month) ?? { month: row.month };
      entry[row.currency] = Number(row.total);
      byMonth.set(row.month, entry);
    }
    return [...byMonth.values()].sort((a, b) => a.month.localeCompare(b.month));
  }, [data?.monthly, currency]);

  const categoryMax = useMemo(() => {
    const cats = data?.categories ?? [];
    return Math.max(...cats.map((c) => Number(c.total)), 1);
  }, [data?.categories]);

  function exploreLink(patch: Record<string, string | number | undefined>) {
    const params = filtersToSearchParams({
      dateFrom: from ? new Date(from).toISOString() : undefined,
      dateTo: to ? new Date(to).toISOString() : undefined,
      groupId: groupId ? Number(groupId) : undefined,
      currency: currency || undefined,
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

  const fmt = (n: number) => fmtAmount(n, displayCurrency);

  return (
    <div className="flex flex-col gap-3">
      <InsightsToolbar
        from={from}
        to={to}
        groupId={groupId}
        currency={currency}
        activePreset={activePreset}
        groups={groups}
        currencies={currencies}
        onFromChange={setFrom}
        onToChange={setTo}
        onGroupChange={setGroupId}
        onCurrencyChange={setCurrency}
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
          {/* KPI strip */}
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <div className="border-border bg-card rounded-lg border px-3 py-2.5">
              <p className="text-muted text-[11px] font-semibold tracking-wider uppercase">
                Your spend
              </p>
              <p className="text-foreground mt-0.5 font-mono text-xl font-semibold tabular-nums">
                {fmt(Number(data.summary.totalSpend))}
              </p>
              <p className="text-muted mt-1 text-xs">
                {isAllTime ? (
                  "All time"
                ) : (
                  <>
                    <DeltaBadge value={delta} pct={deltaPct} label="vs prev" />
                    {" · "}
                    <DeltaBadge
                      value={yoyDelta}
                      pct={yoyDeltaPct}
                      label="YoY"
                    />
                  </>
                )}
              </p>
            </div>
            <div className="border-border bg-card rounded-lg border px-3 py-2.5">
              <p className="text-muted text-[11px] font-semibold tracking-wider uppercase">
                Expenses
              </p>
              <p className="text-foreground mt-0.5 font-mono text-xl font-semibold tabular-nums">
                {data.summary.expenseCount.toLocaleString()}
              </p>
              <p className="text-muted mt-1 text-xs">
                Avg{" "}
                {fmt(
                  data.summary.expenseCount
                    ? Number(data.summary.totalSpend) /
                        data.summary.expenseCount
                    : 0,
                )}
              </p>
            </div>
            <div className="border-border bg-card rounded-lg border px-3 py-2.5 sm:col-span-2">
              <p className="text-muted text-[11px] font-semibold tracking-wider uppercase">
                Top category
              </p>
              {data.summary.topCategory ? (
                <>
                  <p className="text-foreground mt-0.5 truncate text-[15px] font-semibold">
                    <Link
                      href={exploreLink({
                        categoryId:
                          data.summary.topCategory.categoryId ?? undefined,
                      })}
                      className="text-accent hover:underline"
                    >
                      {data.summary.topCategory.categoryName}
                    </Link>
                  </p>
                  <p className="text-muted mt-0.5 font-mono text-xs tabular-nums">
                    {fmt(Number(data.summary.topCategory.total))}
                  </p>
                </>
              ) : (
                <p className="text-muted mt-1 text-sm">—</p>
              )}
            </div>
          </div>

          {/* Chart + categories */}
          <div className="grid gap-3 lg:grid-cols-5">
            <div className="border-border bg-card rounded-lg border p-3 lg:col-span-3">
              <h2 className="text-foreground text-sm font-semibold">
                Monthly spend
              </h2>
              <p className="text-muted text-xs">
                Your share, settlements excluded
              </p>
              <div className="mt-2 h-48">
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
                      {(currency
                        ? [currency]
                        : [...new Set(data.monthly.map((m) => m.currency))]
                      ).map((cur, i) => (
                        <Line
                          key={cur}
                          type="monotone"
                          dataKey={cur}
                          stroke={lineColors[i % lineColors.length]}
                          strokeWidth={2}
                          dot={false}
                          name={cur}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted text-sm">No data for this range.</p>
                )}
              </div>
            </div>

            <div className="border-border bg-card rounded-lg border p-3 lg:col-span-2">
              <h2 className="text-foreground text-sm font-semibold">
                By category
              </h2>
              <ul className="mt-2 max-h-48 space-y-2 overflow-y-auto">
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
                        <span className="text-muted shrink-0 font-mono tabular-nums">
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

          {/* Category trends */}
          {!isAllTime && (
            <div className="border-border bg-card overflow-hidden rounded-lg border">
              <div className="border-border border-b px-3 py-2">
                <h2 className="text-foreground text-sm font-semibold">
                  Category trends
                </h2>
                <p className="text-muted text-xs">
                  Change vs previous period and vs same period last year
                </p>
              </div>
              <div className="overflow-x-auto">
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
          )}

          {/* Groups + friends */}
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="border-border bg-card overflow-hidden rounded-lg border">
              <div className="border-border border-b px-3 py-2">
                <h2 className="text-foreground text-sm font-semibold">
                  By group
                </h2>
              </div>
              <div className="overflow-x-auto">
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
              </div>
            </div>

            <div className="border-border bg-card overflow-hidden rounded-lg border">
              <div className="border-border border-b px-3 py-2">
                <h2 className="text-foreground text-sm font-semibold">
                  By friend
                </h2>
                <p className="text-muted text-xs">Non-group expenses</p>
              </div>
              <div className="overflow-x-auto">
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
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
