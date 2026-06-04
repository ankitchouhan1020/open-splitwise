import { AppNav } from "@/components/app-nav";
import { ExpenseExplorer } from "@/app/explore/expense-explorer";
import { getConnectedUser } from "@/lib/auth";
import Link from "next/link";

export default async function ExplorePage() {
  const user = await getConnectedUser();

  return (
    <>
      <AppNav />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-2xl font-semibold">Explore expenses</h1>
        <p className="text-muted mt-1 text-sm">
          Dense, sortable list synced from your Splitwise account.
        </p>

        {!user ? (
          <p className="text-muted mt-8 rounded-xl border border-dashed p-8 text-center text-sm">
            <Link href="/settings" className="text-accent underline">
              Connect Splitwise
            </Link>{" "}
            to view expenses.
          </p>
        ) : (
          <div className="mt-6">
            <ExpenseExplorer />
          </div>
        )}
      </main>
    </>
  );
}
