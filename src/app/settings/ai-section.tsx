"use client";

import {
  SettingsAlert,
  SettingsBlock,
  SettingsDangerZone,
  SettingsRow,
  SettingsSection,
  SettingsSwitch,
  StatusBadge,
  settingsControlClass,
  settingsFieldClass,
} from "@/app/settings/settings-ui";
import { AI_PROVIDERS, defaultModelForProvider } from "@/lib/ai/providers";
import type { AiProvider, AiSettingsPublic } from "@/lib/ai/types";
import { fetchJson } from "@/lib/query/fetch-json";
import { useAiModels } from "@/lib/query/hooks";
import { queryKeys } from "@/lib/query/keys";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

type Props = {
  bare?: boolean;
  dbConfigured: boolean;
  connected: boolean;
};

const PROVIDER_OPTIONS = (
  Object.entries(AI_PROVIDERS) as Array<
    [AiProvider, (typeof AI_PROVIDERS)[AiProvider]]
  >
).map(([id, def]) => ({ id, label: def.label }));

export function AiSection({ bare = false, dbConfigured, connected }: Props) {
  const qc = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [enabled, setEnabled] = useState(false);
  const [provider, setProvider] = useState<AiProvider>("openai");
  const [baseUrl, setBaseUrl] = useState("");
  const [savedSnapshot, setSavedSnapshot] = useState<AiSettingsPublic | null>(
    null,
  );
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(defaultModelForProvider("openai"));

  const applySettings = useCallback((data: AiSettingsPublic) => {
    setEnabled(data.enabled);
    setProvider(data.provider);
    setBaseUrl(data.baseUrl ?? "");
    setSavedSnapshot(data);
    setModel(data.model);
  }, []);

  const loadSettings = useCallback(async () => {
    if (!dbConfigured || !connected) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJson<AiSettingsPublic>("/api/ai/settings");
      applySettings(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load AI settings",
      );
    } finally {
      setLoading(false);
    }
  }, [applySettings, connected, dbConfigured]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  function handleProviderChange(next: AiProvider) {
    setProvider(next);
    if (next !== "custom") setBaseUrl("");
    setApiKey("");
    setModel(
      savedSnapshot?.provider === next
        ? savedSnapshot.model
        : defaultModelForProvider(next),
    );
    if (savedSnapshot && next !== savedSnapshot.provider) {
      setEnabled(false);
    } else if (savedSnapshot) {
      setEnabled(savedSnapshot.enabled);
    }
  }

  async function saveSettings() {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const key = apiKey.trim();
      const body: Record<string, unknown> = {
        enabled,
        provider,
        model,
        baseUrl: provider === "custom" ? baseUrl.trim() || null : null,
      };
      if (key) body.apiKey = key;

      const data = await fetchJson<AiSettingsPublic>("/api/ai/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      applySettings(data);
      setApiKey("");
      await qc.invalidateQueries({ queryKey: queryKeys.ai.status() });
      await qc.invalidateQueries({ queryKey: queryKeys.ai.settings() });
      await qc.invalidateQueries({
        queryKey: queryKeys.ai.models(provider, "saved"),
      });

      setNotice("Settings saved.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save AI settings",
      );
    } finally {
      setSaving(false);
    }
  }

  async function clearSavedKey() {
    if (
      !window.confirm(
        "Remove your saved API key? AI features will turn off until you add a new one.",
      )
    ) {
      return;
    }

    setClearing(true);
    setError(null);
    setNotice(null);
    try {
      const data = await fetchJson<AiSettingsPublic>("/api/ai/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clearApiKey: true }),
      });

      applySettings(data);
      setEnabled(false);
      setApiKey("");
      setNotice("API key removed.");
      await qc.invalidateQueries({ queryKey: queryKeys.ai.status() });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove API key");
    } finally {
      setClearing(false);
    }
  }

  const disabled = !dbConfigured || !connected;
  const providerDef = AI_PROVIDERS[provider];
  const savedProvider = savedSnapshot?.provider;
  const savedProviderDef = savedProvider
    ? AI_PROVIDERS[savedProvider]
    : providerDef;
  const keyForSelectedProvider =
    savedSnapshot?.hasKey && savedSnapshot.provider === provider
      ? savedSnapshot
      : null;
  const hasKeyForProvider = Boolean(keyForSelectedProvider);
  const providerChangedInForm =
    Boolean(savedSnapshot?.hasKey) && savedSnapshot!.provider !== provider;
  const canEnable = hasKeyForProvider || Boolean(apiKey.trim());
  const aiActive = Boolean(savedSnapshot?.enabled && savedSnapshot?.hasKey);
  const canFetchModels =
    !disabled &&
    !loading &&
    (hasKeyForProvider || Boolean(apiKey.trim())) &&
    (provider !== "custom" || Boolean(baseUrl.trim()));

  const {
    data: modelsData,
    isLoading: modelsLoading,
    isError: modelsError,
  } = useAiModels({
    provider,
    baseUrl: provider === "custom" ? baseUrl : null,
    draftApiKey: apiKey,
    enabled: canFetchModels,
  });

  const modelOptions = useMemo(() => {
    const fromApi = modelsData?.models ?? [];
    const ids = new Set(fromApi.map((m) => m.id));
    if (model && !ids.has(model)) {
      return [{ id: model, label: model }, ...fromApi];
    }
    return fromApi.length > 0
      ? fromApi
      : [{ id: providerDef.defaultModel, label: providerDef.defaultModel }];
  }, [model, modelsData?.models, providerDef.defaultModel]);

  const apiKeyDescription = (() => {
    if (providerChangedInForm) {
      return `Key on file is for ${savedProviderDef.label}. Paste a ${providerDef.label} key to switch.`;
    }
    if (hasKeyForProvider) {
      const preview = keyForSelectedProvider?.keyPreview;
      return preview
        ? `Saved as ${preview}. Leave blank to keep it, or paste a new key to replace.`
        : "A key is saved. Leave blank to keep it, or paste a new key to replace.";
    }
    return `Encrypted on this server. Format: ${providerDef.keyHint}`;
  })();

  const hasUnsavedChanges =
    !disabled &&
    (!savedSnapshot ||
      enabled !== savedSnapshot.enabled ||
      provider !== savedSnapshot.provider ||
      model !== savedSnapshot.model ||
      (provider === "custom" &&
        baseUrl.trim() !== (savedSnapshot.baseUrl ?? "")) ||
      Boolean(apiKey.trim()));

  const statusBadge = (() => {
    if (disabled) return { tone: "neutral" as const, label: "Unavailable" };
    if (aiActive) return { tone: "ok" as const, label: "Active" };
    if (savedSnapshot?.enabled && !savedSnapshot.hasKey) {
      return { tone: "warn" as const, label: "Needs key" };
    }
    return { tone: "neutral" as const, label: "Off" };
  })();

  const content = (
    <div className="space-y-4">
      {disabled && (
        <SettingsAlert tone="info">
          Connect Splitwise and configure a database to use AI features.
        </SettingsAlert>
      )}

      {error && <SettingsAlert tone="error">{error}</SettingsAlert>}
      {notice && <SettingsAlert tone="success">{notice}</SettingsAlert>}

      <SettingsBlock
        title="Bring your own key"
        description="Optional smart filters and Home summaries via your LLM account. Keys are encrypted on this server."
        action={
          !disabled ? (
            <button
              type="button"
              disabled={loading || saving || clearing || !hasUnsavedChanges}
              onClick={() => void saveSettings()}
              className={hasUnsavedChanges ? btnSavePrimary : btnSaveSecondary}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          ) : null
        }
      >
        <SettingsRow
          label="Enable AI"
          description="Off by default. Requires a saved API key for the selected provider."
        >
          <div className={`${settingsControlClass} flex justify-end`}>
            <SettingsSwitch
              checked={enabled}
              disabled={disabled || loading || saving || !canEnable}
              onCheckedChange={setEnabled}
              aria-label="Enable AI"
            />
          </div>
        </SettingsRow>

        <SettingsRow label="Provider" description="Who bills your AI requests.">
          <select
            value={provider}
            disabled={disabled || loading}
            onChange={(e) => handleProviderChange(e.target.value as AiProvider)}
            className={settingsFieldClass}
          >
            {PROVIDER_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </SettingsRow>

        <SettingsRow
          label="Model"
          description={
            canFetchModels
              ? modelsLoading
                ? "Loading models from your provider…"
                : modelsError
                  ? "Could not load models. Using default from config."
                  : "Saved with your other AI settings. Click Save after changing."
              : "Save an API key to load models from your provider."
          }
        >
          <select
            value={model}
            disabled={disabled || loading || modelsLoading || !canFetchModels}
            onChange={(e) => setModel(e.target.value)}
            className={settingsFieldClass}
          >
            {modelOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </SettingsRow>

        {provider === "custom" && (
          <SettingsRow
            label="Base URL"
            description="OpenAI-compatible API root."
          >
            <input
              type="url"
              value={baseUrl}
              disabled={disabled || loading}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.example.com/v1"
              className={settingsFieldClass}
            />
          </SettingsRow>
        )}

        <SettingsRow label="API key" description={apiKeyDescription}>
          <input
            type="password"
            value={apiKey}
            disabled={disabled || loading || saving}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={
              hasKeyForProvider ? "New key (optional)" : providerDef.keyHint
            }
            autoComplete="off"
            className={settingsFieldClass}
          />
        </SettingsRow>
      </SettingsBlock>

      {hasKeyForProvider && !disabled && (
        <SettingsDangerZone description="Removes the encrypted key from this server and turns AI off.">
          <SettingsRow
            label="Remove API key"
            description={
              keyForSelectedProvider?.keyPreview
                ? `Currently saved: ${keyForSelectedProvider.keyPreview}`
                : "Delete the stored key for this provider."
            }
          >
            <button
              type="button"
              disabled={loading || clearing || saving}
              onClick={() => void clearSavedKey()}
              className="border-error-border text-error-text hover:bg-error-bg rounded-lg border px-3 py-1.5 text-sm font-medium disabled:opacity-50"
            >
              {clearing ? "Removing…" : "Remove key"}
            </button>
          </SettingsRow>
        </SettingsDangerZone>
      )}
    </div>
  );

  if (bare) return content;

  return (
    <SettingsSection
      title="AI"
      action={
        <StatusBadge tone={statusBadge.tone}>{statusBadge.label}</StatusBadge>
      }
    >
      {content}
    </SettingsSection>
  );
}

const btnSavePrimary =
  "bg-accent text-accent-foreground shrink-0 rounded-md px-3 py-1.5 text-sm font-medium hover:opacity-90 disabled:opacity-50";
const btnSaveSecondary =
  "border-border text-foreground hover:bg-hover shrink-0 rounded-md border bg-card px-3 py-1.5 text-sm font-medium disabled:opacity-50";
