import { SettingsSection } from "@/app/settings/settings-ui";
import Link from "next/link";

export function PrivacySection() {
  return (
    <SettingsSection
      title="Privacy & data"
      description="What this instance stores and how to remove it."
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted max-w-md text-sm leading-relaxed">
          OAuth tokens live in an encrypted session cookie. Synced expenses live
          in your Postgres database. Disconnecting clears both.
        </p>
        <Link
          href="/privacy"
          className="border-border text-foreground shrink-0 rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-stone-50"
        >
          Read privacy policy
        </Link>
      </div>
    </SettingsSection>
  );
}
