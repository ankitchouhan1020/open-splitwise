export type SettingsTab =
  | "account"
  | "appearance"
  | "ai"
  | "sync"
  | "data"
  | "setup";

/** User-facing nav labels for settings tabs. */
export const SETTINGS_SECTIONS: Record<SettingsTab, { nav: string }> = {
  account: { nav: "Account" },
  appearance: { nav: "Appearance" },
  ai: { nav: "AI" },
  sync: { nav: "Sync" },
  data: { nav: "Privacy" },
  setup: { nav: "Server" },
};
