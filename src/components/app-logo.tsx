import { LogoMark } from "@/components/logo-mark";

type Props = {
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
  showWordmark?: boolean;
};

export function AppLogo({
  className,
  markClassName,
  wordmarkClassName,
  showWordmark = true,
}: Props) {
  return (
    <span
      className={`inline-flex items-center gap-2 ${className ?? ""}`.trim()}
    >
      <LogoMark className={markClassName ?? "h-7 w-7 shrink-0"} />
      {showWordmark && (
        <span
          className={`text-foreground font-semibold tracking-tight ${wordmarkClassName ?? "text-[15px]"}`.trim()}
        >
          Open Splitwise
        </span>
      )}
    </span>
  );
}
