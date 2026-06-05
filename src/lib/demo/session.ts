import "server-only";

import { isGuestDemoAllowed } from "@/lib/demo/config";
import { getAppSession } from "@/lib/session";
import type { AppSession } from "@/lib/session-config";

/** Session is showing fictional sample data instead of real synced values. */
export function sessionShowsFakeData(session: AppSession): boolean {
  return Boolean(session.fakeData);
}

/** Guest browse with sample data only (no Splitwise OAuth). */
export function sessionIsGuestDemo(session: AppSession): boolean {
  return (
    sessionShowsFakeData(session) &&
    !session.accessToken &&
    isGuestDemoAllowed()
  );
}

export async function isFakeDataRequest(): Promise<boolean> {
  const session = await getAppSession();
  return sessionShowsFakeData(session);
}
