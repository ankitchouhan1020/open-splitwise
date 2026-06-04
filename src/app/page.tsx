import { HomeDashboard } from "@/app/home-dashboard";
import { AppNav } from "@/components/app-nav";
import { getConnectedUser } from "@/lib/auth";
import Link from "next/link";

export default async function HomePage() {
  const user = await getConnectedUser();

  if (user) {
    const userName =
      [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email;
    return (
      <>
        <AppNav />
        <main className="mx-auto max-w-4xl px-6 py-8">
          <HomeDashboard userName={userName} />
        </main>
      </>
    );
  }

  return (
    <>
      <AppNav />
      <main className="mx-auto flex min-h-[calc(100vh-49px)] max-w-3xl flex-col justify-center gap-8 px-6 py-16">
        <div className="space-y-3">
          <p className="text-accent text-sm font-medium tracking-wide uppercase">
            Splitwise companion
          </p>
          <h1 className="text-foreground text-4xl font-semibold tracking-tight">
            Open Splitwise
          </h1>
          <p className="text-muted max-w-xl text-lg">
            Search, filter, and analyze expenses from your Splitwise account.
            Balances and settlements stay on Splitwise.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/api/auth/splitwise"
            className="bg-accent rounded-lg px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Connect Splitwise
          </Link>
          <a
            href="/api/health"
            className="border-border bg-card text-foreground rounded-lg border px-4 py-2 text-sm font-medium hover:bg-stone-50"
          >
            API health
          </a>
        </div>

        <p className="text-muted text-sm">
          Not affiliated with Splitwise. Use the official app to settle up with
          friends.
        </p>
      </main>
    </>
  );
}
