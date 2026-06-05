"use client";

import { ExpenseDetailDrawer } from "@/components/expense-detail-drawer";
import { ExpenseListItemRow } from "@/components/expense-list-item";
import { formatMoney } from "@/lib/format";
import { useExpenseDetail, useGroupDetail } from "@/lib/query/hooks";
import { splitwiseGroupUrl } from "@/lib/splitwise/urls";
import Link from "next/link";
import { useState } from "react";

type Tab = "activity" | "members";

export function GroupDetailView({ groupId }: { groupId: number }) {
  const { data, isLoading, isError } = useGroupDetail(groupId);
  const [tab, setTab] = useState<Tab>("activity");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { data: detail, isLoading: detailLoading } =
    useExpenseDetail(selectedId);

  if (!Number.isFinite(groupId) || groupId <= 0) {
    return <p className="text-muted text-sm">Invalid group.</p>;
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="border-border bg-card h-24 animate-pulse rounded-xl border" />
        <div className="border-border bg-card h-40 animate-pulse rounded-xl border" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-3">
        <Link
          href="/groups"
          className="text-accent text-sm font-medium hover:underline"
        >
          ← Groups
        </Link>
        <p className="text-muted text-sm">Group not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link
            href="/groups"
            className="text-accent mb-1 inline-block text-sm font-medium hover:underline"
          >
            ← Groups
          </Link>
          <h1 className="text-foreground text-xl font-semibold tracking-tight md:text-2xl">
            {data.name}
          </h1>
          <p className="text-muted mt-1 text-sm tabular-nums">
            {data.expenseCount} expenses · your share{" "}
            {formatMoney(Number(data.myShareTotal), data.currency)}
          </p>
        </div>
        <a
          href={splitwiseGroupUrl(data.id)}
          target="_blank"
          rel="noopener noreferrer"
          className="border-border text-foreground hover:bg-hover shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium"
        >
          Open in Splitwise
        </a>
      </div>

      <div
        className="border-border bg-muted-surface flex gap-1 rounded-lg border p-1"
        role="tablist"
        aria-label="Group sections"
      >
        {(["activity", "members"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={
              tab === t
                ? "bg-accent text-accent-foreground flex-1 rounded-md px-3 py-2 text-xs font-semibold"
                : "text-muted hover:text-foreground flex-1 rounded-md px-3 py-2 text-xs font-medium"
            }
          >
            {t === "activity" ? "Activity" : "Members"}
          </button>
        ))}
      </div>

      {tab === "activity" && (
        <div className="border-border bg-card overflow-hidden rounded-xl border shadow-sm">
          {data.recentActivity.length === 0 ? (
            <p className="text-muted p-6 text-center text-sm">
              No expenses in this group.
            </p>
          ) : (
            <ul>
              {data.recentActivity.map((expense) => (
                <li
                  key={expense.id}
                  className="border-border border-b last:border-b-0"
                >
                  <ExpenseListItemRow
                    expense={expense}
                    onSelect={() => setSelectedId(expense.id)}
                  />
                </li>
              ))}
            </ul>
          )}
          {data.recentActivity.length > 0 && (
            <div className="border-border border-t p-2 text-center">
              <Link
                href={`/explore?group=${data.id}`}
                className="text-accent text-xs font-medium hover:underline"
              >
                View all in Explore →
              </Link>
            </div>
          )}
        </div>
      )}

      {tab === "members" && (
        <ul className="border-border divide-border bg-card divide-y overflow-hidden rounded-xl border shadow-sm">
          {data.members.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between gap-3 px-3 py-3"
            >
              <span className="text-foreground text-sm font-medium">
                {m.name}
              </span>
            </li>
          ))}
        </ul>
      )}

      <ExpenseDetailDrawer
        expense={detail ?? null}
        loading={detailLoading}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}
