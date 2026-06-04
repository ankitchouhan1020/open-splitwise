import { AppNav } from "@/components/app-nav";
import { AppFooter } from "@/components/app-footer";
import { InsightsDashboard } from "@/app/insights/insights-dashboard";
import { getConnectedUser } from "@/lib/auth";
import Link from "next/link";

export default async function InsightsPage() {
  const user = await getConnectedUser();

  return (
    <>
      <AppNav />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-2xl font-semibold">Insights</h1>
        <p className="text-muted mt-1 text-sm">
          Spending trends from your synced data (my share, no FX conversion).
        </p>

        {!user ? (
          <p className="text-muted mt-8 rounded-xl border border-dashed p-8 text-center text-sm">
            <Link href="/settings" className="text-accent underline">
              Connect Splitwise
            </Link>{" "}
            to view insights.
          </p>
        ) : (
          <div className="mt-6">
            <InsightsDashboard />
          </div>
        )}
      </main>
      <AppFooter />
    </>
  );
}
