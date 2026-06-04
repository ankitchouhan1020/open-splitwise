export type NavLink = {
  href: string;
  label: string;
  shortLabel?: string;
};

export const NAV_LINKS: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/explore", label: "Explore" },
  { href: "/insights", label: "Insights", shortLabel: "Stats" },
  { href: "/settings", label: "Settings" },
];

export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function navPageTitle(pathname: string): string {
  const match = NAV_LINKS.find((link) => isNavActive(pathname, link.href));
  return match?.label ?? "Open Splitwise";
}
