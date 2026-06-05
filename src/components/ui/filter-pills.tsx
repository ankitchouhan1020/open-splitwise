import { pillClass } from "@/lib/ui-classes";
import type { ReactNode } from "react";

export type FilterPillItem<T extends string> = {
  id: T;
  label: ReactNode;
};

type FilterPillsProps<T extends string> = {
  items: FilterPillItem<T>[];
  activeId: T;
  onChange: (id: T) => void;
  ariaLabel: string;
  panelId?: string;
  idPrefix?: string;
  size?: "sm" | "md";
  className?: string;
  /** `tabs` for tab panels; `group` for standalone filter toolbars. */
  as?: "tabs" | "group";
};

export function FilterPills<T extends string>({
  items,
  activeId,
  onChange,
  ariaLabel,
  panelId,
  idPrefix = "",
  size = "md",
  className = "",
  as = "tabs",
}: FilterPillsProps<T>) {
  const isTabList = as === "tabs";
  return (
    <div
      className={`flex flex-wrap gap-1.5 ${className}`.trim()}
      role={isTabList ? "tablist" : "group"}
      aria-label={ariaLabel}
    >
      {items.map((item) => {
        const active = activeId === item.id;
        return (
          <button
            key={item.id}
            type="button"
            role={isTabList ? "tab" : undefined}
            id={isTabList ? `${idPrefix}pill-${item.id}` : undefined}
            aria-selected={isTabList ? active : undefined}
            aria-controls={isTabList ? panelId : undefined}
            onClick={() => onChange(item.id)}
            className={pillClass(active, size)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

type FilterPillButtonProps = {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  size?: "sm" | "md";
  title?: string;
  className?: string;
};

/** Single filter pill — for toolbars that build pills manually (e.g. group names). */
export function FilterPillButton({
  active,
  onClick,
  children,
  size = "sm",
  title,
  className = "",
}: FilterPillButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`${pillClass(active, size)} ${className}`.trim()}
    >
      {children}
    </button>
  );
}
