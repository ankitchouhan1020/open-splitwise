import { Shimmer, ShimmerCard } from "@/components/shimmer";

export function InsightsDashboardSkeleton() {
  return (
    <div
      className="flex flex-col gap-3"
      aria-busy="true"
      aria-label="Loading insights"
    >
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <ShimmerCard
            key={i}
            className={`rounded-lg p-3 ${i === 2 ? "sm:col-span-2" : ""}`}
          >
            <Shimmer className="h-2.5 w-20 rounded-md" />
            <Shimmer className="mt-2 h-7 w-28 rounded-md" />
            <Shimmer className="mt-2 h-3 w-32 rounded-md" />
          </ShimmerCard>
        ))}
      </div>
      <ShimmerCard className="rounded-lg p-3 lg:col-span-3">
        <Shimmer className="h-4 w-32 rounded-md" />
        <Shimmer className="mt-3 h-48 w-full rounded-lg" />
      </ShimmerCard>
      <div className="grid gap-3 lg:grid-cols-5">
        <ShimmerCard className="rounded-lg p-3 lg:col-span-3">
          <Shimmer className="h-4 w-28 rounded-md" />
          <div className="mt-3 space-y-2">
            {Array.from({ length: 6 }, (_, i) => (
              <Shimmer key={i} className="h-8 w-full rounded-md" />
            ))}
          </div>
        </ShimmerCard>
        <ShimmerCard className="rounded-lg p-3 lg:col-span-2">
          <Shimmer className="h-4 w-24 rounded-md" />
          <div className="mt-3 space-y-2">
            {Array.from({ length: 5 }, (_, i) => (
              <Shimmer key={i} className="h-6 w-full rounded-md" />
            ))}
          </div>
        </ShimmerCard>
      </div>
    </div>
  );
}
