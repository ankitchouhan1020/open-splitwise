import { AppShell } from "@/components/app-shell";
import { AppFooter } from "@/components/app-footer";
import { InsightsDashboard } from "@/app/insights/insights-dashboard";
import { getConnectedUser } from "@/lib/auth";

export default async function InsightsPage() {
  const user = await getConnectedUser();

  return (
    <AppShell>
      <main className="mx-auto flex max-w-6xl flex-col px-4 py-4 sm:px-6">
        <header className="mb-3 shrink-0">
          <h1 className="text-foreground text-xl font-semibold tracking-tight">
            Insights
          </h1>
          <p className="text-muted text-xs">
            Your share of spending — no currency conversion
          </p>
        </header>

        {user ? (
          <InsightsDashboard />
        ) : (
          <p className="text-muted rounded-lg border border-dashed p-6 text-center text-sm">
            Connect Splitwise using the button in the header to view spending
            insights.
          </p>
        )}
      </main>
      <AppFooter />
    </AppShell>
  );
}
