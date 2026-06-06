import { DeleteSyncedDataButton } from "@/app/settings/delete-synced-data-button";
import {
  SettingsBlock,
  SettingsDangerZone,
  SettingsRow,
  SettingsSection,
} from "@/app/settings/settings-ui";
import { DemoModeNotice } from "@/components/demo-mode-notice";
import Link from "next/link";

type Props = {
  canDeleteSyncedData?: boolean;
  demoMode?: boolean;
  bare?: boolean;
};

export function PrivacySection({
  canDeleteSyncedData = false,
  demoMode = false,
  bare = false,
}: Props) {
  const content = (
    <div className="space-y-4">
      <SettingsBlock title="How your data is stored">
        <SettingsRow
          label="On this server"
          description="Expenses you sync are kept in a local database so search and charts stay fast. They remain here after you sign out."
        />
        <SettingsRow
          label="On Splitwise"
          description="Nothing in this app changes your balances or expenses in Splitwise. Settle up and add expenses there as usual."
        />
        <SettingsRow label="Privacy policy">
          <Link
            href="/privacy"
            className="text-accent text-sm font-medium hover:underline"
          >
            Read policy
          </Link>
        </SettingsRow>
      </SettingsBlock>

      {canDeleteSyncedData && (
        <SettingsDangerZone description="Permanently removes your synced copy from this server. You can sync again afterward.">
          {demoMode ? (
            <SettingsRow label="Delete all synced data">
              <DemoModeNotice feature="deleteData" />
            </SettingsRow>
          ) : (
            <SettingsRow
              label="Delete all synced data"
              description="Removes expenses, groups, friends, and categories stored for your account on this server."
            >
              <DeleteSyncedDataButton />
            </SettingsRow>
          )}
        </SettingsDangerZone>
      )}
    </div>
  );

  if (bare) return content;

  return <SettingsSection title="Privacy & data">{content}</SettingsSection>;
}
