"use client";

import { filtersToSearchParams } from "@/lib/expenses/filters";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
const COLORS = [
  "#0d9488",
  "#0891b2",
  "#6366f1",
  "#a855f7",
  "#ec4899",
  "#f97316",
];

type DatePreset = "thisMonth" | "last30" | "thisYear" | "lastYear";

const PRESET_LABELS: Record<DatePreset, string> = {
  thisMonth: "This month",
  last30: "Last 30 days",
  thisYear: "This year",
  lastYear: "Last year",
};

function toDateInput(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function defaultDateRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setMonth(from.getMonth() - 12);
  return { from: toDateInput(from), to: toDateInput(to) };
}

function presetRange(preset: DatePreset): { from: string; to: string } {
  const now = new Date();
  switch (preset) {
    case "thisMonth": {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: toDateInput(from), to: toDateInput(now) };
    }
    case "last30": {
      const from = new Date(now);
      from.setDate(from.getDate() - 30);
      return { from: toDateInput(from), to: toDateInput(now) };
    }
    case "thisYear": {
      const from = new Date(now.getFullYear(), 0, 1);
      return { from: toDateInput(from), to: toDateInput(now) };
    }
    case "lastYear": {
      const from = new Date(now.getFullYear() - 1, 0, 1);
      const to = new Date(now.getFullYear() - 1, 11, 31);
      return { from: toDateInput(from), to: toDateInput(to) };
    }
  }
}

