"use client";

import { IconClose } from "@/components/expense-icons";
import {
  ExpenseListItemRow,
  ExpenseListMonthHeader,
} from "@/components/expense-list-item";
import { EmptyState } from "@/components/ui/empty-state";
import { friendlyApiError, friendlyFetchError } from "@/lib/api-errors";
import {
  peopleFriendExploreHref,
  peopleGroupExploreHref,
} from "@/lib/expenses/filters";
import { buildExpenseListSections } from "@/lib/expenses/list-sections";
import { FetchJsonError } from "@/lib/query/fetch-json";
import {
  useScopedActivityExpenses,
  type ScopedActivityTarget,
} from "@/lib/query/hooks";
import { ui } from "@/lib/ui-classes";
import Link from "next/link";
import { useEffect, useMemo } from "react";

type Props = {
  target: ScopedActivityTarget | null;
  onClose: () => void;
  onSelectExpense: (id: number) => void;
};

function drawerSubtitle(target: ScopedActivityTarget): string {
  return target.kind === "group"
    ? "Recent activity in this group"
    : "Recent activity with this friend";
}

function exploreHref(target: ScopedActivityTarget): string {
  return target.kind === "group"
    ? peopleGroupExploreHref(target.groupId, target.currency)
    : peopleFriendExploreHref(target.friendId, target.currency);
}

export function HomeScopedActivityDrawer({
  target,
  onClose,
  onSelectExpense,
}: Props) {
  const open = target != null;
  const query = useScopedActivityExpenses(target);
  const sections = useMemo(
    () => buildExpenseListSections(query.data?.items ?? [], true, "expense"),
    [query.data?.items],
  );

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || !target) return null;

  const error =
    query.isError && query.error
      ? query.error instanceof FetchJsonError
        ? friendlyApiError(
            query.error.message,
            "Couldn't load activity. Try syncing from the header.",
          )
        : friendlyFetchError(
            query.error,
            "Couldn't load activity. Try syncing from the header.",
          )
      : null;

  return (
    <>
      <button
        type="button"
        className="add-drawer-backdrop bg-overlay fixed inset-0 z-[45]"
        aria-label="Close drawer"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="scoped-activity-title"
        className="add-drawer-panel border-border bg-card fixed inset-x-0 bottom-0 z-[46] flex max-h-[min(92dvh,760px)] w-full flex-col rounded-t-2xl border shadow-2xl sm:inset-x-auto sm:top-0 sm:right-0 sm:bottom-0 sm:h-full sm:max-h-none sm:max-w-[520px] sm:rounded-none sm:rounded-l-2xl"
      >
        <div className="flex shrink-0 justify-center pt-2.5 sm:hidden">
          <span className="bg-border/80 h-1 w-9 rounded-full" aria-hidden />
        </div>
        <div className="border-border flex shrink-0 flex-col gap-0.5 border-b px-4 py-3.5 sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <h2
              id="scoped-activity-title"
              className="text-foreground min-w-0 truncate text-[17px] font-semibold tracking-tight"
            >
              {target.name}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-muted hover:text-foreground hover:bg-hover inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors"
              aria-label="Close"
            >
              <IconClose className="h-[17px] w-[17px]" />
            </button>
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-muted text-sm">{drawerSubtitle(target)}</p>
            <Link
              href={exploreHref(target)}
              className="text-accent shrink-0 text-xs font-medium hover:underline"
            >
              See all
            </Link>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {query.isLoading ? (
            <ul className={ui.listFlush} aria-busy="true">
              {[1, 2, 3, 4].map((i) => (
                <li key={i} aria-hidden>
                  <div className="bg-muted-surface/40 min-h-[60px] animate-pulse" />
                </li>
              ))}
            </ul>
          ) : error ? (
            <div className="p-4">
              <p className={ui.errorBox}>{error}</p>
            </div>
          ) : sections.length === 0 ? (
            <EmptyState compact>No recent activity.</EmptyState>
          ) : (
            <ul className={ui.listFlush}>
              {sections.map((section) => (
                <li key={`${section.kind}-${section.key}`}>
                  {section.kind === "month" ? (
                    <ExpenseListMonthHeader label={section.label} />
                  ) : (
                    <ExpenseListItemRow
                      expense={section.expense}
                      compact
                      onSelect={() => onSelectExpense(section.expense.id)}
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
}
