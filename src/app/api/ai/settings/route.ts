import { validateAiEnablement } from "@/lib/ai/availability";
import { isFakeDataRequest } from "@/lib/demo/session";
import {
  DEFAULT_AI_PROVIDER,
  defaultModelForProvider,
} from "@/lib/ai/providers";
import {
  getAiSettingsForAccount,
  getAiSettingsRecord,
  upsertAiSettings,
} from "@/lib/ai/settings";
import { upsertAiSettingsBodySchema } from "@/lib/ai/schema";
import { isDatabaseConfigured } from "@/lib/db";
import { getAuthenticatedAccountOwner } from "@/lib/db/account";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  if (await isFakeDataRequest()) {
    return NextResponse.json({
      enabled: false,
      provider: DEFAULT_AI_PROVIDER,
      model: defaultModelForProvider(DEFAULT_AI_PROVIDER),
      baseUrl: null,
      hasKey: false,
      keyPreview: null,
    });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "database_not_configured" },
      { status: 503 },
    );
  }

  const owner = await getAuthenticatedAccountOwner();
  if (!owner) {
    return NextResponse.json({ error: "not_connected" }, { status: 401 });
  }

  const settings = await getAiSettingsForAccount(owner.id);
  return NextResponse.json(settings);
}

export async function POST(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "database_not_configured" },
      { status: 503 },
    );
  }

  const owner = await getAuthenticatedAccountOwner();
  if (!owner) {
    return NextResponse.json({ error: "not_connected" }, { status: 401 });
  }

  const body = upsertAiSettingsBodySchema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const existing = await getAiSettingsRecord(owner.id);
  const provider =
    body.data.provider ?? existing?.provider ?? DEFAULT_AI_PROVIDER;
  const providerChanged =
    existing &&
    body.data.provider !== undefined &&
    body.data.provider !== existing.provider;
  const enabled = body.data.enabled ?? existing?.enabled ?? false;
  const baseUrl =
    body.data.baseUrl !== undefined
      ? body.data.baseUrl
      : (existing?.baseUrl ?? null);
  const willHaveKey = body.data.clearApiKey
    ? false
    : body.data.apiKey !== undefined
      ? Boolean(body.data.apiKey.trim())
      : providerChanged
        ? false
        : Boolean(existing?.encryptedApiKey);

  const enablement = validateAiEnablement({
    enabled,
    provider,
    baseUrl,
    hasEncryptedKey: willHaveKey,
  });
  if (!enablement.ok) {
    return NextResponse.json({ error: enablement.error }, { status: 400 });
  }

  const settings = await upsertAiSettings(owner.id, body.data);
  return NextResponse.json(settings);
}

/** Partial update — same semantics as POST. */
export async function PATCH(request: NextRequest) {
  return POST(request);
}
