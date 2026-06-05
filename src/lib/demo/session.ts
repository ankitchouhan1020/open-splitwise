import "server-only";

import { isGuestDemoAllowed } from "@/lib/demo/config";
import { isShowcaseMode } from "@/lib/deploy-mode";
import { getAppSession } from "@/lib/session";
import type { AppSession } from "@/lib/session-config";
import { sessionHasAccessToken } from "@/lib/session-config";

/** Session is showing fictional sample data instead of real synced values. */
export function sessionShowsFakeData(session: AppSession): boolean {
  return Boolean(session.fakeData);
}

/** Guest browse with sample data only (no Splitwise OAuth). */
export function sessionIsGuestDemo(session: AppSession): boolean {
  if (sessionHasAccessToken(session)) return false;
  if (isShowcaseMode()) return true;
  return sessionShowsFakeData(session) && isGuestDemoAllowed();
}

export async function isFakeDataRequest(): Promise<boolean> {
  if (isShowcaseMode()) return true;
  const session = await getAppSession();
  return sessionShowsFakeData(session);
}
