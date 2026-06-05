"use client";

import type { SettingsTab } from "@/app/settings/settings-copy";
import { SETTINGS_SECTIONS } from "@/app/settings/settings-copy";

type Props = {
  tabs: SettingsTab[];
  activeTab: SettingsTab;
  onSelect: (tab: SettingsTab) => void;
};

export function SettingsNav({ tabs, activeTab, onSelect }: Props) {
  return (
    <nav aria-label="Settings">
      <ul className="hidden flex-col gap-0.5 lg:flex">
        {tabs.map((id) => {
          const active = activeTab === id;
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => onSelect(id)}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "text-foreground border-accent cursor-default border-l-2 py-1 pl-2.5 text-left text-sm font-medium"
                    : "text-muted cursor-default border-l-2 border-transparent py-1 pl-2.5 text-left text-sm"
                }
              >
                {SETTINGS_SECTIONS[id].nav}
              </button>
            </li>
          );
        })}
      </ul>

      <div
        className="border-border flex gap-5 overflow-x-auto border-b lg:hidden"
        role="tablist"
        aria-label="Settings sections"
      >
        {tabs.map((id) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSelect(id)}
              className={
                active
                  ? "text-foreground border-accent -mb-px shrink-0 cursor-default border-b-2 pb-2.5 text-sm font-medium"
                  : "text-muted shrink-0 cursor-default pb-2.5 text-sm"
              }
            >
              {SETTINGS_SECTIONS[id].nav}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
