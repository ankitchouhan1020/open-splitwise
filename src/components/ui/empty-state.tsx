import { ui } from "@/lib/ui-classes";
import type { ReactNode } from "react";

type EmptyStateProps = {
  variant?: "dashed" | "plain";
  compact?: boolean;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  variant = "plain",
  compact = false,
  children,
  action,
  className = "",
}: EmptyStateProps) {
  if (variant === "dashed") {
    return (
      <div className={`${ui.emptyDashed} ${className}`.trim()}>{children}</div>
    );
  }

  const padding = compact ? "py-6" : "py-8";
  return (
    <div className={`${ui.emptyPlain} ${padding} ${className}`.trim()}>
      {children}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
