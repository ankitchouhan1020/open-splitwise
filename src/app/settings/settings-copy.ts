export type SettingsTab = "account" | "appearance" | "sync" | "data" | "setup";

/** User-facing nav labels for settings tabs. */
export const SETTINGS_SECTIONS: Record<SettingsTab, { nav: string }> = {
  account: { nav: "Account" },
  appearance: { nav: "Appearance" },
  sync: { nav: "Sync" },
  data: { nav: "Privacy" },
  setup: { nav: "Server" },
};
