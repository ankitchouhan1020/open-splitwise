import { DEMO_MODE_COPY, type DemoModeFeature } from "@/lib/demo/copy";

type Props = {
  feature: DemoModeFeature;
  className?: string;
};

export function DemoModeNotice({ feature, className = "" }: Props) {
  return (
    <p className={`text-muted text-xs leading-relaxed ${className}`.trim()}>
      {DEMO_MODE_COPY[feature]}
    </p>
  );
}
