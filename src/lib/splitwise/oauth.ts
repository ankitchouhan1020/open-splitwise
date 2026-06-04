import { getEnv } from "@/lib/env";
import {
  SPLITWISE_OAUTH_AUTHORIZE,
  SPLITWISE_OAUTH_TOKEN,
} from "@/lib/splitwise/constants";
import type { SplitwiseTokenResponse } from "@/lib/splitwise/types";
import { randomBytes } from "crypto";

export function generateOAuthState(): string {
  return randomBytes(24).toString("hex");
}

export function buildAuthorizeUrl(state: string): string {
  const env = getEnv();
  const params = new URLSearchParams({
    client_id: env.SPLITWISE_CLIENT_ID,
    redirect_uri: env.SPLITWISE_REDIRECT_URI,
    response_type: "code",
    state,
  });
  return `${SPLITWISE_OAUTH_AUTHORIZE}?${params.toString()}`;
}

export async function exchangeCodeForToken(
  code: string,
): Promise<SplitwiseTokenResponse> {
  const env = getEnv();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: env.SPLITWISE_CLIENT_ID,
    client_secret: env.SPLITWISE_CLIENT_SECRET,
    redirect_uri: env.SPLITWISE_REDIRECT_URI,
  });

  const res = await fetch(SPLITWISE_OAUTH_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Splitwise token exchange failed (${res.status}): ${text.slice(0, 200)}`,
    );
  }

  return res.json() as Promise<SplitwiseTokenResponse>;
}
