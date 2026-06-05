import { Shimmer, ShimmerCard } from "@/components/shimmer";

function TableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="h-80 overflow-hidden">
      <Shimmer className="h-9 w-full rounded-none" />
      <div className="divide-border divide-y">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2.5">
            <Shimmer className="h-4 min-w-0 flex-1 rounded-md" />
            <Shimmer className="h-4 w-14 shrink-0 rounded-md" />
            <Shimmer className="h-4 w-16 shrink-0 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function InsightsDashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading insights">
      <div className="space-y-2">
        <Shimmer className="h-4 w-28 rounded-md" />
        <Shimmer className="h-9 w-40 rounded-md" />
        <Shimmer className="h-4 w-64 rounded-md" />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <ShimmerCard className="overflow-hidden rounded-lg lg:col-span-3">
          <Shimmer className="h-12 w-full rounded-none" />
          <div className="p-4">
            <Shimmer className="h-72 w-full rounded-lg" />
          </div>
        </ShimmerCard>
        <ShimmerCard className="overflow-hidden rounded-lg lg:col-span-2">
          <Shimmer className="h-12 w-full rounded-none" />
          <div className="h-72 space-y-3 p-4">
            {Array.from({ length: 6 }, (_, i) => (
              <Shimmer key={i} className="h-6 w-full rounded-md" />
            ))}
          </div>
        </ShimmerCard>
      </div>

      <ShimmerCard className="overflow-hidden rounded-lg">
        <Shimmer className="h-12 w-full rounded-none" />
        <TableSkeleton rows={5} />
      </ShimmerCard>

      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }, (_, i) => (
          <ShimmerCard key={i} className="overflow-hidden rounded-lg">
            <Shimmer className="h-12 w-full rounded-none" />
            <TableSkeleton />
          </ShimmerCard>
        ))}
      </div>
    </div>
  );
}
