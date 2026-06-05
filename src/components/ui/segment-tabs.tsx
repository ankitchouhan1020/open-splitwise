import { ui } from "@/lib/ui-classes";
import Link from "next/link";
import type { ReactNode } from "react";

export type SegmentTabItem<T extends string> = {
  id: T;
  label: ReactNode;
};

type SegmentTabsProps<T extends string> = {
  tabs: SegmentTabItem<T>[];
  activeId: T;
  onChange: (id: T) => void;
  ariaLabel: string;
  panelId: string;
  seeAllHref?: string;
  idPrefix?: string;
};

export function SegmentTabs<T extends string>({
  tabs,
  activeId,
  onChange,
  ariaLabel,
  panelId,
  seeAllHref,
  idPrefix = "",
}: SegmentTabsProps<T>) {
  return (
    <div className={ui.segmentTabRail} role="tablist" aria-label={ariaLabel}>
      <div className="flex gap-5">
        {tabs.map((tab) => {
          const active = activeId === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`${idPrefix}tab-${tab.id}`}
              aria-selected={active}
              aria-controls={panelId}
              onClick={() => onChange(tab.id)}
              className={active ? ui.segmentTabActive : ui.segmentTabInactive}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {seeAllHref ? (
        <Link href={seeAllHref} className={ui.seeAllLink}>
          See all
        </Link>
      ) : null}
    </div>
  );
}