function formatMoney(amount: number, currency?: string): string {
  if (currency) {
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
      }).format(amount);
    } catch {
      /* invalid currency code */
    }
  }
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

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
          <li key={String(entry.dataKey)} className="flex gap-2">
            <span style={{ color: entry.color }}>{entry.name}:</span>
            <span className="font-medium">
              {formatMoney(Number(entry.value ?? 0), currency ?? entry.name)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

type InsightsData = {
  summary: {
    totalSpend: string;
    expenseCount: number;
    currency: string | null;
    topCategory: {
      categoryId: number | null;
      categoryName: string;
      total: string;
    } | null;
  };
  monthly: Array<{
    month: string;
    currency: string;
    total: string;
    count: number;
  }>;
  categories: Array<{
    categoryId: number | null;
    categoryName: string;
    total: string;
    count: number;
  }>;
  trends: {
    currentTotal: string;
    previousTotal: string;
    yearAgoTotal: string;
    categories: Array<{
      categoryId: number | null;
      categoryName: string;
      current: string;
      previous: string;
      yearAgo: string;
      delta: number;
      deltaPct: number | null;
      yoyDelta: number;
      yoyDeltaPct: number | null;
    }>;
  };
  groups: Array<{
    groupId: number;
    groupName: string;
    expenseCount: number;
    myShareTotal: string;
    percentOfTotal: number;
  }>;
  friends: Array<{
    friendId: number;
    friendName: string;
    myShareTotal: string;
    expenseCount: number;
  }>;
};

export function InsightsDashboard() {
  const defaults = useMemo(() => defaultDateRange(), []);
  const [from, setFrom] = useState(defaults.from);
  const [to, setTo] = useState(defaults.to);
  const [activePreset, setActivePreset] = useState<DatePreset | null>(null);
  const [groupId, setGroupId] = useState("");
  const [currency, setCurrency] = useState("");
  const [groups, setGroups] = useState<Array<{ id: number; name: string }>>([]);
  const [currencies, setCurrencies] = useState<string[]>([]);
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);

  const displayCurrency = currency || undefined;

  useEffect(() => {
    fetch("/api/filters/options")
      .then((r) => r.json())
      .then(
        (o: {
          groups: Array<{ id: number; name: string }>;
          currencies: string[];
        }) => {
          setGroups(o.groups.filter((g) => g.id > 0));
          setCurrencies(o.currencies);
        },
      )
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set("from", new Date(from).toISOString());
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      params.set("to", end.toISOString());
    }
    if (groupId) params.set("group", groupId);
    if (currency) params.set("currency", currency);
    try {
      const res = await fetch(`/api/insights?${params}`);
      setData((await res.json()) as InsightsData);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [from, to, groupId, currency]);

  useEffect(() => {
    void load();
  }, [load]);

  function applyPreset(preset: DatePreset) {
    const range = presetRange(preset);
    setFrom(range.from);
    setTo(range.to);
    setActivePreset(preset);
  }

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

  const categoryChart = useMemo(
    () =>
      (data?.categories ?? []).map((c) => ({
        name: c.categoryName,
        value: Number(c.total),
        categoryId: c.categoryId,
      })),
    [data?.categories],
  );

  const kpis = useMemo(() => {
    const summary = data?.summary;
    if (!summary) return null;
    const total = Number(summary.totalSpend);
    const count = summary.expenseCount;
    const avg = count === 0 ? 0 : total / count;
    return {
      total,
      count,
      avg,
      topCategory: summary.topCategory,
    };
  }, [data?.summary]);

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
    if (patch.groupId !== undefined) {
      params.set("group", String(patch.groupId));
    }
    return `/explore?${params}`;
  }

  const current = Number(data?.trends.currentTotal ?? 0);
  const previous = Number(data?.trends.previousTotal ?? 0);
  const yearAgo = Number(data?.trends.yearAgoTotal ?? 0);
  const delta = current - previous;
  const deltaPct =
    previous === 0 ? null : ((current - previous) / previous) * 100;
  const yoyDelta = current - yearAgo;
  const yoyDeltaPct =
    yearAgo === 0 ? null : ((current - yearAgo) / yearAgo) * 100;

  const fmt = (n: number) => formatMoney(n, displayCurrency);

  return (
    <div className="space-y-8">
      <div className="border-border bg-card space-y-3 rounded-xl border p-4">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(PRESET_LABELS) as DatePreset[]).map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => applyPreset(preset)}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                activePreset === preset
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border hover:bg-muted/30"
              }`}
            >
              {PRESET_LABELS[preset]}
            </button>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-muted font-medium">From</span>
            <input
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setActivePreset(null);
              }}
              className="border-border rounded-md border px-2 py-1.5 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-muted font-medium">To</span>
            <input
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setActivePreset(null);
              }}
              className="border-border rounded-md border px-2 py-1.5 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-muted font-medium">Group</span>
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="border-border rounded-md border px-2 py-1.5 text-sm"
            >
              <option value="">All groups</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-muted font-medium">Currency</span>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="border-border rounded-md border px-2 py-1.5 text-sm"
            >
              <option value="">All (per series)</option>
              {currencies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {loading && <p className="text-muted text-sm">Loading insights…</p>}

      {!loading && data && kpis && (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="border-border bg-card rounded-xl border p-4">
              <p className="text-muted text-xs font-medium uppercase">
                Total spend
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {fmt(kpis.total)}
              </p>
            </div>
            <div className="border-border bg-card rounded-xl border p-4">
              <p className="text-muted text-xs font-medium uppercase">
                Expenses
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {kpis.count.toLocaleString()}
              </p>
            </div>
            <div className="border-border bg-card rounded-xl border p-4">
              <p className="text-muted text-xs font-medium uppercase">
                Avg per expense
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {fmt(kpis.avg)}
              </p>
            </div>
            <div className="border-border bg-card rounded-xl border p-4">
              <p className="text-muted text-xs font-medium uppercase">
                Top category
              </p>
              {kpis.topCategory ? (
                <>
                  <p className="mt-1 truncate text-lg font-semibold">
                    <Link
                      href={exploreLink({
                        categoryId: kpis.topCategory.categoryId ?? undefined,
                      })}
                      className="text-accent underline"
                    >
                      {kpis.topCategory.categoryName}
                    </Link>
                  </p>
                  <p className="text-muted mt-0.5 text-sm tabular-nums">
                    {fmt(Number(kpis.topCategory.total))}
                  </p>
                </>
              ) : (
                <p className="text-muted mt-1 text-sm">—</p>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold">Spend over time</h2>
            <p className="text-muted text-sm">
              Monthly totals using your owed share (settlements excluded).
            </p>
            <div className="mt-4 h-72">
              {monthlyChart.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      content={<ChartTooltip currency={displayCurrency} />}
                    />
                    <Legend />
                    {(currency
                      ? [currency]
                      : [...new Set(data.monthly.map((m) => m.currency))]
                    ).map((cur, i) => (
                      <Line
                        key={cur}
                        type="monotone"
                        dataKey={cur}
                        stroke={COLORS[i % COLORS.length]}
                        name={cur}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted text-sm">No data for this range.</p>
              )}
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div>
              <h2 className="text-lg font-semibold">Top categories</h2>
              <div className="mt-4 h-64">
                {categoryChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryChart}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={(props) => String(props.name ?? "")}
                      >
                        {categoryChart.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={<ChartTooltip currency={displayCurrency} />}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted text-sm">No categories.</p>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold">Period comparison</h2>
              <p className="text-muted mt-1 text-sm">
                Current range vs previous period of equal length vs same period
                last year.
              </p>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">Current</dt>
                  <dd className="font-medium tabular-nums">{fmt(current)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Previous</dt>
                  <dd className="tabular-nums">{fmt(previous)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Same period last year</dt>
                  <dd className="tabular-nums">{fmt(yearAgo)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">vs previous</dt>
                  <dd className="tabular-nums">
                    {delta >= 0 ? "+" : ""}
                    {fmt(delta)}
                    {deltaPct != null && ` (${deltaPct.toFixed(1)}%)`}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">vs last year</dt>
                  <dd className="tabular-nums">
                    {yoyDelta >= 0 ? "+" : ""}
                    {fmt(yoyDelta)}
                    {yoyDeltaPct != null && ` (${yoyDeltaPct.toFixed(1)}%)`}
                  </dd>
                </div>
              </dl>
              <table className="mt-4 w-full text-left text-xs">
                <thead>
                  <tr className="text-muted border-b">
                    <th className="py-1">Category</th>
                    <th className="py-1">Δ prev</th>
                    <th className="py-1">%</th>
                    <th className="py-1">Δ YoY</th>
                    <th className="py-1">YoY %</th>
                  </tr>
                </thead>
                <tbody>
                  {data.trends.categories.slice(0, 10).map((c) => (
                    <tr
                      key={c.categoryName}
                      className="border-b border-stone-100"
                    >
                      <td className="py-1">
                        <Link
                          href={exploreLink({
                            categoryId: c.categoryId ?? undefined,
                          })}
                          className="text-accent underline"
                        >
                          {c.categoryName}
                        </Link>
                      </td>
                      <td className="py-1 tabular-nums">
                        {c.delta >= 0 ? "+" : ""}
                        {fmt(c.delta)}
                      </td>
                      <td className="py-1">
                        {c.deltaPct == null ? "—" : `${c.deltaPct.toFixed(0)}%`}
                      </td>
                      <td className="py-1 tabular-nums">
                        {c.yoyDelta >= 0 ? "+" : ""}
                        {fmt(c.yoyDelta)}
                      </td>
                      <td className="py-1">
                        {c.yoyDeltaPct == null
                          ? "—"
                          : `${c.yoyDeltaPct.toFixed(0)}%`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold">By group</h2>
            <table className="mt-3 w-full text-left text-sm">
              <thead>
                <tr className="text-muted border-b text-xs uppercase">
                  <th className="py-2">Group</th>
                  <th className="py-2">Count</th>
                  <th className="py-2">My share</th>
                  <th className="py-2">%</th>
                </tr>
              </thead>
              <tbody>
                {data.groups.map((g) => (
                  <tr key={g.groupId} className="border-b border-stone-100">
                    <td className="py-2">
                      <Link
                        href={exploreLink({ groupId: g.groupId })}
                        className="text-accent underline"
                      >
                        {g.groupName}
                      </Link>
                    </td>
                    <td>{g.expenseCount}</td>
                    <td className="tabular-nums">
                      {fmt(Number(g.myShareTotal))}
                    </td>
                    <td>{g.percentOfTotal.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section>
            <h2 className="text-lg font-semibold">By friend</h2>
            <p className="text-muted text-sm">
              Non-group expenses with each friend.
            </p>
            <table className="mt-3 w-full text-left text-sm">
              <thead>
                <tr className="text-muted border-b text-xs uppercase">
                  <th className="py-2">Friend</th>
                  <th className="py-2">Count</th>
                  <th className="py-2">My share</th>
                </tr>
              </thead>
              <tbody>
                {data.friends.map((f) => (
                  <tr key={f.friendId} className="border-b border-stone-100">
                    <td className="py-2">
                      <Link
                        href={exploreLink({ friendId: f.friendId })}
                        className="text-accent underline"
                      >
                        {f.friendName}
                      </Link>
                    </td>
                    <td>{f.expenseCount}</td>
                    <td className="tabular-nums">
                      {fmt(Number(f.myShareTotal))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section>
            <h2 className="text-lg font-semibold">Category bars</h2>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChart.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    content={<ChartTooltip currency={displayCurrency} />}
                  />
                  <Bar dataKey="value" fill="#0d9488" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
