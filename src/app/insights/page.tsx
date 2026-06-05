import { AppShell } from "@/components/app-shell";
import { AppFooter } from "@/components/app-footer";
import { InsightsDashboard } from "@/app/insights/insights-dashboard";
import { PageContainer } from "@/components/page-container";
import { EmptyState } from "@/components/ui/empty-state";
import { getConnectedUser } from "@/lib/auth";

export default async function InsightsPage() {
  const user = await getConnectedUser();

  return (
    <AppShell>
      <PageContainer>
        {user ? (
          <InsightsDashboard />
        ) : (
          <EmptyState variant="dashed">
            Connect Splitwise using the button in the header to view spending
            insights.
          </EmptyState>
        )}
      </PageContainer>
      <AppFooter />
    </AppShell>
  );
}
