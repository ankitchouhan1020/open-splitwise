# Open Splitwise

[Splitwise](https://splitwise.com) handles expense splitting well, but offers limited search, export, and analysis across groups and time periods.

This project syncs your Splitwise expenses into a **self-hosted** Postgres database. You can search, filter, export, and visualize them in a web UI you control. Expense entry and settlement remain in Splitwise; this application is a read-focused layer on top of your existing data.

## The goal

**You own a queryable copy of your Splitwise data.**

- Full-text search across descriptions and comments
- Filters, saved views, CSV export
- Insights and balance views across friends and groups
- OAuth connect — token never leaves the server
- One deployment, multiple Splitwise accounts, data isolated per user

This is not a Splitwise replacement. It provides query and analysis over data you already have.

## Quick start (local)

**Sample data only** — no Splitwise or Postgres required:

```bash
git clone https://github.com/ankitchouhan1020/open-splitwise.git
cd open-splitwise
pnpm install
pnpm local
```

Open **http://localhost:3000** — the app runs in showcase mode with fictional expenses until you add Splitwise credentials in **Settings**.

For a persistent session cookie in development, add to `.env.local`:

```bash
openssl rand -base64 32   # paste as SESSION_SECRET=
```

To use your own data, configure Splitwise OAuth as described below.

## Connect Splitwise (local)

1. Create an OAuth app at [secure.splitwise.com/apps](https://secure.splitwise.com/apps)
2. Set redirect URI to `http://localhost:3000/api/auth/splitwise/callback`
3. Add `SPLITWISE_CLIENT_ID` and `SPLITWISE_CLIENT_SECRET` to `.env.local`
4. Restart → **Connect Splitwise** → **Sync**

When connected, the **mask icon** in the header toggles between your synced data and sample fixtures, useful for demos or screenshots without disconnecting.

## Hosting

### Try it with zero configuration

Deploy the app **without** Postgres, Splitwise, or secrets. It starts in **showcase mode**: Home, Explore, and Insights use built-in sample data. Add credentials later in **Settings** to switch to your own expenses.

**Railway (fastest)**

1. [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo** → select this repository.
2. **Settings** → **Networking** → **Generate Domain**.
3. Deploy. Open the URL — no variables required for the demo.

**Docker (app only)**

```bash
docker compose -f docker-compose.showcase.yml up --build
```

Open **http://localhost:3000**.

**Showcase security** — A zero-config deploy is a **public, read-only demo** (fictional data only). It is not multi-tenant production. Anyone can browse sample expenses via the API; writes are blocked. Before connecting real Splitwise users on the same URL, set a strong `SESSION_SECRET` (`openssl rand -base64 32`) and complete OAuth setup in **Settings**.

### Full install (your Splitwise data)

Runs the application and Postgres; migrations execute on container start:

```bash
cp .env.example .env
# SESSION_SECRET, SPLITWISE_*, APP_URL, DATABASE_URL
docker compose up --build
```

**Railway with Postgres**

1. Deploy from GitHub (same as above).
2. **+ New** → **Database** → **PostgreSQL**.
3. Set variables on the **app** service:

| Variable                  | Value                                                               |
| ------------------------- | ------------------------------------------------------------------- |
| `APP_URL`                 | Your Railway domain (no trailing slash)                             |
| `NEXT_PUBLIC_APP_URL`     | Same as `APP_URL`                                                   |
| `SPLITWISE_REDIRECT_URI`  | `{APP_URL}/api/auth/splitwise/callback`                             |
| `SPLITWISE_CLIENT_ID`     | From [secure.splitwise.com/apps](https://secure.splitwise.com/apps) |
| `SPLITWISE_CLIENT_SECRET` | From Splitwise                                                      |
| `SESSION_SECRET`          | Output of `openssl rand -base64 32`                                 |
| `DATABASE_URL`            | `${{Postgres.DATABASE_URL}}`                                        |

Do **not** set `PORT` — Railway injects the listen port automatically.

**Splitwise OAuth**

1. Create an OAuth app at [secure.splitwise.com/apps](https://secure.splitwise.com/apps).
2. Add the **exact** redirect URI from the table above.

**Verify**

1. `GET /api/health` → `{ "ok": true }`.
2. Open your URL → **Settings** → **Connect Splitwise** → **Sync**.

**Custom domain (optional)** — update `APP_URL`, `NEXT_PUBLIC_APP_URL`, `SPLITWISE_REDIRECT_URI`, and the Splitwise app redirect URI to match.

**Troubleshooting**

| Symptom                            | Fix                                                                                             |
| ---------------------------------- | ----------------------------------------------------------------------------------------------- |
| App won't start after adding OAuth | Set `SESSION_SECRET` (32+ chars), `APP_URL`, and `SPLITWISE_REDIRECT_URI` with matching origins |
| OAuth redirect mismatch            | `SPLITWISE_REDIRECT_URI`, Splitwise app, and `APP_URL` must share the same origin               |
| Database connection errors         | Use `${{Postgres.DATABASE_URL}}` on the app service (not `DATABASE_PUBLIC_URL`)                 |

### Cloudflare Tunnel (optional)

For a custom hostname without public inbound ports, see [docs/cloudflare-tunnel.md](docs/cloudflare-tunnel.md). That configuration requires `PORT=3000` on Railway because the tunnel origin targets port 3000.

Env reference: [`.env.example`](.env.example)

## Development

Next.js 15 App Router, Drizzle, iron-session, Splitwise API v3.0.

```bash
pnpm local          # postgres + migrate + dev
pnpm typecheck      # types
pnpm lint           # eslint + prettier
pnpm test           # vitest
```

Conventions for contributors and agents: [`AGENTS.md`](AGENTS.md)

```
src/app/       pages + API routes
src/lib/       sync, queries, splitwise client, auth
drizzle/       migrations
```

Health: `GET /api/health` → `{ "ok": true }`

## License

[MIT](LICENSE)
