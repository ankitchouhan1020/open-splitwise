export const DEMO_MODE_COPY = {
  sync: "Sync is paused while sample data is on. Turn off demo mode in the header to pull your latest expenses from Splitwise.",
  addExpense:
    "Adding expenses is disabled while sample data is on. Add and settle up in Splitwise, then turn off demo mode to see your real data here.",
  ai: "AI features need your real synced data. Turn off demo mode in the header to use smart filters and summaries.",
  deleteData:
    "Deleting synced data is disabled while sample data is on. Turn off demo mode first.",
  signOut:
    "Sign out is disabled while sample data is on. Turn off demo mode in the header first.",
  identity:
    "A fictional profile is shown while demo mode is on. Your real Splitwise identity stays hidden until you turn demo mode off.",
} as const;

export type DemoModeFeature = keyof typeof DEMO_MODE_COPY;
