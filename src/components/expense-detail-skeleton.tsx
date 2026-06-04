import { Shimmer, ShimmerText } from "@/components/shimmer";

export function ExpenseDetailSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading expense">
      <Shimmer className="h-6 w-3/4 max-w-sm rounded-md" />
      <Shimmer className="h-8 w-32 rounded-md" />
      <ShimmerText lines={2} />
      <div className="space-y-2 border-t pt-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex justify-between gap-3">
            <Shimmer className="h-3.5 w-24 rounded-md" />
            <Shimmer className="h-3.5 w-16 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AddExpenseFormSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading form">
      <Shimmer className="h-3 w-24 rounded-md" />
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: 4 }, (_, i) => (
          <Shimmer key={i} className="h-6 w-16 rounded-md" />
        ))}
      </div>
      <Shimmer className="h-10 w-full rounded-lg" />
      <div className="grid grid-cols-[1fr_5.5rem] gap-2">
        <Shimmer className="h-12 rounded-lg" />
        <Shimmer className="h-10 rounded-lg" />
      </div>
      <Shimmer className="h-10 w-full rounded-lg" />
      <Shimmer className="h-9 w-28 rounded-lg" />
    </div>
  );
}
