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
            <h2 className="text-foreground text-base font-medium">Retention</h2>
            <p className="mt-2">
              Your session token and cached data are kept while you remain
              connected. They are not automatically purged on a schedule while
              the connection is active.
            </p>
          </section>

          <section>
            <h2 className="text-foreground text-base font-medium">
              Deletion on disconnect
            </h2>
            <p className="mt-2">
              When you disconnect in{" "}
              <Link href="/settings" className="text-accent underline">
                Settings
              </Link>
              , the app destroys your session (removing the access token from
              the cookie) and, when a database is configured, deletes all synced
              rows associated with your connected account from PostgreSQL.
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
