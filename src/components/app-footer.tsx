import { SPLITWISE_HOME_URL } from "@/lib/splitwise/urls";
import Link from "next/link";

export function AppFooter() {
  return (
    <footer className="border-border text-muted mx-auto max-w-6xl border-t px-6 py-6 text-xs">
      <p>
        <Link href="/privacy" className="text-accent underline">
          Privacy
        </Link>
        {" · "}
        Not affiliated with{" "}
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
    </footer>
  );
}
