import { AppShell } from "@/components/app-shell";
import { AppFooter } from "@/components/app-footer";
import { ExpenseExplorer } from "@/app/explore/expense-explorer";
import { getConnectedUser } from "@/lib/auth";
import { Suspense } from "react";

import { ExpenseTableSkeleton } from "@/components/expense-table-skeleton";

function ExplorerFallback() {
  return <ExpenseTableSkeleton rows={14} />;
}

export default async function ExplorePage() {
  const user = await getConnectedUser();

  return (
    <AppShell>
      <main className="mx-auto flex max-w-6xl flex-col px-4 py-4 sm:px-6">
        <header className="mb-3 shrink-0">
          <h1 className="text-foreground text-xl font-semibold tracking-tight">
            Explore
          </h1>
        </header>

        {user ? (
          <Suspense fallback={<ExplorerFallback />}>
            <ExpenseExplorer />
          </Suspense>
        ) : (
          <p className="text-muted rounded-lg border border-dashed p-6 text-center text-sm">
            Connect Splitwise using the button in the header to browse expenses.
          </p>
        )}
      </main>
      <AppFooter />
    </AppShell>
  );
}
