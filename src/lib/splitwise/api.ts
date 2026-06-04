import { SPLITWISE_API_BASE } from "@/lib/splitwise/constants";
import type { SplitwiseCurrentUserResponse } from "@/lib/splitwise/types";

export async function getCurrentUser(
  accessToken: string,
): Promise<SplitwiseCurrentUserResponse> {
  const res = await fetch(`${SPLITWISE_API_BASE}/get_current_user`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Splitwise get_current_user failed (${res.status}): ${text.slice(0, 200)}`,
    );
  }

  return res.json() as Promise<SplitwiseCurrentUserResponse>;
}
