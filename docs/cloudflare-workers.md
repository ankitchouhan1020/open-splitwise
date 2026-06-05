# Deploy on Cloudflare Workers

Run open-splitwise on **Cloudflare Workers** (via [OpenNext](https://opennext.js.org/cloudflare)) with **Hyperdrive** and a **separate Neon Postgres** database. This path is independent of Railway/Docker — your existing deploy keeps working unchanged.

**Typical cost (personal use):** Workers Paid ($5/mo) + Neon Free ($0).

## How it differs from Railway + Tunnel

|                | Railway + Tunnel                   | Cloudflare Workers                        |
| -------------- | ---------------------------------- | ----------------------------------------- |
| App runtime    | Node.js container (Railway/Docker) | Cloudflare Worker (OpenNext)              |
| Database       | Railway or Docker Postgres         | **Separate Neon Postgres** via Hyperdrive |
| Public entry   | Cloudflare Tunnel → private origin | Worker hostname or custom domain          |
| Migrations     | Docker entrypoint on start         | Manual or CI before deploy                |
| Tunnel sidecar | Required                           | Not needed                                |

Both paths can run in parallel (different URLs, different databases). Data is **not** shared unless you migrate manually.

## Architecture

```mermaid
flowchart LR
  Browser --> Worker["Cloudflare Worker\nOpenNext + Next.js 15"]
  Worker --> HD[Hyperdrive]
  HD --> Neon[Neon Postgres]
  Worker --> SW[Splitwise API]
```

## Before you start

| Item                    | Notes                                                                                  |
| ----------------------- | -------------------------------------------------------------------------------------- |
| **Cloudflare account**  | Workers Paid plan ($5/mo minimum) — Free tier CPU limit (10ms) is too low for this app |
| **Neon account**        | [neon.com](https://neon.com) — Free tier is enough for personal use                    |
| **Splitwise OAuth app** | [secure.splitwise.com/apps](https://secure.splitwise.com/apps)                         |
| **Wrangler CLI**        | Installed via `pnpm install` (`wrangler` devDependency)                                |

Generate a session secret:

```bash
openssl rand -base64 32
```

---

## Step 1 — Create Neon Postgres

1. Create a **Neon Free** project.
2. Copy the **direct** Postgres connection string (not pooled, for Hyperdrive setup).
3. Run migrations against Neon **once**:

```bash
DATABASE_URL="postgresql://..." pnpm db:migrate
```

---

## Step 2 — Create Hyperdrive

Replace the connection string with your Neon URL:

```bash
pnpm wrangler hyperdrive create open-splitwise-neon \
  --connection-string="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
```

Copy the Hyperdrive **ID** from the output.

Edit [`wrangler.jsonc`](../wrangler.jsonc) and replace `<HYPERDRIVE_ID>` with your ID:

```jsonc
"hyperdrive": [
  {
    "binding": "HYPERDRIVE",
    "id": "your-hyperdrive-id-here"
  }
]
```

Optional — local preview without Hyperdrive: add `localConnectionString` to the same block (see [Hyperdrive local dev](https://developers.cloudflare.com/hyperdrive/configuration/local-development/)).

---

## Step 3 — Set Worker secrets

```bash
pnpm wrangler secret put SESSION_SECRET
pnpm wrangler secret put SPLITWISE_CLIENT_ID
pnpm wrangler secret put SPLITWISE_CLIENT_SECRET
pnpm wrangler secret put APP_URL
pnpm wrangler secret put SPLITWISE_REDIRECT_URI
pnpm wrangler secret put NEXT_PUBLIC_APP_URL
```

Use your public Worker URL or custom domain, e.g.:

- `APP_URL` → `https://split.example.com`
- `SPLITWISE_REDIRECT_URI` → `https://split.example.com/api/auth/splitwise/callback`
- `NEXT_PUBLIC_APP_URL` → same as `APP_URL`

`DEPLOY_TARGET=cloudflare` is set in `wrangler.jsonc` vars so the app knows Hyperdrive is the database path.

---

## Step 4 — Splitwise OAuth

In [Splitwise app settings](https://secure.splitwise.com/apps), add the redirect URI that matches `SPLITWISE_REDIRECT_URI` exactly.

---

## Step 5 — Deploy

```bash
pnpm cf:deploy
```

Other commands:

| Command           | Purpose                                                 |
| ----------------- | ------------------------------------------------------- |
| `pnpm cf:build`   | Build OpenNext worker bundle                            |
| `pnpm cf:preview` | Build + local Workers runtime preview                   |
| `pnpm cf:typegen` | Regenerate `cloudflare-env.d.ts` from wrangler bindings |

---

## Step 6 — Verify

| Check                                                 | Expected                     |
| ----------------------------------------------------- | ---------------------------- |
| `curl -s https://your-host/api/health`                | `{"ok":true}`                |
| `curl -s https://your-host/api/auth/splitwise/config` | JSON with redirect URI       |
| Browser → Settings → Connect Splitwise                | OAuth completes, sync starts |

---

## Local preview

1. Copy [`.dev.vars.example`](../.dev.vars.example) to `.dev.vars` and fill in OAuth/session vars.
2. Set Hyperdrive `localConnectionString` in `wrangler.jsonc` **or** set `DATABASE_URL` in `.dev.vars`.
3. Run:

```bash
pnpm cf:preview
```

Day-to-day UI development still uses `pnpm dev` (Node.js). Use `cf:preview` to test Workers + Hyperdrive behavior.

---

## Optional — Cloudflare Access

To gate the site behind Cloudflare Access (same as the Railway tunnel path):

1. Create a self-hosted Access application for your hostname.
2. Run the OAuth bypass script so Splitwise can reach the callback:

```bash
# In .env.local
CLOUDFLARE_API_TOKEN=...
CLOUDFLARE_ACCOUNT_ID=...
APP_URL=https://split.example.com

pnpm cloudflare:access-oauth-bypass
pnpm cloudflare:access-oauth-bypass -- --verify
```

See [cloudflare-tunnel.md](./cloudflare-tunnel.md) step 6 for Access details (tunnel steps 1–5 are not needed on Workers).

---

## Migrations on deploy

Workers do not run migrations at startup (unlike Docker). Options:

1. **Manual:** `DATABASE_URL=<neon-url> pnpm db:migrate` before deploy.
2. **Workers Builds:** add a build command that runs migrations before `pnpm cf:deploy`.

---

## Troubleshooting

| Symptom                                                         | Fix                                                                        |
| --------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `DATABASE_URL is not set and Hyperdrive binding is unavailable` | Check Hyperdrive ID in `wrangler.jsonc`; redeploy after fixing             |
| OAuth redirect mismatch                                         | `APP_URL`, `SPLITWISE_REDIRECT_URI`, and Splitwise app must match          |
| Sync never completes                                            | Workers Paid required; check logs in Cloudflare dashboard                  |
| `503 database_not_configured`                                   | Confirm `DEPLOY_TARGET=cloudflare` in wrangler vars and Hyperdrive binding |
| Build fails on Hyperdrive placeholder                           | Replace `<HYPERDRIVE_ID>` before deploy                                    |

---

## Phase 2 (not implemented)

If background sync is unreliable at scale, add **Cloudflare Queues** to replace `after()` in [`src/app/api/sync/route.ts`](../src/app/api/sync/route.ts). Railway/Docker path would remain unchanged behind a feature flag.

Optional upgrades:

- **R2** incremental cache for Next.js ISR (`NEXT_INC_CACHE_R2_BUCKET` binding)
- **Workers Builds** GitHub integration for auto-deploy on a dedicated branch

---

## Related docs

- [README — Deploy elsewhere](../README.md#deploy-elsewhere)
- [cloudflare-tunnel.md](./cloudflare-tunnel.md) — Railway/Docker + Tunnel (unchanged)
