"use client";

import { SettingsSection } from "@/app/settings/settings-ui";
import { useTheme } from "@/components/theme-provider";
import type { ThemePreference } from "@/lib/theme";

const OPTIONS: { id: ThemePreference; label: string; hint: string }[] = [
  { id: "system", label: "System", hint: "Match device" },
  { id: "light", label: "Light", hint: "Stone + teal" },
  { id: "dark", label: "Dark", hint: "Low light" },
];

export function ThemeSection() {
  const { preference, resolved, setPreference } = useTheme();

  return (
    <SettingsSection
      title="Appearance"
      description={`Theme — currently ${resolved} mode`}
    >
      <div className="grid gap-2 sm:grid-cols-3">
        {OPTIONS.map((opt) => {
          const active = preference === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setPreference(opt.id)}
              className={
                active
                  ? "border-accent bg-accent/5 rounded-lg border-2 px-3 py-2.5 text-left"
                  : "border-border hover:border-border hover:border-border rounded-lg border px-3 py-2.5 text-left"
              }
            >
              <p className="text-foreground text-sm font-semibold">
                {opt.label}
              </p>
              <p className="text-muted mt-0.5 text-xs">{opt.hint}</p>
            </button>
          );
        })}
      </div>
    </SettingsSection>
  );
}
