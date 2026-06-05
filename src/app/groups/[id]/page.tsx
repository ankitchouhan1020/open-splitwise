import { AppShell } from "@/components/app-shell";
import { GroupDetailView } from "@/app/groups/[id]/group-detail-view";
import { getConnectedUser } from "@/lib/auth";

type Props = { params: Promise<{ id: string }> };

export default async function GroupDetailPage({ params }: Props) {
  const { id } = await params;
  const user = await getConnectedUser();

  return (
    <AppShell>
      <div className="mx-auto flex max-w-6xl flex-col px-4 py-3 sm:px-6 md:py-4">
        {user ? (
          <GroupDetailView groupId={Number(id)} />
        ) : (
          <p className="text-muted rounded-lg border border-dashed p-6 text-center text-sm">
            Connect Splitwise to view group details.
          </p>
        )}
      </div>
    </AppShell>
  );
}
