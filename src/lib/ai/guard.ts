import "server-only";

import { isAiAvailable } from "@/lib/ai/availability";
import { aiErrorResponse } from "@/lib/http-errors";
import { isFakeDataRequest } from "@/lib/demo/session";
import { isDatabaseConfigured } from "@/lib/db";
import { getAuthenticatedAccountOwner } from "@/lib/db/account";
import { NextResponse } from "next/server";

export type RequireAiAccountResult =
  | { error: NextResponse; owner?: undefined }
  | {
      error?: undefined;
      owner: NonNullable<
        Awaited<ReturnType<typeof getAuthenticatedAccountOwner>>
      >;
    };

export async function requireAiAccount(): Promise<RequireAiAccountResult> {
  if (!isDatabaseConfigured()) {
    return {
      error: NextResponse.json(
        { error: "database_not_configured" },
        { status: 503 },
      ),
    };
  }

  if (await isFakeDataRequest()) {
    return {
      error: NextResponse.json({ error: "ai_disabled" }, { status: 403 }),
    };
  }

  const owner = await getAuthenticatedAccountOwner();
  if (!owner) {
    return {
      error: NextResponse.json({ error: "not_connected" }, { status: 401 }),
    };
  }

  const available = await isAiAvailable(owner.id);
  if (!available) {
    return {
      error: NextResponse.json({ error: "ai_disabled" }, { status: 403 }),
    };
  }

  return { owner };
}

export { aiErrorResponse };
