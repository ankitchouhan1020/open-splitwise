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

type InsightsData = {
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
    categories: Array<{
      categoryId: number | null;
      categoryName: string;
      current: string;
      previous: string;
      delta: number;
      deltaPct: number | null;
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
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [groupId, setGroupId] = useState("");
  const [currency, setCurrency] = useState("");
  const [groups, setGroups] = useState<Array<{ id: number; name: string }>>([]);
  const [currencies, setCurrencies] = useState<string[]>([]);
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);

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
  const delta = current - previous;
  const deltaPct =
    previous === 0 ? null : ((current - previous) / previous) * 100;

  return (
    <div className="space-y-8">
      <div className="border-border bg-card grid gap-3 rounded-xl border p-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted font-medium">From</span>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="border-border rounded-md border px-2 py-1.5 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted font-medium">To</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
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

      {loading && <p className="text-muted text-sm">Loading insights…</p>}

      {!loading && data && (
        <>
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
                    <Tooltip />
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
                      <Tooltip />
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
                Current range vs previous period of equal length.
              </p>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">Current</dt>
                  <dd className="font-medium">{current.toFixed(2)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Previous</dt>
                  <dd>{previous.toFixed(2)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Change</dt>
                  <dd>
                    {delta >= 0 ? "+" : ""}
                    {delta.toFixed(2)}
                    {deltaPct != null && ` (${deltaPct.toFixed(1)}%)`}
                  </dd>
                </div>
              </dl>
              <table className="mt-4 w-full text-left text-xs">
                <thead>
                  <tr className="text-muted border-b">
                    <th className="py-1">Category</th>
                    <th className="py-1">Δ</th>
                    <th className="py-1">%</th>
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
                      <td className="py-1">
                        {c.delta >= 0 ? "+" : ""}
                        {c.delta.toFixed(2)}
                      </td>
                      <td className="py-1">
                        {c.deltaPct == null ? "—" : `${c.deltaPct.toFixed(0)}%`}
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
                    <td>{Number(g.myShareTotal).toFixed(2)}</td>
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
                    <td>{Number(f.myShareTotal).toFixed(2)}</td>
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
                  <Tooltip />
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
