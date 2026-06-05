#!/usr/bin/env node
/**
 * Create or update Cloudflare Access bypass apps for Splitwise OAuth paths.
 *
 * Env:
 *   CLOUDFLARE_API_TOKEN  — API token with Access: Apps and Policies (Edit)
 *   CLOUDFLARE_ACCOUNT_ID — Cloudflare account ID (or pass --account-id)
 *   APP_HOST              — public hostname (or derived from APP_URL)
 *
 * Usage:
 *   node scripts/cloudflare-access-oauth-bypass.mjs
 *   node scripts/cloudflare-access-oauth-bypass.mjs --verify
 *   node scripts/cloudflare-access-oauth-bypass.mjs --dry-run
 */
import "./load-env.mjs";

const OAUTH_APPS = [
  {
    name: "open-splitwise OAuth start",
    path: "/api/auth/splitwise*",
  },
  {
    name: "open-splitwise OAuth callback",
    path: "/api/auth/splitwise/callback",
  },
];

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const verify = args.has("--verify");
const accountIdArg = (() => {
  const i = process.argv.indexOf("--account-id");
  return i >= 0 ? process.argv[i + 1] : undefined;
})();

function usage(msg) {
  if (msg) console.error(msg);
  console.error(`
Usage: node scripts/cloudflare-access-oauth-bypass.mjs [--verify] [--dry-run] [--account-id <id>]

Required env:
  CLOUDFLARE_API_TOKEN
  CLOUDFLARE_ACCOUNT_ID  (or --account-id)
  APP_HOST or APP_URL    (hostname only, e.g. split.example.com)

Create a token: Cloudflare dashboard → My Profile → API Tokens → Create Token
  → "Edit Cloudflare Zero Trust" template, or custom with:
     Account | Access: Apps and Policies | Edit
     Account | Account Settings        | Read
`);
  process.exit(1);
}

function hostFromAppUrl(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

const token = process.env.CLOUDFLARE_API_TOKEN;
const accountId = accountIdArg ?? process.env.CLOUDFLARE_ACCOUNT_ID;
const appHost =
  process.env.APP_HOST?.trim() ||
  hostFromAppUrl(process.env.APP_URL) ||
  hostFromAppUrl(process.env.NEXT_PUBLIC_APP_URL);

if (!token) usage("Missing CLOUDFLARE_API_TOKEN");
if (!accountId) usage("Missing CLOUDFLARE_ACCOUNT_ID (or --account-id)");
if (!appHost) usage("Missing APP_HOST or APP_URL with a valid hostname");

const base = `https://api.cloudflare.com/client/v4/accounts/${accountId}`;

async function cf(method, path, body) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!data.success) {
    const detail = data.errors?.map((e) => e.message).join("; ") ?? res.statusText;
    throw new Error(`Cloudflare API ${method} ${path}: ${detail}`);
  }
  return data.result;
}

function publicUri(host, path) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${host}${normalized}`;
}

function appDestinations(app) {
  const uris = [];
  if (app.domain) uris.push(app.domain);
  for (const d of app.destinations ?? []) {
    if (d?.uri) uris.push(d.uri);
  }
  for (const d of app.self_hosted_domains ?? []) {
    uris.push(d);
  }
  if (app.domain && app.path) {
    uris.push(publicUri(app.domain, app.path));
  }
  return uris;
}

function matchesOAuthApp(existing, host, path) {
  const want = publicUri(host, path);
  const uris = appDestinations(existing);
  return uris.some((u) => u === want || u === `${host}${path}`);
}

function hasBypassPolicy(app) {
  return (app.policies ?? []).some((p) => p.decision === "bypass");
}

function buildAppPayload(name, host, path) {
  const uri = publicUri(host, path);
  return {
    name,
    type: "self_hosted",
    domain: uri,
    destinations: [{ type: "public", uri }],
    session_duration: "24h",
    policies: [
      {
        precedence: 1,
        decision: "bypass",
        name: "Bypass everyone (Splitwise OAuth)",
        include: [{ everyone: {} }],
      },
    ],
  };
}

async function listApps() {
  const apps = [];
  let page = 1;
  while (true) {
    const batch = await cf("GET", `/access/apps?page=${page}&per_page=50`);
    if (!Array.isArray(batch) || batch.length === 0) break;
    apps.push(...batch);
    if (batch.length < 50) break;
    page += 1;
  }
  return apps;
}

async function ensureBypassApp(existingApps, spec) {
  const existing = existingApps.find(
    (a) => a.name === spec.name || matchesOAuthApp(a, appHost, spec.path),
  );
  const payload = buildAppPayload(spec.name, appHost, spec.path);

  if (existing) {
    if (hasBypassPolicy(existing)) {
      console.log(`OK  ${spec.name} (already bypasses ${publicUri(appHost, spec.path)})`);
      return existing;
    }
    console.log(`UPDATE ${spec.name} — adding bypass policy`);
    if (dryRun) return existing;
    return cf("PUT", `/access/apps/${existing.id}`, payload);
  }

  console.log(`CREATE ${spec.name} → ${publicUri(appHost, spec.path)}`);
  if (dryRun) return null;
  return cf("POST", "/access/apps", payload);
}

async function verifyBypass() {
  const url = `https://${appHost}/api/auth/splitwise/config`;
  const res = await fetch(url, { redirect: "manual" });
  const location = res.headers.get("location") ?? "";
  if (res.status >= 300 && res.status < 400 && location.includes("cloudflareaccess.com")) {
    throw new Error(
      `${url} still redirects to Cloudflare Access (${res.status}). Bypass apps may need a minute to propagate.`,
    );
  }
  if (res.status === 502 || res.status === 503) {
    throw new Error(
      `${url} returned ${res.status} (tunnel/origin error, not Access). ` +
        `On Railway, cloudflared must reach your app on the same port Next.js listens on. ` +
        `Check cloudflared logs for "connection refused" — often Railway injects PORT=8080 while the tunnel points at :3000. ` +
        `Fix: set PORT=3000 on the app service, or change the tunnel origin to :8080.`,
    );
  }
  if (!res.ok) {
    throw new Error(`${url} returned ${res.status} (expected 200 JSON, not Access redirect)`);
  }
  const body = await res.json();
  if (typeof body !== "object" || body === null) {
    throw new Error(`${url} did not return JSON`);
  }
  console.log(`VERIFY OK ${url} → ${res.status} (public, no Access redirect)`);
}

async function main() {
  console.log(`Account: ${accountId}`);
  console.log(`Host:    ${appHost}`);
  if (dryRun) console.log("Dry run — no API writes");

  const existing = await listApps();
  for (const spec of OAUTH_APPS) {
    await ensureBypassApp(existing, spec);
  }

  if (verify) {
    await verifyBypass();
  } else {
    console.log(
      `\nNext: node scripts/cloudflare-access-oauth-bypass.mjs --verify\n` +
        `Or:   curl -sI https://${appHost}/api/auth/splitwise/config | head -1`,
    );
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
