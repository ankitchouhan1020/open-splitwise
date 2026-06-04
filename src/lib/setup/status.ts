import { getSuggestedRedirectUri, resolvePublicAppUrl } from "@/lib/app-url";
import { isDatabaseConfigured } from "@/lib/db/config";
import {
  readConfiguredRedirectUri,
  resolveSplitwiseRedirectUri,
} from "@/lib/splitwise/redirect-uri";

export { getSuggestedRedirectUri, resolveAppUrl, resolvePublicAppUrl } from "@/lib/app-url";

export type EnvVarKey =
  | "SESSION_SECRET"
  | "SPLITWISE_CLIENT_ID"
  | "SPLITWISE_CLIENT_SECRET"
  | "SPLITWISE_REDIRECT_URI"
  | "DATABASE_URL";

export type EnvVarStatus = {
  key: EnvVarKey;
  label: string;
  configured: boolean;
  hint: string;
};

export type SetupStep = {
  id: string;
  title: string;
  done: boolean;
};

export type SetupStatus = {
  oauthConfigured: boolean;
  dbConfigured: boolean;
  appUrl: string;
  redirectUri: string;
  suggestedRedirectUri: string;
  redirectUriMismatch: boolean;
  envVars: EnvVarStatus[];
  envSnippet: string;
  steps: SetupStep[];
};

const ENV_VAR_META: Array<{
  key: EnvVarKey;
  label: string;
  hint: string;
  example: string;
}> = [
  {
    key: "SESSION_SECRET",
    label: "Session secret",
    hint: "Min 32 characters. Generate with: openssl rand -base64 32",
    example: "SESSION_SECRET=",
  },
  {
    key: "SPLITWISE_CLIENT_ID",
    label: "Splitwise client ID",
    hint: "From your app at secure.splitwise.com/apps",
    example: "SPLITWISE_CLIENT_ID=",
  },
  {
    key: "SPLITWISE_CLIENT_SECRET",
    label: "Splitwise client secret",
    hint: "Keep this server-side only — never commit to git",
    example: "SPLITWISE_CLIENT_SECRET=",
  },
  {
    key: "SPLITWISE_REDIRECT_URI",
    label: "OAuth redirect URI",
    hint: "Must match exactly in your Splitwise app settings",
    example: "SPLITWISE_REDIRECT_URI=",
  },
  {
    key: "DATABASE_URL",
    label: "Postgres URL",
    hint: "Required for search, insights, and sync",
    example:
      "DATABASE_URL=postgresql://open_splitwise:open_splitwise@localhost:5432/open_splitwise",
  },
];

/** Never embed live credentials in the copyable setup snippet. */
const SNIPPET_MASK_WHEN_CONFIGURED = new Set<EnvVarKey>([
  "SESSION_SECRET",
  "SPLITWISE_CLIENT_ID",
  "SPLITWISE_CLIENT_SECRET",
  "DATABASE_URL",
]);

function envSnippetLine(
  key: EnvVarKey,
  example: string,
  configured: boolean,
  redirectUri: string,
  suggestedRedirectUri: string,
): string {
  if (key === "SPLITWISE_REDIRECT_URI") {
    return `${example}${configured ? redirectUri : suggestedRedirectUri}`;
  }
  if (configured && SNIPPET_MASK_WHEN_CONFIGURED.has(key)) {
    const prefix = `${key}=`;
    if (key === "SESSION_SECRET") {
      return `${prefix}<set — generate with: openssl rand -base64 32>`;
    }
    return `${prefix}<set>`;
  }
  if (key === "SESSION_SECRET") {
    return `${example}<openssl rand -base64 32>`;
  }
  if (key === "DATABASE_URL") {
    return example;
  }
  return example;
}

function isEnvVarConfigured(key: EnvVarKey): boolean {
  const raw = process.env[key];
  if (!raw?.trim()) return false;
  if (key === "SESSION_SECRET") return raw.length >= 32;
  if (key === "SPLITWISE_REDIRECT_URI") {
    try {
      new URL(raw);
      return true;
    } catch {
      return false;
    }
  }
  return true;
}

export function getSetupStatus(requestOrigin: string): SetupStatus {
  const appUrl = resolvePublicAppUrl(requestOrigin);
  const suggestedRedirectUri = getSuggestedRedirectUri(appUrl);
  const configuredRedirect = readConfiguredRedirectUri();
  const redirectUri = resolveSplitwiseRedirectUri(requestOrigin);

  const envVars: EnvVarStatus[] = ENV_VAR_META.map(({ key, label, hint }) => ({
    key,
    label,
    configured: isEnvVarConfigured(key),
    hint,
  }));

  const oauthVars = envVars.filter((v) => v.key !== "DATABASE_URL");
  const oauthConfigured = oauthVars.every((v) => v.configured);
  const dbConfigured = isDatabaseConfigured();

  let redirectUriMismatch = false;
  if (configuredRedirect) {
    try {
      redirectUriMismatch =
        new URL(configuredRedirect).href !== new URL(suggestedRedirectUri).href;
    } catch {
      redirectUriMismatch = false;
    }
  }

  const envSnippet = [
    "# Paste into .env.local (adjust values as needed)",
    `APP_URL=${appUrl}`,
    `NEXT_PUBLIC_APP_URL=${appUrl}`,
    ...ENV_VAR_META.map(({ key, example }) =>
      envSnippetLine(
        key,
        example,
        isEnvVarConfigured(key),
        redirectUri,
        suggestedRedirectUri,
      ),
    ),
  ].join("\n");

  const steps: SetupStep[] = [
    {
      id: "splitwise-app",
      title: "Create a Splitwise OAuth app",
      done:
        isEnvVarConfigured("SPLITWISE_CLIENT_ID") &&
        isEnvVarConfigured("SPLITWISE_CLIENT_SECRET"),
    },
    {
      id: "redirect-uri",
      title: "Set the redirect URI in Splitwise",
      done: isEnvVarConfigured("SPLITWISE_REDIRECT_URI"),
    },
    {
      id: "env-vars",
      title: "Configure server environment",
      done: oauthConfigured && dbConfigured,
    },
    {
      id: "migrate",
      title: "Run database migrations",
      done: dbConfigured,
    },
  ];

  return {
    oauthConfigured,
    dbConfigured,
    appUrl,
    redirectUri,
    suggestedRedirectUri,
    redirectUriMismatch,
    envVars,
    envSnippet,
    steps,
  };
}
