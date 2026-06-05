import { ui } from "@/lib/ui-classes";
import { balanceClasses, type BalanceTag } from "@/lib/balance-style";
import type { ReactNode } from "react";

type DataListProps = {
  variant: "bordered" | "flush";
  children: ReactNode;
  className?: string;
};

export function DataList({ variant, children, className = "" }: DataListProps) {
  const base = variant === "flush" ? ui.listFlush : ui.listBordered;
  return <ul className={`${base} ${className}`.trim()}>{children}</ul>;
}

type ListSectionHeaderProps = {
  title: string;
  tone?: BalanceTag;
  count: number;
};

export function ListSectionHeader({
  title,
  tone,
  count,
}: ListSectionHeaderProps) {
  return (
    <li className={ui.listSectionHeader} aria-hidden>
      <p
        className={`text-xs font-semibold tracking-wide uppercase ${
          tone ? balanceClasses(tone).label : "text-muted"
        }`}
      >
        {title}
        <span className="text-muted font-normal"> · {count}</span>
      </p>
    </li>
  );
}
