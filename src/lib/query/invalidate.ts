import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";

/** Refetch dashboard, expense lists, insights, and form suggestions after sync or mutations. */
export async function invalidateExpenseCaches(qc: QueryClient) {
  await Promise.all([
    qc.invalidateQueries({ queryKey: queryKeys.dashboard() }),
    qc.invalidateQueries({ queryKey: queryKeys.expenses.all() }),
    qc.invalidateQueries({ queryKey: queryKeys.insights.all() }),
    qc.invalidateQueries({ queryKey: queryKeys.explore.context() }),
    qc.invalidateQueries({ queryKey: queryKeys.filters.options() }),
    qc.invalidateQueries({ queryKey: queryKeys.friends.balances() }),
    qc.invalidateQueries({ queryKey: queryKeys.groups.list() }),
    qc.invalidateQueries({ queryKey: queryKeys.sync.status() }),
    qc.invalidateQueries({ queryKey: queryKeys.ai.narrative() }),
  ]);
}
