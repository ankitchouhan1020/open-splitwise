"use client";

import { NavIconForHref } from "@/components/nav-icons";
import { isNavActive } from "@/lib/nav";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  connected: boolean;
};

type NavIconHref = "/" | "/explore" | "/insights" | "/settings";

const TABS: Array<{ href: NavIconHref; label: string }> = [
  { href: "/", label: "Home" },
  { href: "/explore", label: "Explore" },
  { href: "/insights", label: "Stats" },
  { href: "/settings", label: "Settings" },
];

function NavTab({
  href,
  label,
  active,
}: {
  href: NavIconHref;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "text-accent flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 px-1 py-2 text-[11px] font-semibold"
          : "text-muted hover:text-foreground flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 px-1 py-2 text-[11px] font-medium"
      }
      aria-current={active ? "page" : undefined}
    >
      <NavIconForHref href={href} className="h-6 w-6 shrink-0" />
      <span className="max-w-full truncate">{label}</span>
    </Link>
  );
}

export function MobileBottomNav({ connected }: Props) {
  const pathname = usePathname();

  if (!connected) return null;

  return (
    <nav
      className="border-border bg-card/95 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur-md md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Main"
    >
      <div className="mx-auto grid max-w-6xl grid-cols-4 px-1">
        {TABS.map((tab) => (
          <NavTab
            key={tab.href}
            href={tab.href}
            label={tab.label}
            active={isNavActive(pathname, tab.href)}
          />
        ))}
      </div>
    </nav>
  );
}
