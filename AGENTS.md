# Agent notes (open-splitwise)

Reusable patterns for contributors and coding agents.

## Codebase patterns

- Next.js 15 App Router under `src/app/`; path alias `@/*` → `src/*`
- `output: "standalone"` in `next.config.ts` for Docker (US-002)
- Run `pnpm typecheck` and `pnpm lint` before commits
- API routes live in `src/app/api/`
- Splitwise OAuth: authorize `https://secure.splitwise.com/oauth/authorize`, token `https://secure.splitwise.com/oauth/token`, API `https://secure.splitwise.com/api/v3.0/`
- Session via `iron-session` in `src/lib/session.ts`; access token never sent to client
- `getEnv()` requires OAuth + SESSION_SECRET; OAuth redirect via `resolveSplitwiseRedirectUri()` — `SPLITWISE_REDIRECT_URI` overrides `APP_URL` / request origin; use `getEnvOptional()` on settings when explaining missing config
- Use `createSplitwiseClient(token)` from `src/lib/splitwise/client.ts` for all v3.0 API calls (retries, error types)
- API errors: `SplitwiseAuthError` (401), `SplitwiseForbiddenError`, `SplitwiseNotFoundError`, `SplitwiseRateLimitError` (429 + Retry-After)
- Database: Drizzle ORM + Postgres — schema in `src/lib/db/schema.ts`, migrations in `drizzle/`, `pnpm db:migrate`
- Multi-tenant: each Splitwise OAuth user gets a `users` row (`splitwise_id` unique); session `splitwiseUserId` selects tenant; expenses keyed by `account_user_id` + unique `splitwise_id`
- Account helpers: `getAuthenticatedAccount()`, `upsertConnectedUser()` in `src/lib/db/account.ts`; per-tenant sync locks in `src/lib/sync/lock.ts`
- Disconnect (`POST /api/auth/disconnect`) clears session only; `POST /api/account/delete-synced-data` wipes synced rows for current tenant
- Sync: `src/lib/sync/expenses.ts`, `src/lib/sync/metadata.ts`; trigger via `POST /api/sync` with `{ scope: "all" | "expenses" | "metadata" }`
- Expense list: `src/lib/expenses/queries.ts`, UI at `/explore`, API `GET /api/expenses?page&sort&order`
- Expense summary: `GET /api/expenses/summary` (same filter params as list)
- Insights: `src/lib/expenses/insights.ts`, UI at `/insights`, API `GET /api/insights`
- Home dashboard: `src/lib/expenses/dashboard.ts`, `GET /api/dashboard`, UI `src/app/home-dashboard.tsx`
- Layout shell: use `AppShell` from `src/components/app-shell.tsx` (nav + sync banner) on all main pages
- Cloudflare Access + OAuth: `pnpm cloudflare:access-oauth-bypass` (`scripts/cloudflare-access-oauth-bypass.mjs`); docs in `docs/cloudflare-tunnel.md`
- Cloudflare Tunnel: `docker-compose.tunnel.yml` overlay + `docs/cloudflare-tunnel.md`; Railway sidecar in `deploy/cloudflared/`
