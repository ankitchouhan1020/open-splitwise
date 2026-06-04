"use client";

import { filtersToSearchParams } from "@/lib/expenses/filters";
import { buildDashboardQuickViews } from "@/lib/expenses/quick-views";
import type { DashboardSummary } from "@/lib/expenses/dashboard";
import { ExpenseDetailDrawer } from "@/components/expense-detail-drawer";
import { ExpenseListItemRow } from "@/components/expense-list-item";
import { HomeDashboardSkeleton } from "@/components/home-dashboard-skeleton";
import { FetchJsonError } from "@/lib/query/fetch-json";
import { useDashboard, useExpenseDetail } from "@/lib/query/hooks";
import { balanceClasses } from "@/lib/balance-style";
import { formatAmount, formatMoney, formatRelativeSync } from "@/lib/format";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function formatMonthLabel(month: string): string {
  const [y, m] = month.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleString(undefined, { month: "short" });
}

const INSIGHT_STYLES: Record<DashboardSummary["insights"][0]["tone"], string> =
  {
    neutral: "border-stone-200 bg-stone-50/80 text-stone-800",
    spend: "border-teal-200 bg-teal-50/80 text-teal-900",
    balance: "border-indigo-200 bg-indigo-50/80 text-indigo-900",
    alert: "border-amber-200 bg-amber-50/80 text-amber-900",
  };

function BalancePanel({
  balances,
  currency,
}: {
  balances: DashboardSummary["balances"];
  currency: string;
}) {
  if (!balances) {
    return (
      <div className="border-border bg-card flex h-full flex-col rounded-2xl border p-5 shadow-sm">
        <p className="text-muted text-xs font-medium tracking-wide uppercase">
          Balances
        </p>
        <p className="text-muted mt-2 text-sm leading-relaxed">
          Could not load live balances from Splitwise.
        </p>
      </div>
    );
  }

  const hasOwe = balances.topYouOwe.length > 0;
  const hasOwed = balances.topOwedToYou.length > 0;
  const settled = balances.net === 0 && !hasOwe && !hasOwed;
  const netTone = settled
    ? null
    : balances.net < 0
      ? "you_owe"
      : "you_are_owed";
  const both = hasOwe && hasOwed;

  return (
    <div className="border-border bg-card flex h-full flex-col rounded-2xl border p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-muted text-xs font-medium tracking-wide uppercase">
            With friends · {currency}
          </p>
          {settled ? (
            <p className="text-foreground mt-1 text-xl font-semibold tracking-tight">
              All settled up
            </p>
          ) : (
            <>
              <p
                className={`mt-1 text-2xl font-semibold tracking-tight tabular-nums ${
                  netTone ? balanceClasses(netTone).amount : ""
                }`}
              >
                {formatMoney(Math.abs(balances.net), currency)}
              </p>
              <p
                className={`text-xs font-medium ${
                  netTone ? balanceClasses(netTone).label : "text-muted"
                }`}
              >
                {netTone === "you_owe" ? "You owe" : "You're owed"} overall
              </p>
            </>
          )}
        </div>
        {!settled && both && (
          <dl className="text-muted shrink-0 space-y-0.5 text-right text-xs tabular-nums">
            <div>
              <dt className="inline text-teal-700">In </dt>
              <dd className="inline font-medium text-teal-800">
                {formatMoney(balances.youAreOwed, currency)}
              </dd>
            </div>
            <div>
              <dt className="inline text-amber-700">Out </dt>
              <dd className="inline font-medium text-amber-800">
                {formatMoney(balances.youOwe, currency)}
              </dd>
            </div>
          </dl>
        )}
      </div>

      {!settled && (hasOwe || hasOwed) && (
        <div
          className={`border-border mt-3 grid gap-x-5 gap-y-2 border-t pt-3 ${both ? "sm:grid-cols-2" : "grid-cols-1"}`}
        >
          {hasOwed && (
            <BalancePeople
              label={both ? "Owed to you" : undefined}
              currency={currency}
              people={balances.topOwedToYou}
              tone="you_are_owed"
            />
          )}
          {hasOwe && (
            <BalancePeople
              label={both ? "You owe" : undefined}
              currency={currency}
              people={balances.topYouOwe}
              tone="you_owe"
            />
          )}
        </div>
      )}
    </div>
  );
}

