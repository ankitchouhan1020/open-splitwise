"use client";

import { useAddExpenseDialog } from "@/components/add-expense-provider";
import { NavIconAdd, NavIconForHref } from "@/components/nav-icons";
import { NAV_LINKS, isNavActive } from "@/lib/nav";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  connected: boolean;
  oauthConnected: boolean;
  fakeDataOn?: boolean;
};

function NavTab({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "text-accent flex min-h-[3.25rem] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[11px] font-semibold"
          : "text-muted hover:text-foreground flex min-h-[3.25rem] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[11px] font-medium"
      }
      aria-current={active ? "page" : undefined}
    >
      <NavIconForHref
        href={href as "/" | "/explore" | "/insights" | "/settings"}
        className="h-6 w-6 shrink-0"
      />
      <span className="truncate">{label}</span>
    </Link>
  );
}

export function MobileBottomNav({
  connected,
  oauthConnected,
  fakeDataOn = false,
}: Props) {
  const pathname = usePathname();
  const { openDialog } = useAddExpenseDialog();

  if (!connected) return null;

  const [home, explore, insights, settings] = NAV_LINKS;

  return (
    <nav
      className="border-border bg-card/95 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur-md md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Main"
    >
      <div className="mx-auto flex max-w-6xl items-end justify-around px-1">
        <NavTab
          href={home.href}
          label={home.label}
          active={isNavActive(pathname, home.href)}
        />
        <NavTab
          href={explore.href}
          label={explore.label}
          active={isNavActive(pathname, explore.href)}
        />

        {oauthConnected && !fakeDataOn ? (
          <button
            type="button"
            onClick={openDialog}
            aria-label="Add expense"
            className="text-accent -mt-3 flex min-w-0 flex-1 flex-col items-center justify-end gap-0.5 px-1 pb-2"
          >
            <span className="bg-accent flex h-12 w-12 items-center justify-center rounded-full text-white shadow-md">
              <NavIconAdd className="h-6 w-6" />
            </span>
            <span className="text-[11px] font-semibold">Add</span>
          </button>
        ) : (
          <div
            className="text-muted -mt-3 flex min-w-0 flex-1 flex-col items-center justify-end gap-0.5 px-1 pb-2"
            aria-hidden
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-stone-300 bg-stone-50">
              <NavIconAdd className="h-6 w-6 opacity-30" />
            </span>
            <span className="text-[11px] font-medium">
              {fakeDataOn ? "Sample" : "Add"}
            </span>
          </div>
        )}

        <NavTab
          href={insights.href}
          label={insights.shortLabel ?? insights.label}
          active={isNavActive(pathname, insights.href)}
        />
        <NavTab
          href={settings.href}
          label={settings.label}
          active={isNavActive(pathname, settings.href)}
        />
      </div>
    </nav>
  );
}
