export const queryKeys = {
  all: ["app"] as const,
  filters: {
    options: () => [...queryKeys.all, "filters", "options"] as const,
  },
  dashboard: () => [...queryKeys.all, "dashboard"] as const,
  expenses: {
    all: () => [...queryKeys.all, "expenses"] as const,
    list: (params: string) =>
      [...queryKeys.expenses.all(), "list", params] as const,
    summary: (params: string) =>
      [...queryKeys.expenses.all(), "summary", params] as const,
    detail: (id: number) =>
      [...queryKeys.expenses.all(), "detail", id] as const,
    suggestions: () => [...queryKeys.expenses.all(), "suggestions"] as const,
  },
  insights: {
    all: () => [...queryKeys.all, "insights"] as const,
    filtered: (params: string) =>
      [...queryKeys.insights.all(), params] as const,
  },
  explore: {
    context: () => [...queryKeys.all, "explore", "context"] as const,
  },
  sync: {
    status: () => [...queryKeys.all, "sync", "status"] as const,
  },
  categories: {
    icons: () => [...queryKeys.all, "categories", "icons"] as const,
  },
};
