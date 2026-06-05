import { Shimmer } from "@/components/shimmer";

function ActivityRowSkeleton() {
  return (
    <div
      className="grid min-h-[60px] grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-x-2.5 px-3 py-3 md:grid-cols-[2.75rem_2.5rem_minmax(0,1fr)_auto] md:gap-x-3 md:py-2.5"
      aria-hidden
    >
      <Shimmer className="hidden h-10 w-11 rounded-md md:block" />
      <Shimmer className="h-9 w-9 rounded-full" />
      <div className="min-w-0 space-y-1.5">
        <Shimmer className="h-4 w-32 rounded-md" />
        <Shimmer className="h-3 w-44 rounded-md" />
      </div>
      <div className="flex flex-col items-end gap-1">
        <Shimmer className="h-4 w-14 rounded-md" />
        <Shimmer className="h-3 w-16 rounded-md" />
      </div>
    </div>
  );
}

export function HomeDashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard">
      <div className="space-y-2">
        <Shimmer className="h-4 w-40 rounded-md" />
        <Shimmer className="h-9 w-48 rounded-md" />
        <Shimmer className="h-4 w-32 rounded-md" />
      </div>
      <div>
        <div className="border-border flex gap-5 border-b pb-2.5">
          <Shimmer className="h-4 w-16 rounded-md" />
          <Shimmer className="h-4 w-14 rounded-md" />
          <Shimmer className="h-4 w-14 rounded-md" />
        </div>
        <div className="divide-border mt-3 divide-y">
          {Array.from({ length: 5 }, (_, i) => (
            <ActivityRowSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
