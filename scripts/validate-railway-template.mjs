#!/usr/bin/env node
/**
 * Validates deploy/railway-template.json (reference spec for the visual composer).
 * Railway has no JSON paste — use project snapshot or manual composer (docs/railway-template.md).
 * Usage: node scripts/validate-railway-template.mjs
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const templatePath = join(root, "deploy", "railway-template.json");

const raw = JSON.parse(readFileSync(templatePath, "utf8"));
const errors = [];

if (!raw.name?.trim()) errors.push("missing top-level name");
if (!raw.code?.trim()) errors.push("missing top-level code");
if (!raw.serializedConfig?.services) {
  errors.push("missing serializedConfig.services");
}

const services = raw.serializedConfig?.services ?? {};
const entries = Object.entries(services);

if (entries.length !== 3) {
  errors.push(`expected 3 services, got ${entries.length}`);
}

const byName = Object.fromEntries(
  entries.map(([, svc]) => [svc.name, svc]),
);

const postgres = byName.Postgres;
const app = byName["open-splitwise"];
const tunnel = byName.cloudflared;

if (!postgres) errors.push('missing "Postgres" service');
if (!app) errors.push('missing "open-splitwise" service');
if (!tunnel) errors.push('missing "cloudflared" service');

if (postgres) {
  if (postgres.source?.image !== "ghcr.io/railwayapp-templates/postgres-ssl:18") {
    errors.push("Postgres image should be ghcr.io/railwayapp-templates/postgres-ssl:18");
  }
  if (!postgres.deploy?.requiredMountPath) {
    errors.push("Postgres deploy.requiredMountPath is required");
  }
  if (!postgres.variables?.POSTGRES_PASSWORD?.defaultValue?.includes("secret(")) {
    errors.push("Postgres POSTGRES_PASSWORD should use secret()");
  }
}

if (app) {
  if (app.source?.repo !== "ankitchouhan1020/open-splitwise") {
    errors.push("open-splitwise repo should be ankitchouhan1020/open-splitwise");
  }
  const requiredVars = [
    "DATABASE_URL",
    "SESSION_SECRET",
    "APP_URL",
    "SPLITWISE_REDIRECT_URI",
    "SPLITWISE_CLIENT_ID",
    "SPLITWISE_CLIENT_SECRET",
    "PORT",
    "HOSTNAME",
    "NODE_ENV",
  ];
  for (const key of requiredVars) {
    if (!app.variables?.[key]) errors.push(`open-splitwise missing variable ${key}`);
  }
  if (app.variables?.DATABASE_URL?.defaultValue !== "${{Postgres.DATABASE_URL}}") {
    errors.push("DATABASE_URL must reference ${{Postgres.DATABASE_URL}}");
  }
  if (!app.variables?.SESSION_SECRET?.defaultValue?.includes("secret(")) {
    errors.push("SESSION_SECRET should use secret()");
  }
  const domain = app.networking?.serviceDomains?.["<hasDomain>:3000"];
  if (!domain || domain.port !== 3000) {
    errors.push('open-splitwise needs networking.serviceDomains["<hasDomain>:3000"].port = 3000');
  }
}

if (tunnel) {
  if (tunnel.source?.repo !== "ankitchouhan1020/open-splitwise") {
    errors.push("cloudflared repo should be ankitchouhan1020/open-splitwise");
  }
  if (tunnel.source?.rootDirectory !== "deploy/cloudflared") {
    errors.push('cloudflared rootDirectory should be "deploy/cloudflared"');
  }
  if (!tunnel.variables?.TUNNEL_TOKEN) {
    errors.push("cloudflared missing TUNNEL_TOKEN variable");
  }
  const domains = tunnel.networking?.serviceDomains ?? {};
  if (Object.keys(domains).length > 0) {
    errors.push("cloudflared must not have a public Railway domain");
  }
}

if (errors.length > 0) {
  console.error("Railway template validation failed:\n");
  for (const err of errors) console.error(`  - ${err}`);
  process.exit(1);
}

console.log(`OK: ${raw.name} (${raw.code}) — ${entries.length} services`);
for (const [, svc] of entries) {
  const vars = Object.keys(svc.variables ?? {}).length;
  console.log(`  - ${svc.name}: ${vars} variables`);
}
