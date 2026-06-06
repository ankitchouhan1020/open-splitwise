import { aiErrorResponse } from "@/lib/ai/guard";
import { listProviderModels } from "@/lib/ai/models";
import {
  defaultModelForProvider,
  resolveProviderBaseUrl,
} from "@/lib/ai/providers";
import { listAiModelsBodySchema } from "@/lib/ai/schema";
import {
  getAiSettingsRecord,
  resolveModelsListCredentials,
} from "@/lib/ai/settings";
import { AiError } from "@/lib/ai/types";
import { isDatabaseConfigured } from "@/lib/db";
import { getAuthenticatedAccountOwner } from "@/lib/db/account";
import { NextRequest, NextResponse } from "next/server";

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

  const body = listAiModelsBodySchema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const record = await getAiSettingsRecord(owner.id);
  const baseUrl =
    body.data.baseUrl !== undefined
      ? body.data.baseUrl
      : (record?.baseUrl ?? null);

  const credentials = resolveModelsListCredentials({
    provider: body.data.provider,
    baseUrl,
    draftApiKey: body.data.apiKey,
    record,
  });

  if ("error" in credentials) {
    return NextResponse.json({ error: credentials.error }, { status: 400 });
  }

  try {
    const resolvedBaseUrl = resolveProviderBaseUrl(body.data.provider, baseUrl);
    const models = await listProviderModels({
      provider: body.data.provider,
      baseUrl: resolvedBaseUrl,
      apiKey: credentials.apiKey,
    });

    const defaultModel = defaultModelForProvider(body.data.provider);
    const ids = new Set(models.map((m) => m.id));
    if (!ids.has(defaultModel)) {
      models.unshift({ id: defaultModel, label: defaultModel });
    }

    return NextResponse.json({ models, defaultModel });
  } catch (err) {
    if (err instanceof AiError) {
      return aiErrorResponse(err);
    }
    return aiErrorResponse(err);
  }
}
