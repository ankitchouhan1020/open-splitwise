# Railway template

**Published:** https://railway.com/new/template/open-splitwise

| Field | Value |
| ----- | ----- |
| Display name | Open Splitwise |
| Code (deploy URL) | `open-splitwise` |

Railway has **no “paste JSON”** field. [`deploy/railway-template.json`](../deploy/railway-template.json) is a **reference spec** only (`pnpm railway:template:validate` checks it). Use one of the flows below.

---

## Update template — snapshot from project (recommended)

Requires all services to use **GitHub repo** or **Docker image** sources (not `railway up` uploads).

### 1. Fix `cloudflared` source (one-time)

Dashboard → **open-splitwise** project → **cloudflared** service → **Settings**:

- **Source:** GitHub `ankitchouhan1020/open-splitwise`
- **Root directory:** `deploy/cloudflared`
- Keep `TUNNEL_TOKEN`; redeploy

See [cloudflare-tunnel.md step 3](./cloudflare-tunnel.md).

### 2. Generate template from project

**Dashboard:** project canvas → **Settings** (gear) → **Generate Template from Project** → **Create Template**

**CLI:**

```bash
railway login
railway templates create --project open-splitwise --environment production --json
```

### 3. Edit in the visual composer

Railway opens the template editor (canvas UI, not JSON):

- **Name:** `Open Splitwise`
- **Code:** `open-splitwise` (must match README deploy button)
- Remove real secrets; keep reference variables (`${{Postgres.DATABASE_URL}}`, etc.)
- Confirm three services: **Postgres**, **open-splitwise**, **cloudflared**

### 4. Publish

```bash
railway templates publish <template-id> \
  --category Other \
  --description "Self-hosted Splitwise companion with PostgreSQL and Cloudflare Tunnel." \
  --readme-file deploy/railway-template-readme.md \
  --json
```

If a template with code `open-splitwise` already exists, unpublish the old one first or update metadata with `railway templates update open-splitwise ...` (metadata only — service layout comes from step 2).

---

## Update template — edit published template visually

Templates → **open-splitwise** → **Edit** → add/configure services in the canvas:

| Service | Source | Root / notes |
| ------- | ------ | ------------ |
| Postgres | Add **Database** → PostgreSQL | volume auto |
| open-splitwise | GitHub `ankitchouhan1020/open-splitwise` | repo root; public HTTP **:3000** |
| cloudflared | Same repo | root `deploy/cloudflared`; var `TUNNEL_TOKEN`; **no** public domain |

Use [`deploy/railway-template.json`](../deploy/railway-template.json) as a checklist for variables.

---

## What deployers get

Post-deploy: [cloudflare-tunnel.md](./cloudflare-tunnel.md) (tunnel hostname, `APP_URL`, Splitwise OAuth, remove `*.up.railway.app` domains when using tunnel only).
