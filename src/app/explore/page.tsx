import { AppShell } from "@/components/app-shell";
import { AppFooter } from "@/components/app-footer";
import { ExpenseExplorer } from "@/app/explore/expense-explorer";
import { PageContainer } from "@/components/page-container";
import { EmptyState } from "@/components/ui/empty-state";
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
      <PageContainer>
        {user ? (
          <Suspense fallback={<ExplorerFallback />}>
            <ExpenseExplorer />
          </Suspense>
        ) : (
          <EmptyState variant="dashed">
            Connect Splitwise using the button in the header to browse expenses.
          </EmptyState>
        )}
      </PageContainer>
      <AppFooter />
    </AppShell>
  );
}
