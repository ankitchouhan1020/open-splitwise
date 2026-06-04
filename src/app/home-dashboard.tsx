"use client";

import { filtersToSearchParams } from "@/lib/expenses/filters";
import type { DashboardSummary } from "@/lib/expenses/dashboard";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

function formatMonthLabel(month: string): string {
  const [y, m] = month.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleString(undefined, { month: "short" });
}

export function HomeDashboard({ userName }: { userName: string }) {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/dashboard");
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? "Failed to load dashboard");
      setData(null);
      return;
    }
    setError(null);
    setData((await res.json()) as DashboardSummary);
  }, []);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        await refresh();
      } catch {
        setError("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, [refresh]);

  async function runSync() {
    if (syncing || data?.sync.inProgress) return;
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: "all" }),
      });
      const body = (await res.json()) as {
        error?: string;
        expenses?: { synced: number; total: number };
      };
      if (!res.ok) {
        setSyncMessage(body.error ?? "Sync failed");
      } else if (body.expenses) {
        setSyncMessage(
          `Synced ${body.expenses.synced} expenses (${body.expenses.total} in database).`,
        );
      } else {
        setSyncMessage("Sync complete.");
      }
      await refresh();
    } catch {
      setSyncMessage("Sync request failed");
    } finally {
      setSyncing(false);
    }
  }

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

  const sparkData = useMemo(
    () =>
      (data?.monthlySparkline ?? []).map((row) => ({
        month: row.month,
        label: formatMonthLabel(row.month),
        total: Number(row.total),
      })),
    [data?.monthlySparkline],
  );

  const thisTotal = Number(data?.thisMonth.total ?? 0);
  const delta = data?.delta ?? 0;
  const deltaPct = data?.deltaPct;
  const currency = data?.currency ?? "USD";

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <p className="text-muted text-sm">Welcome back</p>
        <h1 className="text-foreground text-3xl font-semibold tracking-tight">
          {userName}
        </h1>
        <p className="text-muted text-sm">
          Your spending snapshot (my share, {currency}, settlements excluded).
        </p>
      </div>

      {loading && <p className="text-muted text-sm">Loading dashboard…</p>}

      {error && !loading && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {error === "database_not_configured"
            ? "Database not configured. Set DATABASE_URL and run migrations."
            : error}
        </p>
      )}

      {!loading && data && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="border-border bg-card rounded-xl border p-5 sm:col-span-2">
              <p className="text-muted text-xs font-medium tracking-wide uppercase">
                This month
              </p>
              <p className="text-foreground mt-1 text-3xl font-semibold tabular-nums">
                {formatMoney(thisTotal, currency)}
              </p>
              <p className="text-muted mt-2 text-sm">
                vs last month:{" "}
                <span
                  className={
                    delta > 0
                      ? "text-red-700"
                      : delta < 0
                        ? "text-teal-700"
                        : "text-foreground"
                  }
                >
                  {delta >= 0 ? "+" : ""}
                  {formatMoney(delta, currency)}
                  {deltaPct != null &&
                    ` (${deltaPct >= 0 ? "+" : ""}${deltaPct.toFixed(1)}%)`}
                </span>
              </p>
            </div>

            <div className="border-border bg-card rounded-xl border p-5">
              <p className="text-muted text-xs font-medium tracking-wide uppercase">
                Expenses
              </p>
              <p className="text-foreground mt-1 text-3xl font-semibold tabular-nums">
                {data.thisMonth.expenseCount}
              </p>
              <p className="text-muted mt-2 text-sm">This month</p>
            </div>

            <div className="border-border bg-card rounded-xl border p-5">
              <p className="text-muted text-xs font-medium tracking-wide uppercase">
                Last sync
              </p>
              <p className="text-foreground mt-1 text-lg font-semibold">
                {data.sync.lastSyncAt
                  ? new Date(data.sync.lastSyncAt).toLocaleString()
                  : "Never"}
              </p>
              <p className="text-muted mt-2 text-sm">
                {data.sync.inProgress
                  ? "Syncing…"
                  : `${data.sync.expenseCount.toLocaleString()} expenses stored`}
              </p>
            </div>
          </section>

          <section className="border-border bg-card rounded-xl border p-5">
            <h2 className="text-lg font-semibold">Last 6 months</h2>
            <p className="text-muted text-sm">Monthly my-share totals</p>
            <div className="mt-4 h-40">
              {sparkData.some((d) => d.total > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sparkData}>
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} width={48} />
                    <Tooltip
                      formatter={(value) =>
                        formatMoney(Number(value ?? 0), currency) as string
                      }
                      labelFormatter={(_, payload) => {
                        const row = payload?.[0]?.payload as
                          | { month: string }
                          | undefined;
                        return row?.month ?? "";
                      }}
                    />
                    <Bar dataKey="total" fill="#0d9488" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted text-sm">No spend data yet.</p>
              )}
            </div>
          </section>

          <section className="border-border bg-card rounded-xl border p-5">
            <h2 className="text-lg font-semibold">Top categories</h2>
            <p className="text-muted text-sm">This month</p>
            {data.topCategories.length > 0 ? (
              <ul className="mt-4 space-y-3">
                {data.topCategories.map((c, i) => (
                  <li
                    key={`${c.categoryId ?? "none"}-${i}`}
                    className="flex items-center justify-between gap-4 text-sm"
                  >
                    <span className="text-foreground font-medium">
                      {c.categoryName}
                    </span>
                    <span className="text-muted tabular-nums">
                      {formatMoney(Number(c.total), currency)}
                      <span className="ml-2 text-xs">({c.count})</span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted mt-4 text-sm">No categories yet.</p>
            )}
          </section>

          <section className="flex flex-wrap gap-3">
            <Link
              href={exploreHref}
              className="bg-accent rounded-lg px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Explore this month
            </Link>
            <Link
              href="/insights"
              className="border-border bg-card text-foreground rounded-lg border px-4 py-2 text-sm font-medium hover:bg-stone-50"
            >
              Insights
            </Link>
            <button
              type="button"
              onClick={() => void runSync()}
              disabled={syncing || data.sync.inProgress}
              className="border-border bg-card text-foreground rounded-lg border px-4 py-2 text-sm font-medium hover:bg-stone-50 disabled:opacity-50"
            >
              {syncing || data.sync.inProgress ? "Syncing…" : "Sync now"}
            </button>
            <Link
              href="/settings"
              className="border-border bg-card text-foreground rounded-lg border px-4 py-2 text-sm font-medium hover:bg-stone-50"
            >
              Settings
            </Link>
          </section>

          {data.sync.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
              Sync error: {data.sync.error}
            </p>
          )}

          {syncMessage && (
            <p className="rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-900">
              {syncMessage}
            </p>
          )}
        </>
      )}
    </div>
  );
}
