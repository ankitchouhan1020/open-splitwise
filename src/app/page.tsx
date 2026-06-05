import { HomeDashboard } from "@/app/home-dashboard";
import { AppShell } from "@/components/app-shell";
import { DemoModeButton } from "@/components/demo-mode-button";
import { getConnectedUser } from "@/lib/auth";
import { isGuestDemoAllowed } from "@/lib/demo/config";
import Link from "next/link";

const HIGHLIGHTS = [
  "Search and filter every synced expense",
  "See your share and live balances",
  "Chart spending from your synced data",
  "Self-hosted — your data, your server",
] as const;

export default async function HomePage() {
  const user = await getConnectedUser();

  if (user) {
    const userName =
      [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email;
    return (
      <AppShell>
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 md:py-10">
          <HomeDashboard userName={userName} />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="mx-auto flex min-h-0 max-w-xl flex-col justify-center gap-6 px-4 py-10 sm:gap-8 sm:px-6 sm:py-16">
        <div className="space-y-2 sm:space-y-3">
          <h1 className="text-foreground text-3xl font-semibold tracking-tight sm:text-4xl md:text-[2.75rem]">
            open-splitwise
          </h1>
          <p className="text-muted text-base leading-relaxed sm:text-lg">
            A companion app for Splitwise — sync your expenses, then search,
            filter, and chart your share from a dashboard you control.
          </p>
        </div>

        <ul className="text-muted space-y-2 text-sm leading-relaxed sm:space-y-2.5">
          {HIGHLIGHTS.map((item) => (
            <li key={item} className="flex gap-2.5">
              <span className="text-accent mt-0.5 shrink-0" aria-hidden>
                —
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-2.5 pt-1 sm:flex-row sm:flex-wrap sm:gap-3">
          <Link
            href="/api/auth/splitwise"
            className="bg-accent text-accent-foreground rounded-xl px-6 py-3 text-center text-sm font-semibold hover:opacity-90"
          >
            Connect Splitwise
          </Link>
          {isGuestDemoAllowed() && (
            <DemoModeButton className="border-border bg-card text-foreground hover:bg-hover rounded-xl border px-6 py-3 text-center text-sm font-medium disabled:opacity-50" />
          )}
          <Link
            href="/privacy"
            className="border-border bg-card text-foreground hover:bg-hover rounded-xl border px-6 py-3 text-center text-sm font-medium"
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
