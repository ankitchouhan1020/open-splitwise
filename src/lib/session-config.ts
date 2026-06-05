import type { SessionOptions } from "iron-session";

export type AppSession = {
  accessToken?: string;
  splitwiseUserId?: number;
  oauthState?: string;
  /** When true, read APIs return fictional sample data (OAuth may stay connected). */
  fakeData?: boolean;
};

export const SESSION_COOKIE = "open_splitwise_session";

export function getIronSessionOptions(): SessionOptions {
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

export function sessionHasAccessToken(session: AppSession): boolean {
  return Boolean(session.accessToken);
}

/** Session allows read access (OAuth or guest sample-data browse). */
export function sessionIsActive(session: AppSession): boolean {
  if (sessionHasAccessToken(session)) return true;
  if (session.fakeData) {
    return process.env.DEMO_MODE === "true" || process.env.DEMO_MODE === "1";
  }
  return false;
}

export function sessionShowsFakeData(session: AppSession): boolean {
  return Boolean(session.fakeData);
}
