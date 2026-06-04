"use client";

import { AppNavActions } from "@/components/app-nav-actions";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/explore", label: "Explore" },
  { href: "/insights", label: "Insights" },
  { href: "/settings", label: "Settings" },
];

function isNavActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

type Props = {
  connected: boolean;
  dbConfigured: boolean;
};

export function AppNav({ connected, dbConfigured }: Props) {
  const pathname = usePathname();

  return (
    <nav className="border-border bg-card border-b">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-2.5 sm:gap-6 sm:px-6">
        <Link
          href="/"
          className="text-foreground shrink-0 text-[15px] font-semibold tracking-tight"
        >
          Open Splitwise
        </Link>
        <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto sm:gap-1">
          {links.map((link) => {
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
        </div>
        <AppNavActions connected={connected} dbConfigured={dbConfigured} />
      </div>
    </nav>
  );
}
