import { createSplitwiseClient } from "@/lib/splitwise/client";
import type { SplitwiseCurrentUserResponse } from "@/lib/splitwise/types";

export async function getCurrentUser(
  accessToken: string,
): Promise<SplitwiseCurrentUserResponse> {
  const client = createSplitwiseClient(accessToken);
  return client.get<SplitwiseCurrentUserResponse>("get_current_user");
}
