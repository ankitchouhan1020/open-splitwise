import { AppShell } from "@/components/app-shell";
import { AppFooter } from "@/components/app-footer";
import { SPLITWISE_HOME_URL } from "@/lib/splitwise/urls";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <AppShell>
      <main className="mx-auto max-w-2xl px-6 py-8">
        <h1 className="text-2xl font-semibold">Privacy policy</h1>
        <p className="text-muted mt-2 text-sm">
          How Open Splitwise handles your Splitwise account data on this
          instance.
        </p>

        <div className="text-muted mt-8 space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="text-foreground text-base font-medium">
              OAuth access token
            </h2>
            <p className="mt-2">
              When you connect Splitwise, this app stores your OAuth access
              token in an encrypted server-side session cookie (
              <code className="text-foreground rounded border px-1 text-xs">
                iron-session
              </code>
              ). The cookie is{" "}
              <code className="text-foreground rounded border px-1 text-xs">
                httpOnly
              </code>
              , so it is not exposed to browser JavaScript. The token is used
              only on the server to call the Splitwise API on your behalf.
            </p>
          </section>

          <section>
            <h2 className="text-foreground text-base font-medium">
              Cached Splitwise data
            </h2>
            <p className="mt-2">
              If a database is configured, the app syncs and caches Splitwise
              data in PostgreSQL—for example expenses, groups, friends, and
              related metadata needed for explore and insights. This is a local
              copy to power search and analytics; it is not sent to third
              parties beyond your Splitwise API requests.
            </p>
          </section>

          <section>
            <h2 className="text-foreground text-base font-medium">
              Optional AI features (BYOK)
            </h2>
            <p className="mt-2">
              If you enable AI in{" "}
              <Link href="/settings?tab=ai" className="text-accent underline">
                Settings
              </Link>
              , you can store an API key encrypted in the local database.
              Supported providers include OpenAI, OpenRouter, Google Gemini, and
              Anthropic Claude (or a custom OpenAI-compatible endpoint). The key
              is used only on this server when you use smart filters or
              narrative insights. Only filter catalogs (group, friend, and
              category names) and spending aggregates are sent — not individual
              expense rows or your Splitwise OAuth token.
            </p>
          </section>

          <section>
            <h2 className="text-foreground text-base font-medium">Retention</h2>
            <p className="mt-2">
              Your session token is kept until you disconnect. Synced Postgres
              data is kept until you explicitly delete it — disconnecting does
              not remove cached expenses or metadata.
            </p>
          </section>

          <section>
            <h2 className="text-foreground text-base font-medium">
              Disconnect vs delete synced data
            </h2>
            <p className="mt-2">
              <strong>Disconnect</strong> in{" "}
              <Link href="/settings" className="text-accent underline">
                Settings
              </Link>{" "}
              only ends your session (the OAuth token is removed from the
              cookie). Your synced database rows remain so you can reconnect and
              continue where you left off.
            </p>
            <p className="mt-2">
              <strong>Delete synced data</strong> (Privacy &amp; data section,
              while connected) removes all cached rows for your Splitwise
              account from PostgreSQL. Your session stays active unless you also
              disconnect.
            </p>
          </section>

          <section className="border-border rounded-xl border p-4">
            <p>
              Open Splitwise is not affiliated with{" "}
              <a
                href={SPLITWISE_HOME_URL}
                className="text-accent underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Splitwise
              </a>
              . Settle up and manage groups in the official app.
            </p>
          </section>
        </div>
      </main>
      <AppFooter />
    </AppShell>
  );
}
