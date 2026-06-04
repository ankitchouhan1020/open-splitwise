import {
  SettingsSection,
  SettingsStat,
  StatusBadge,
} from "@/app/settings/settings-ui";
import type { SetupStatus } from "@/lib/setup/status";

type Props = {
  setup: SetupStatus;
};

export function SystemPanel({ setup }: Props) {
  const { oauthConfigured, dbConfigured, envVars } = setup;
  const allReady = oauthConfigured && dbConfigured;
  const oauthReady = envVars
    .filter((v) => v.key !== "DATABASE_URL")
    .every((v) => v.configured);

  return (
    <SettingsSection
      title="Server setup"
      description="Self-hosted requirements for this instance."
      action={
        allReady ? (
          <StatusBadge tone="ok">Ready</StatusBadge>
        ) : (
          <StatusBadge tone="warn">Incomplete</StatusBadge>
        )
      }
    >
      {allReady ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <SettingsStat label="OAuth" value="Configured" />
          <SettingsStat label="Database" value="Connected" />
        </div>
      ) : (
        <ul className="space-y-2">
          {envVars.map((v) => (
            <li key={v.key} className="flex items-start gap-2 text-sm">
              <span
                className={
                  v.configured
                    ? "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs text-teal-800"
                    : "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs text-amber-900"
                }
                aria-hidden
              >
                {v.configured ? "✓" : "!"}
              </span>
              <div>
                <p className="text-foreground font-medium">
                  <code className="text-xs">{v.key}</code>
                </p>
                <p className="text-muted mt-0.5 text-xs leading-relaxed">
                  {v.configured ? v.label : v.hint}
                </p>
              </div>
            </li>
          ))}
          {!oauthReady && (
            <li className="text-muted border-border mt-2 rounded-md border bg-stone-50/60 px-3 py-2 text-xs">
              Callback URL for Splitwise:{" "}
              <code className="text-foreground">{setup.redirectUri}</code>
            </li>
          )}
        </ul>
      )}
    </SettingsSection>
  );
}
