import type { ReactNode } from "react";

export function ExploreFilterRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-3">
      <span className="text-muted shrink-0 pt-0.5 text-[11px] font-semibold tracking-wide uppercase sm:w-16 sm:pt-1.5">
        {label}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
