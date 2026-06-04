import "server-only";

import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { getIronSessionOptions, type AppSession } from "@/lib/session-config";

export type { AppSession } from "@/lib/session-config";
export {
  SESSION_COOKIE,
  getIronSessionOptions,
  sessionHasAccessToken,
} from "@/lib/session-config";

export async function getAppSession() {
  return getIronSession<AppSession>(await cookies(), getIronSessionOptions());
}

export async function clearAppSession() {
  const session = await getAppSession();
  session.accessToken = undefined;
  session.splitwiseUserId = undefined;
  session.oauthState = undefined;
  await session.destroy();
}
