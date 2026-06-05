import { isShowcaseMode } from "@/lib/deploy-mode";

/** When true, visitors can browse sample data without Splitwise OAuth. */
export function isGuestDemoAllowed(): boolean {
  return (
    isShowcaseMode() ||
    process.env.DEMO_MODE === "true" ||
    process.env.DEMO_MODE === "1"
  );
}

/** @deprecated Use isGuestDemoAllowed */
export function isDemoModeEnabled(): boolean {
  return isGuestDemoAllowed();
}
