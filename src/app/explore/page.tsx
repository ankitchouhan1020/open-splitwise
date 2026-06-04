import { AppNav } from "@/components/app-nav";
import { AppFooter } from "@/components/app-footer";
import { AddExpenseForm } from "@/app/explore/add-expense-form";
import { ExpenseExplorer } from "@/app/explore/expense-explorer";
import { getConnectedUser } from "@/lib/auth";
import Link from "next/link";
import { Suspense } from "react";

function ExplorerFallback() {
  return <p className="text-muted mt-6 text-sm">Loading explorer…</p>;
}

export default async function ExplorePage() {
  const user = await getConnectedUser();

  return (
    <>
      <AppNav />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-2xl font-semibold">Explore expenses</h1>
        <p className="text-muted mt-1 text-sm">
          Search, filter, and browse synced expenses. Press{" "}
          <kbd className="rounded border px-1">/</kbd> to focus search.
        </p>

        {!user ? (
          <p className="text-muted mt-8 rounded-xl border border-dashed p-8 text-center text-sm">
            <Link href="/settings" className="text-accent underline">
              Connect Splitwise
            </Link>{" "}
            to view expenses.
          </p>
        ) : (
          <div className="mt-6 space-y-8">
            <Suspense fallback={<ExplorerFallback />}>
              <ExpenseExplorer />
            </Suspense>
            <AddExpenseForm />
          </div>
        )}
      </main>
      <AppFooter />
    </>
  );
}
