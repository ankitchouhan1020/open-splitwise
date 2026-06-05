#!/usr/bin/env node
/**
 * Push Worker secrets from .env.local for production deploy.
 * Usage: APP_URL=https://split.example.com pnpm cf:set-secrets
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const envLocalPath = resolve(root, ".env.local");

if (!existsSync(envLocalPath)) {
  console.error("Missing .env.local");
  process.exit(1);
}

const env = {};
for (const line of readFileSync(envLocalPath, "utf8").split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq).trim();
  let value = trimmed.slice(eq + 1).trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  env[key] = value;
}

const appUrl = (process.env.APP_URL ?? env.APP_URL ?? "").replace(/\/$/, "");
if (!appUrl.startsWith("https://")) {
  console.error("Set APP_URL=https://your-host (env or .env.local)");
  process.exit(1);
}

const redirectUri = `${appUrl}/api/auth/splitwise/callback`;
const secrets = {
  SESSION_SECRET: env.SESSION_SECRET,
  SPLITWISE_CLIENT_ID: env.SPLITWISE_CLIENT_ID,
  SPLITWISE_CLIENT_SECRET: env.SPLITWISE_CLIENT_SECRET,
  APP_URL: appUrl,
  NEXT_PUBLIC_APP_URL: appUrl,
  SPLITWISE_REDIRECT_URI: redirectUri,
};

const missing = Object.entries(secrets)
  .filter(([, v]) => !v?.trim())
  .map(([k]) => k);
if (missing.length > 0) {
  console.error(`Missing in .env.local: ${missing.join(", ")}`);
  process.exit(1);
}

console.log(`Setting secrets for ${appUrl}…`);

for (const [key, value] of Object.entries(secrets)) {
  const result = spawnSync(
    "pnpm",
    ["wrangler", "secret", "put", key],
    {
      cwd: root,
      input: value,
      stdio: ["pipe", "inherit", "inherit"],
      env: {
        ...process.env,
        CLOUDFLARE_API_TOKEN: env.CLOUDFLARE_API_TOKEN ?? process.env.CLOUDFLARE_API_TOKEN,
        CLOUDFLARE_ACCOUNT_ID: env.CLOUDFLARE_ACCOUNT_ID ?? process.env.CLOUDFLARE_ACCOUNT_ID,
      },
    },
  );
  if (result.status !== 0) {
    console.error(`Failed: wrangler secret put ${key}`);
    process.exit(result.status ?? 1);
  }
}

console.log("Done. Add this Splitwise redirect URI if needed:");
console.log(`  ${redirectUri}`);
