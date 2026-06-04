import { Shimmer, ShimmerText } from "@/components/shimmer";

export function ExpenseDetailSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading expense">
      <div className="border-border space-y-4 rounded-2xl border p-4">
        <div className="flex gap-3">
          <Shimmer className="h-10 w-10 shrink-0 rounded-[5px]" />
          <div className="min-w-0 flex-1 space-y-2">
            <Shimmer className="h-5 w-4/5 max-w-xs rounded-md" />
            <Shimmer className="h-3.5 w-32 rounded-md" />
          </div>
        </div>
        <Shimmer className="h-9 w-36 rounded-md" />
        <div className="flex gap-2">
          <Shimmer className="h-6 w-20 rounded-full" />
          <Shimmer className="h-6 w-24 rounded-full" />
        </div>
        <Shimmer className="h-14 w-full rounded-none border-t pt-3" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Shimmer className="h-16 rounded-xl" />
        <Shimmer className="h-16 rounded-xl" />
      </div>
      <ShimmerText lines={3} />
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
