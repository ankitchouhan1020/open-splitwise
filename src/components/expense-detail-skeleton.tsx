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
    <div
      className="flex min-h-0 flex-1 flex-col"
      aria-busy="true"
      aria-label="Loading form"
    >
      <div className="flex-1 space-y-4 px-4 py-5 sm:px-5">
        <Shimmer className="h-10 w-full rounded-lg" />
        <Shimmer className="h-10 w-full rounded-lg" />
        <div className="border-border space-y-4 rounded-xl border p-4 sm:p-5">
          <Shimmer className="h-12 w-2/3 rounded-md" />
          <Shimmer className="h-4 w-40 rounded-md" />
          <Shimmer className="border-border h-10 w-full rounded-lg border-t pt-4" />
        </div>
      </div>
      <div className="border-border shrink-0 border-t px-4 py-3 sm:px-5">
        <Shimmer className="h-11 w-full rounded-lg" />
      </div>
    </div>
  );
}
