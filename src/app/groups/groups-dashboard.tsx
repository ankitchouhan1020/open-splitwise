"use client";

import type { GroupListItem } from "@/lib/groups/list";
import { formatMoney } from "@/lib/format";
import { useGroupsList } from "@/lib/query/hooks";
import Link from "next/link";

function GroupRow({
  group,
  currency,
}: {
  group: GroupListItem;
  currency: string;
}) {
  const last = group.lastActivityAt
    ? new Date(group.lastActivityAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <Link
      href={`/groups/${group.id}`}
      className="border-border bg-card hover:border-accent/40 flex items-center justify-between gap-3 rounded-xl border p-3 shadow-sm transition-colors"
    >
      <div className="min-w-0">
        <p className="text-foreground truncate text-sm font-semibold">
          {group.name}
        </p>
        <p className="text-muted mt-0.5 text-xs">
          {group.expenseCount} expense{group.expenseCount === 1 ? "" : "s"}
          {last ? ` · Last ${last}` : ""}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-foreground text-sm font-semibold tabular-nums">
          {formatMoney(Number(group.myShareTotal), currency)}
        </p>
        <p className="text-muted text-[11px]">your share</p>
      </div>
    </Link>
  );
}

export function GroupsDashboard() {
  const { data, isLoading, isError } = useGroupsList();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="border-border bg-card h-16 animate-pulse rounded-xl border"
          />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <p className="text-muted rounded-lg border border-dashed p-6 text-center text-sm">
        Could not load groups. Sync metadata from Settings if this is a new
        connection.
      </p>
    );
  }

  if (data.groups.length === 0) {
    return (
      <p className="text-muted rounded-lg border border-dashed p-6 text-center text-sm">
        No groups synced yet. Run a full sync from Settings.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {data.groups.map((g) => (
        <li key={g.id}>
          <GroupRow group={g} currency={data.currency} />
        </li>
      ))}
    </ul>
  );
}
