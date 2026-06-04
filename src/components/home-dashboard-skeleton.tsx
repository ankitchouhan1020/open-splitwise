import { ExpenseTableSkeleton } from "@/components/expense-table-skeleton";
import { Shimmer, ShimmerCard } from "@/components/shimmer";

export function HomeDashboardSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading dashboard">
      <section className="grid gap-4 lg:grid-cols-2">
        <ShimmerCard className="flex h-full min-h-[9rem] flex-col">
          <Shimmer className="h-3 w-32 rounded-md" />
          <Shimmer className="mt-3 h-8 w-28 rounded-md" />
          <Shimmer className="mt-2 h-3 w-20 rounded-md" />
          <div className="border-border mt-4 space-y-2 border-t pt-3">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="flex justify-between gap-3">
                <Shimmer className="h-3.5 w-24 rounded-md" />
                <Shimmer className="h-3.5 w-16 rounded-md" />
              </div>
            ))}
          </div>
        </ShimmerCard>
        <ShimmerCard className="flex h-full min-h-[9rem] flex-col">
          <div className="flex justify-between gap-4">
            <div className="flex-1 space-y-2">
              <Shimmer className="h-3 w-36 rounded-md" />
              <Shimmer className="h-9 w-32 rounded-md" />
              <Shimmer className="h-3.5 w-44 rounded-md" />
            </div>
            <div className="hidden space-y-2 sm:block">
              <Shimmer className="ml-auto h-3 w-20 rounded-md" />
              <Shimmer className="h-4 w-16 rounded-md" />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Shimmer className="h-12 w-full max-w-xs rounded-lg" />
            <Shimmer className="h-12 w-full max-w-sm rounded-lg" />
          </div>
        </ShimmerCard>
      </section>

      <ExpenseTableSkeleton
        rows={6}
        title={{
          heading: "Recent activity",
          sub: "Latest expenses this month",
        }}
      />

      <section className="grid gap-4 lg:grid-cols-3">
        <ShimmerCard className="lg:col-span-2">
          <Shimmer className="h-5 w-36 rounded-md" />
          <Shimmer className="mt-2 h-3.5 w-48 rounded-md" />
          <div className="mt-4 flex h-40 items-end gap-2">
            {(["h-14", "h-24", "h-16", "h-28", "h-20", "h-12"] as const).map(
              (h, i) => (
                <Shimmer key={i} className={`flex-1 rounded-t-md ${h}`} />
              ),
            )}
          </div>
        </ShimmerCard>
        <ShimmerCard>
          <Shimmer className="h-5 w-24 rounded-md" />
          <Shimmer className="mt-2 h-3.5 w-20 rounded-md" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i}>
                <div className="flex justify-between gap-2">
                  <Shimmer className="h-3.5 w-24 rounded-md" />
                  <Shimmer className="h-3.5 w-14 rounded-md" />
                </div>
                <Shimmer className="mt-1.5 h-1 w-full rounded-full" />
              </div>
            ))}
          </div>
        </ShimmerCard>
      </section>
    </div>
  );
}
