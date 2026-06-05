import { AppShell } from "@/components/app-shell";
import { GroupsDashboard } from "@/app/groups/groups-dashboard";
import { getConnectedUser } from "@/lib/auth";

export default async function GroupsPage() {
  const user = await getConnectedUser();

  return (
    <AppShell>
      <div className="mx-auto flex max-w-6xl flex-col px-4 py-3 sm:px-6 md:py-4">
        <header className="mb-3 hidden shrink-0 md:block">
          <h1 className="text-foreground text-xl font-semibold tracking-tight">
            Groups
          </h1>
          <p className="text-muted text-xs">
            Synced groups and your share of activity
          </p>
        </header>

        {user ? (
          <GroupsDashboard />
        ) : (
          <p className="text-muted rounded-lg border border-dashed p-6 text-center text-sm">
            Connect Splitwise using the button in the header to view groups.
          </p>
        )}
      </div>
    </AppShell>
  );
}
