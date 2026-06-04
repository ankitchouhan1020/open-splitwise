import { Shimmer } from "@/components/shimmer";
import { EXPENSE_ROW_GRID } from "@/components/expense-list-item";

export function ExpenseTableSkeleton({
  rows = 8,
  showHeader = true,
  title,
}: {
  rows?: number;
  showHeader?: boolean;
  title?: { heading: string; sub?: string };
}) {
  void showHeader;

  return (
    <div className="border-border bg-card overflow-hidden rounded-lg border">
      {title && (
        <div className="border-border flex items-center justify-between gap-3 border-b px-5 py-4">
          <div>
            <h2 className="text-foreground text-lg font-semibold tracking-tight">
              {title.heading}
            </h2>
            {title.sub && (
              <p className="text-muted mt-0.5 text-sm">{title.sub}</p>
            )}
          </div>
          <Shimmer className="h-4 w-16 rounded-md" />
        </div>
      )}
      <Shimmer className="h-9 w-full rounded-none" />
      <ul>
        {Array.from({ length: rows }, (_, i) => (
          <li
            key={i}
            className={`border-border ${EXPENSE_ROW_GRID} border-b last:border-b-0`}
            style={{ minHeight: 76 }}
          >
            <div className="flex h-10 w-11 flex-col items-center justify-center gap-1">
              <Shimmer className="h-2.5 w-7 rounded-md" />
              <Shimmer className="h-5 w-7 rounded-md" />
            </div>
            <Shimmer className="h-10 w-10 rounded-[5px]" />
            <div className="min-w-0 space-y-1.5">
              <Shimmer className="h-3.5 w-full max-w-[14rem] rounded-md" />
              <Shimmer className="h-4 w-24 rounded-md" />
            </div>
            <div className="space-y-1.5 text-right">
              <Shimmer className="ml-auto h-3.5 w-20 rounded-md" />
              <Shimmer className="ml-auto h-3 w-16 rounded-md" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
