"use client";

import { SettingsBlock, SettingsSection } from "@/app/settings/settings-ui";
import { useTheme } from "@/components/theme-provider";
import type { ThemePreference } from "@/lib/theme";

const OPTIONS: {
  id: ThemePreference;
  label: string;
  hint: string;
  swatch: string;
}[] = [
  {
    id: "system",
    label: "System",
    hint: "Match this device",
    swatch: "from-stone-300 via-stone-500 to-stone-800",
  },
  {
    id: "light",
    label: "Light",
    hint: "Bright, daytime",
    swatch: "from-stone-100 via-teal-100 to-stone-200",
  },
  {
    id: "dark",
    label: "Dark",
    hint: "Easier at night",
    swatch: "from-stone-800 via-stone-900 to-teal-950",
  },
];

export function ThemeSection({ bare = false }: { bare?: boolean }) {
  const { preference, setPreference } = useTheme();

  const content = (
    <SettingsBlock title="Theme">
      <div className="grid gap-3 p-4 sm:grid-cols-3 md:p-5">
        {OPTIONS.map((opt) => {
          const active = preference === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setPreference(opt.id)}
              aria-pressed={active}
              className={
                active
                  ? "border-accent ring-accent/20 flex flex-col overflow-hidden rounded-lg border-2 text-left ring-2"
                  : "border-border hover:border-accent/40 flex flex-col overflow-hidden rounded-lg border text-left transition-colors"
              }
            >
              <div
                className={`h-12 w-full bg-gradient-to-br ${opt.swatch}`}
                aria-hidden
              />
              <div className="px-3 py-2.5">
                <p className="text-foreground text-sm font-medium">
                  {opt.label}
                </p>
                <p className="text-muted text-xs">{opt.hint}</p>
              </div>
            </button>
          );
        })}
      </div>
    </SettingsBlock>
  );

  if (bare) return content;

  return <SettingsSection title="Appearance">{content}</SettingsSection>;
}
