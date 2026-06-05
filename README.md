# Open Splitwise

I use [Splitwise](https://splitwise.com) constantly — trips, rent, dinners, that one friend who always forgets to log the Ubers. Splitwise is excellent at *splitting*. It is less excellent at *finding that dinner from March 2019*, exporting your share across groups, or charting where your money went over the years.

Splitwise has an API. Your expenses are already there. This project pulls them into **your** Postgres database so you can search, filter, export, and chart them from a UI you host yourself. You still add expenses and settle up in Splitwise. This is the read-heavy companion — the spreadsheet brain on top of the social ledger.

![Home dashboard with balances, recent activity, and spending breakdown](docs/images/open-splitwise-home.png)

## The goal

**You own a queryable copy of your Splitwise data.**

- Full-text search across descriptions and comments
- Filters, saved views, CSV export
- Insights and balance views across friends and groups
- OAuth connect — token never leaves the server
- One deployment, multiple Splitwise accounts, data isolated per user

Not a Splitwise replacement. A lens over data you already have.

## Try it in two minutes

No Splitwise account required. Guest demo serves fictional data so you can click around before wiring OAuth.

```bash
git clone https://github.com/ankitchouhan1020/open-splitwise.git
cd open-splitwise
cp .env.example .env.local
```

Add a session secret (paste the output into `.env.local`):

```bash
openssl rand -base64 32
```

Enable the guest demo:

```bash
echo "DEMO_MODE=true" >> .env.local
```

Run it:

```bash
pnpm install
pnpm local
```

Open **http://localhost:3000** → **Try demo** → poke around `/explore` and `/insights`.

That is the whole pitch. If the UI feels useful, connect your real account next.

## Connect for real

1. Create an OAuth app at [secure.splitwise.com/apps](https://secure.splitwise.com/apps)
2. Set redirect URI to `http://localhost:3000/api/auth/splitwise/callback`
3. Add `SPLITWISE_CLIENT_ID` and `SPLITWISE_CLIENT_SECRET` to `.env.local`
4. Restart → **Connect Splitwise** → **Sync**

Already connected? The **mask icon** in the header swaps your real data for sample fixtures — handy for screenshots or demos without logging out.

## Hosting

**Docker** — app + Postgres, migrations on start:

```bash
cp .env.example .env
# SESSION_SECRET, SPLITWISE_*, APP_URL
docker compose up --build
```

**Railway** — Dockerfile + [`railway.toml`](railway.toml). Connect the GitHub repo, add Postgres, set env vars **before** the first deploy (the app refuses to boot without them). Needs `PORT=3000` and `HOSTNAME=::` — Railway defaults to 8080.

**Cloudflare Tunnel** — hide Railway/Docker behind your own hostname: [docs/cloudflare-tunnel.md](docs/cloudflare-tunnel.md)

Env reference: [`.env.example`](.env.example)

## Hacking on it

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

Add a license when you are ready to publish.
