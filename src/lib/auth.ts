import { sessionIsGuestDemo } from "@/lib/demo/session";
import { isShowcaseMode } from "@/lib/deploy-mode";
import { DEMO_USER } from "@/lib/demo/user";
import { createSplitwiseClient } from "@/lib/splitwise/client";
import { SplitwiseAuthError } from "@/lib/splitwise/errors";
import type { SplitwiseUser } from "@/lib/splitwise/types";
import { getAppSession } from "@/lib/session";

export async function getAccessToken(): Promise<string | null> {
  const session = await getAppSession();
  return session.accessToken ?? null;
}

export async function requireAccessToken(): Promise<string> {
  const token = await getAccessToken();
  if (!token) {
    throw new SplitwiseAuthError("Not connected to Splitwise");
  }
  return token;
}

export async function getSplitwiseClient() {
  const token = await requireAccessToken();
  return createSplitwiseClient(token);
}

export async function getConnectedUser(): Promise<SplitwiseUser | null> {
  if (isShowcaseMode()) return DEMO_USER;

  const session = await getAppSession();
  if (sessionIsGuestDemo(session)) return DEMO_USER;

  const token = session.accessToken;
  if (!token) return null;
  try {
    const client = createSplitwiseClient(token);
    const { user } = await client.get<{ user: SplitwiseUser }>(
      "get_current_user",
    );
    return user;
  } catch (err) {
    if (err instanceof SplitwiseAuthError) {
      return null;
    }
    throw err;
  }
}
