import "server-only";

import { isAiAvailable } from "@/lib/ai/availability";
import { AiError } from "@/lib/ai/types";
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

export function aiErrorResponse(err: unknown) {
  if (err instanceof AiError) {
    const status =
      err.code === "ai_disabled"
        ? 403
        : err.code === "ai_misconfigured"
          ? 503
          : 502;
    return NextResponse.json(
      { error: err.code, message: err.message },
      { status },
    );
  }
  const message = err instanceof Error ? err.message : "ai_error";
  return NextResponse.json({ error: "ai_error", message }, { status: 502 });
}
