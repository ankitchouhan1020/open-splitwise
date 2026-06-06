type Props = {
  className?: string;
  title?: string;
};

const DIAMOND = "M16 7 25 16 16 25 7 16";
const FACET_SHADE = "M16 7 25 16 16 25 16 16";
const FACET_SLIT = "M11 10 21 22";

/** Faceted gem on accent tile — matches favicon / app icon. */
export function LogoMark({ className, title = "Open Splitwise" }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-label={title}
      className={className ?? "shrink-0"}
    >
      <rect width="32" height="32" rx="8" className="fill-accent" />
      <path d={DIAMOND} className="fill-accent-foreground" />
      <path d={FACET_SHADE} className="fill-accent" opacity={0.28} />
      <path
        d={FACET_SLIT}
        className="stroke-accent"
        strokeWidth={2.25}
        strokeLinecap="round"
      />
    </svg>
  );
}
