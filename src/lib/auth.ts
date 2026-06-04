import { getCurrentUser } from "@/lib/splitwise/api";
import { getAppSession } from "@/lib/session";

export async function getAccessToken(): Promise<string | null> {
  const session = await getAppSession();
  return session.accessToken ?? null;
}

export async function requireAccessToken(): Promise<string> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error("Not connected to Splitwise");
  }
  return token;
}

export async function getConnectedUser() {
  const token = await getAccessToken();
  if (!token) return null;
  try {
    const { user } = await getCurrentUser(token);
    return user;
  } catch {
    return null;
  }
}
