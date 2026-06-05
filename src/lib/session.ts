import "server-only";

import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { getIronSessionOptions, type AppSession } from "@/lib/session-config";

export type { AppSession } from "@/lib/session-config";
export {
  SESSION_COOKIE,
  getIronSessionOptions,
  sessionHasAccessToken,
  sessionIsActive,
  sessionShowsFakeData,
} from "@/lib/session-config";

export async function getAppSession() {
  return getIronSession<AppSession>(await cookies(), getIronSessionOptions());
}

export async function clearAppSession() {
  const session = await getAppSession();
  session.accessToken = undefined;
  session.splitwiseUserId = undefined;
  session.oauthState = undefined;
  session.fakeData = undefined;
  await session.destroy();
}

/** Issue a new session cookie after OAuth (mitigates session fixation). */
export async function rotateAppSession(data: {
  accessToken: string;
  splitwiseUserId: number;
}): Promise<void> {
  const session = await getAppSession();
  await session.destroy();

  const fresh = await getAppSession();
  fresh.accessToken = data.accessToken;
  fresh.splitwiseUserId = data.splitwiseUserId;
  fresh.oauthState = undefined;
  fresh.fakeData = undefined;
  await fresh.save();
}
