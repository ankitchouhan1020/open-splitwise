"use client";

import {
  activeFilterChips,
  filtersToSearchParams,
  parseExpenseFilters,
  type ExpenseFilters,
} from "@/lib/expenses/filters";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useTransition } from "react";

export function useExpenseFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const filters = useMemo(
    () => parseExpenseFilters(searchParams),
    [searchParams],
  );

  const setFilters = useCallback(
    (next: ExpenseFilters, replace = false) => {
      const params = filtersToSearchParams({ ...filters, ...next, page: 1 });
      const qs = params.toString();
      startTransition(() => {
        router[replace ? "replace" : "push"](
          qs ? `${pathname}?${qs}` : pathname,
        );
      });
    },
    [filters, pathname, router],
  );

  const clearFilter = useCallback(
    (key: string) => {
      const patch: ExpenseFilters = { page: 1 };
      switch (key) {
        case "q":
          patch.q = undefined;
          break;
        case "date":
          patch.dateFrom = undefined;
          patch.dateTo = undefined;
          break;
        case "group":
          patch.groupId = undefined;
          break;
        case "friend":
          patch.friendId = undefined;
          break;
        case "paidBy":
          patch.paidByUserId = undefined;
          break;
        case "paidTo":
          patch.paidToUserId = undefined;
          break;
        case "category":
          patch.categoryId = undefined;
          break;
        case "currency":
          patch.currency = undefined;
          break;
        case "payment":
          patch.payment = undefined;
          break;
        case "cost":
          patch.costMin = undefined;
          patch.costMax = undefined;
          break;
        case "share":
          patch.shareMin = undefined;
          patch.shareMax = undefined;
          break;
        default:
          break;
      }
      setFilters(patch);
    },
    [setFilters],
  );

  const clearAll = useCallback(() => {
    startTransition(() => router.push(pathname));
  }, [pathname, router]);

  const applyFilters = useCallback(
    (viewFilters: ExpenseFilters) => {
      const params = filtersToSearchParams(viewFilters);
      const qs = params.toString();
      startTransition(() => {
        router.push(qs ? `${pathname}?${qs}` : pathname);
      });
    },
    [pathname, router],
  );

  return {
    filters,
    setFilters,
    clearFilter,
    clearAll,
    applyFilters,
    activeFilterChips,
  };
}
