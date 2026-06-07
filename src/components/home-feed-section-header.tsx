import { ui } from "@/lib/ui-classes";

type HomeFeedSectionHeaderProps = {
  label: string;
  /** Sentence-case summary lines instead of uppercase labels. */
  variant?: "label" | "summary";
};

export function HomeFeedSectionHeader({
  label,
  variant = "label",
}: HomeFeedSectionHeaderProps) {
  const textClass =
    variant === "summary"
      ? "text-muted text-xs font-semibold leading-snug tabular-nums"
      : "text-muted text-xs font-semibold tracking-wide uppercase";

  return (
    <div
      className={`${ui.listSectionHeader} px-3 sm:px-4`}
      role="heading"
      aria-level={3}
    >
      <p className={textClass}>{label}</p>
    </div>
  );
}
