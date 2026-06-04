import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export type AppSession = {
  accessToken?: string;
  splitwiseUserId?: number;
  oauthState?: string;
};

export const SESSION_COOKIE = "open_splitwise_session";

function sessionOptions(): SessionOptions {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be set (min 32 characters)");
  }
  return {
    password: secret,
    cookieName: SESSION_COOKIE,
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    },
  };
}

export async function getAppSession() {
  return getIronSession<AppSession>(await cookies(), sessionOptions());
}

export async function clearAppSession() {
  const session = await getAppSession();
  session.accessToken = undefined;
  session.splitwiseUserId = undefined;
  session.oauthState = undefined;
  await session.destroy();
}
