"use client";

import { AppNavActions } from "@/components/app-nav-actions";
import { NAV_LINKS, isNavActive } from "@/lib/nav";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  connected: boolean;
  oauthConnected: boolean;
  dbConfigured: boolean;
  fakeDataOn?: boolean;
};

export function AppNav({
  connected,
  oauthConnected,
  dbConfigured,
  fakeDataOn = false,
}: Props) {
  const pathname = usePathname();

  return (
    <header className="border-border bg-card sticky top-0 z-30 border-b">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2 md:px-6 md:py-2.5">
        <Link
          href="/"
          className="text-foreground shrink-0 text-[15px] font-semibold tracking-tight"
        >
          Open Splitwise
        </Link>

        {connected && (
          <nav
            className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 md:flex md:gap-1"
            aria-label="Main"
          >
            {NAV_LINKS.map((link) => {
              const active = isNavActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={
                    active
                      ? "text-foreground shrink-0 rounded-md px-2 py-1 text-sm font-semibold"
                      : "text-muted hover:text-foreground shrink-0 rounded-md px-2 py-1 text-sm font-medium"
                  }
                  aria-current={active ? "page" : undefined}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        )}

        <div className="ml-auto shrink-0">
          <AppNavActions
            connected={connected}
            oauthConnected={oauthConnected}
            dbConfigured={dbConfigured}
            fakeDataOn={fakeDataOn}
          />
        </div>
      </div>
    </header>
  );
}
