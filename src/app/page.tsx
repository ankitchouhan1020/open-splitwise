import { HomeDashboard } from "@/app/home-dashboard";
import { AppShell } from "@/components/app-shell";
import { getConnectedUser } from "@/lib/auth";
import Link from "next/link";

const HIGHLIGHTS = [
  "Search and filter every synced expense",
  "See your share and live balances",
  "Chart spending without Splitwise Pro",
  "Self-hosted — your data, your server",
] as const;

export default async function HomePage() {
  const user = await getConnectedUser();

  if (user) {
    const userName =
      [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email;
    return (
      <AppShell>
        <main className="mx-auto max-w-6xl px-6 py-10">
          <HomeDashboard userName={userName} />
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="mx-auto flex min-h-[calc(100vh-49px)] max-w-xl flex-col justify-center gap-8 px-6 py-16">
        <div className="space-y-3">
          <h1 className="text-foreground text-4xl font-semibold tracking-tight sm:text-[2.75rem]">
            open-splitwise
          </h1>
          <p className="text-muted text-lg leading-relaxed">
            A companion app for Splitwise — sync your expenses, then search,
            filter, and chart your share from a dashboard you control.
          </p>
        </div>

        <ul className="text-muted space-y-2.5 text-sm leading-relaxed">
          {HIGHLIGHTS.map((item) => (
            <li key={item} className="flex gap-2.5">
              <span className="text-accent mt-0.5 shrink-0" aria-hidden>
                —
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap gap-3 pt-1">
          <Link
            href="/api/auth/splitwise"
            className="bg-accent rounded-xl px-6 py-3 text-sm font-semibold text-white hover:opacity-90"
          >
            Connect Splitwise
          </Link>
          <Link
            href="/privacy"
            className="border-border bg-card text-foreground rounded-xl border px-6 py-3 text-sm font-medium hover:bg-stone-50"
          >
            Privacy
          </Link>
        </div>

        <p className="text-muted text-xs leading-relaxed">
          Not affiliated with Splitwise. Settle up and add expenses in the
          Splitwise app — this tool is for looking things up.
        </p>
      </main>
    </AppShell>
  );
}
