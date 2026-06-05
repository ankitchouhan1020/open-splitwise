import {
  SettingsBlock,
  SettingsRow,
  SettingsSection,
  SettingsStat,
  StatusBadge,
} from "@/app/settings/settings-ui";
import type { SetupStatus } from "@/lib/setup/status";

type Props = {
  setup: SetupStatus;
  bare?: boolean;
};

export function SystemPanel({ setup, bare = false }: Props) {
  const { oauthConfigured, dbConfigured, envVars } = setup;
  const allReady = oauthConfigured && dbConfigured;
  const oauthReady = envVars
    .filter((v) => v.key !== "DATABASE_URL")
    .every((v) => v.configured);

  const content = (
    <SettingsBlock
      title="Environment"
      description="Required variables for OAuth and the expense database."
    >
      {allReady ? (
        <div className="grid gap-3 p-4 sm:grid-cols-2 md:p-5">
          <SettingsStat label="Splitwise OAuth" value="Ready" />
          <SettingsStat label="Database" value="Connected" />
        </div>
      ) : (
        <>
          {envVars.map((v) => (
            <SettingsRow
              key={v.key}
              label={v.key}
              description={v.configured ? v.label : v.hint}
            >
              <StatusBadge tone={v.configured ? "ok" : "warn"}>
                {v.configured ? "Set" : "Missing"}
              </StatusBadge>
            </SettingsRow>
          ))}
          {!oauthReady && (
            <div className="border-border border-t px-4 py-3 md:px-5">
              <p className="text-muted text-sm">
                Splitwise callback URL:{" "}
                <code className="text-foreground text-xs break-all">
                  {setup.redirectUri}
                </code>
              </p>
            </div>
          )}
        </>
      )}
    </SettingsBlock>
  );

  if (bare) return content;

  return (
    <SettingsSection
      title="Server setup"
      action={
        allReady ? (
          <StatusBadge tone="ok">Ready</StatusBadge>
        ) : (
          <StatusBadge tone="warn">Incomplete</StatusBadge>
        )
      }
    >
      {content}
    </SettingsSection>
  );
}
