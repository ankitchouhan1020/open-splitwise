import { DeleteSyncedDataButton } from "@/app/settings/delete-synced-data-button";
import { SettingsSection } from "@/app/settings/settings-ui";
import Link from "next/link";

type Props = {
  canDeleteSyncedData?: boolean;
};

export function PrivacySection({ canDeleteSyncedData = false }: Props) {
  return (
    <SettingsSection
      title="Privacy & data"
      description="What this instance stores and how to remove it."
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted max-w-md text-sm leading-relaxed">
          OAuth tokens live in an encrypted session cookie. Synced expenses live
          in Postgres and stay there when you disconnect — use{" "}
          <strong>Delete synced data</strong> to wipe your cached copy from this
          server.
        </p>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {canDeleteSyncedData && <DeleteSyncedDataButton />}
          <Link
            href="/privacy"
            className="border-border text-foreground hover:bg-hover rounded-lg border px-3 py-1.5 text-sm font-medium"
          >
            Read privacy policy
          </Link>
        </div>
      </div>
    </SettingsSection>
  );
}
