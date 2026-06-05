/** When true, visitors can start a guest demo from the home page. */
export function isGuestDemoAllowed(): boolean {
  return process.env.DEMO_MODE === "true" || process.env.DEMO_MODE === "1";
}

/** @deprecated Use isGuestDemoAllowed */
export function isDemoModeEnabled(): boolean {
  return isGuestDemoAllowed();
}