function BalancePeople({
  label,
  currency,
  people,
  tone,
}: {
  label?: string;
  currency: string;
  people: Array<{ name: string; amount: number }>;
  tone: "you_owe" | "you_are_owed";
}) {
  const styles = balanceClasses(tone);

  return (
    <div className="min-w-0">
      {label && (
        <p className={`mb-1 text-[11px] font-medium uppercase ${styles.label}`}>
          {label}
        </p>
      )}
      <ul className="space-y-0.5">
        {people.map((p) => (
          <li
            key={p.name}
            className="flex items-center justify-between gap-2 text-sm leading-snug"
          >
            <span className="text-foreground min-w-0 truncate">{p.name}</span>
            <span className={`shrink-0 tabular-nums ${styles.amount}`}>
              {formatMoney(p.amount, currency)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function timeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function HomeDashboard({ userName }: { userName: string }) {
  const {
    data,
    isLoading: loading,
    isError,
    error: queryError,
  } = useDashboard();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { data: detail, isLoading: detailLoading } =
    useExpenseDetail(selectedId);

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

  const quickViews = useMemo(
    () => (data ? buildDashboardQuickViews(data) : []),
    [data],
  );

  const sparkData = useMemo(
    () =>
      (data?.monthlySparkline ?? []).map((row) => ({
        month: row.month,
        label: formatMonthLabel(row.month),
        total: Number(row.total),
      })),
    [data?.monthlySparkline],
  );

  const currency = data?.currency ?? "USD";
  const thisTotal = Number(data?.thisMonth.total ?? 0);
  const lastTotal = Number(data?.lastMonth.total ?? 0);
  const firstName = userName.split(" ")[0] ?? userName;
  const monthLabel = new Date().toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <div>
          <p className="text-muted text-sm">{timeGreeting()}</p>
          <h1 className="text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">
            {firstName}
          </h1>
        </div>
        <div className="space-y-2">
          <p className="text-muted text-sm">{monthLabel}</p>
          {!loading && quickViews.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {quickViews.map((view) => (
                <Link
                  key={view.id}
                  href={view.href}
                  className="border-border hover:bg-stone-50/80 rounded-md border bg-white px-2.5 py-1 text-xs font-medium"
                >
                  {view.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </header>

      {loading && <HomeDashboardSkeleton />}

      {error && !loading && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
          {error === "database_not_configured"
            ? "Database not configured. Set DATABASE_URL and run migrations in Settings."
            : error}
        </p>
      )}

      {!loading && data && (
        <>
          <section className="grid gap-4 lg:grid-cols-2">
            <div className="h-full min-h-0">
              <BalancePanel balances={data.balances} currency={currency} />
            </div>
            <div className="border-border bg-card flex h-full min-h-0 flex-col rounded-2xl border p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-muted text-xs font-medium tracking-wide uppercase">
                    Your share · this month
                  </p>
                  <p className="text-foreground mt-2 text-3xl font-semibold tracking-tight tabular-nums">
                    {formatMoney(thisTotal, currency)}
                  </p>
                  <p className="text-muted mt-2 text-sm">
                    {data.thisMonth.expenseCount} expense
                    {data.thisMonth.expenseCount === 1 ? "" : "s"}
                    {lastTotal > 0 ? (
                      <> · last month {formatMoney(lastTotal, currency)}</>
                    ) : null}
                  </p>
                </div>
                {data.topCategories[0] && (
                  <div className="text-right">
                    <p className="text-muted text-xs font-medium tracking-wide uppercase">
                      Top category
                    </p>
                    <p className="text-foreground mt-2 text-sm font-semibold">
                      {data.topCategories[0].categoryName}
                    </p>
                    <p className="text-muted mt-0.5 text-xs tabular-nums">
                      {formatMoney(
                        Number(data.topCategories[0].total),
                        currency,
                      )}
                    </p>
                  </div>
                )}
              </div>
              {data.insights.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {data.insights.slice(0, 2).map((insight) =>
                    insight.href ? (
                      <Link
                        key={insight.id}
                        href={insight.href}
                        className={`rounded-lg border px-3 py-2 text-xs leading-snug ${INSIGHT_STYLES[insight.tone]} hover:opacity-90`}
                      >
                        <span className="font-medium">{insight.headline}</span>
                        <span className="opacity-80"> — {insight.detail}</span>
                      </Link>
                    ) : (
                      <div
                        key={insight.id}
                        className={`rounded-lg border px-3 py-2 text-xs leading-snug ${INSIGHT_STYLES[insight.tone]}`}
                      >
                        <span className="font-medium">{insight.headline}</span>
                        <span className="opacity-80"> — {insight.detail}</span>
                      </div>
                    ),
                  )}
                </div>
              )}
            </div>
          </section>

          <section className="border-border bg-card overflow-hidden rounded-2xl border shadow-sm">
            <div className="border-border flex items-center justify-between gap-3 border-b px-5 py-4">
              <div>
                <h2 className="text-foreground text-lg font-semibold tracking-tight">
                  Recent activity
                </h2>
                <p className="text-muted mt-0.5 text-sm">
                  Latest expenses this month
                </p>
              </div>
              <Link
                href={exploreHref}
                className="text-accent shrink-0 text-sm font-medium hover:underline"
              >
                View all →
              </Link>
            </div>
            {data.recentExpenses.length > 0 ? (
              <ul>
                {data.recentExpenses.map((expense) => (
                  <li key={expense.id}>
                    <ExpenseListItemRow
                      expense={expense}
                      compact
                      onSelect={() => setSelectedId(expense.id)}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-5 py-8 text-center">
                <p className="text-muted text-sm">
                  No expenses this month yet.
                </p>
                <p className="text-muted mt-1 text-xs">
                  Sync from Splitwise or use{" "}
                  <span className="text-foreground font-medium">
                    + Add expense
                  </span>{" "}
                  in the header.
                </p>
              </div>
            )}
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <div className="border-border bg-card rounded-2xl border p-5 shadow-sm lg:col-span-2">
              <h2 className="text-foreground text-lg font-semibold tracking-tight">
                Spending trend
              </h2>
              <p className="text-muted mt-1 text-sm">
                Your share, last 6 months
              </p>
              <div className="mt-4 h-40">
                {sparkData.some((d) => d.total > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sparkData}>
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis
                        tick={{ fontSize: 10 }}
                        width={52}
                        tickFormatter={(v) =>
                          formatAmount(Number(v), {
                            compact: true,
                            maximumFractionDigits: 1,
                            currency,
                          })
                        }
                      />
                      <Tooltip
                        formatter={(value) =>
                          formatMoney(Number(value ?? 0), currency)
                        }
                      />
                      <Bar
                        dataKey="total"
                        fill="#0d9488"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted text-sm">
                    Trends appear after synced expenses.
                  </p>
                )}
              </div>
            </div>

            <div className="border-border bg-card rounded-2xl border p-5 shadow-sm">
              <h2 className="text-foreground text-lg font-semibold tracking-tight">
                By group
              </h2>
              <p className="text-muted mt-1 text-sm">This month</p>
              {data.topGroups.length > 0 ? (
                <ul className="mt-4 space-y-3">
                  {data.topGroups.slice(0, 5).map((g) => (
                    <li key={g.groupId}>
                      <Link
                        href={`/explore?${filtersToSearchParams({
                          dateFrom: data.thisMonth.dateFrom,
                          dateTo: data.thisMonth.dateTo,
                          groupId: g.groupId > 0 ? g.groupId : undefined,
                          payment: false,
                          currency,
                        })}`}
                        className="group block"
                      >
                        <div className="flex items-center justify-between gap-2 text-sm">
                          <span className="text-foreground group-hover:text-accent truncate font-medium">
                            {g.groupName}
                          </span>
                          <span className="text-muted shrink-0 tabular-nums">
                            {formatMoney(Number(g.myShareTotal), currency)}
                          </span>
                        </div>
                        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-stone-100">
                          <div
                            className="bg-accent h-full rounded-full"
                            style={{
                              width: `${Math.min(100, g.percentOfTotal)}%`,
                            }}
                          />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted mt-4 text-sm">
                  No group activity yet.
                </p>
              )}
              <Link
                href="/insights"
                className="text-muted hover:text-foreground mt-4 inline-block text-xs font-medium"
              >
                Full breakdown in Insights →
              </Link>
            </div>
          </section>

          <footer className="border-border text-muted flex flex-wrap items-center justify-between gap-3 border-t pt-5 text-xs">
            <span>
              {formatRelativeSync(data.sync.lastSyncAt)} ·{" "}
              {data.sync.expenseCount.toLocaleString()} expenses indexed
              {data.sync.inProgress ? " · sync in progress" : ""}
            </span>
            <div className="flex flex-wrap gap-4">
              <Link
                href={exploreHref}
                className="hover:text-foreground font-medium"
              >
                Explore
              </Link>
              <Link
                href="/insights"
                className="hover:text-foreground font-medium"
              >
                Insights
              </Link>
              <Link
                href="/settings"
                className="hover:text-foreground font-medium"
              >
                Settings
              </Link>
            </div>
          </footer>
        </>
      )}

      <ExpenseDetailDrawer
        expense={detail ?? null}
        loading={detailLoading}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}
