# Agent notes (open-splitwise)

This file is updated by Ralph iterations and human developers with reusable patterns.

## Ralph

- Autonomous loop: `scripts/ralph/ralph.sh`
- Task list: `scripts/ralph/prd.json` (create via PRD → convert workflow below)
- Progress log: `scripts/ralph/progress.txt`

## Codebase patterns

- Next.js 15 App Router under `src/app/`; path alias `@/*` → `src/*`
- `output: "standalone"` in `next.config.ts` for Docker (US-002)
- Run `pnpm typecheck` and `pnpm lint` before commits
- API routes live in `src/app/api/`
- Splitwise OAuth: authorize `https://secure.splitwise.com/oauth/authorize`, token `https://secure.splitwise.com/oauth/token`, API `https://secure.splitwise.com/api/v3.0/`
- Session via `iron-session` in `src/lib/session.ts`; access token never sent to client
- `getEnv()` requires OAuth + SESSION_SECRET; use `getEnvOptional()` on settings when explaining missing config
- Use `createSplitwiseClient(token)` from `src/lib/splitwise/client.ts` for all v3.0 API calls (retries, error types)
- API errors: `SplitwiseAuthError` (401), `SplitwiseForbiddenError`, `SplitwiseNotFoundError`, `SplitwiseRateLimitError` (429 + Retry-After)
- Database: Drizzle ORM + Postgres — schema in `src/lib/db/schema.ts`, migrations in `drizzle/`, `pnpm db:migrate`
- Connected account row: `users.is_account_owner = true`; expenses keyed by `account_user_id` + unique `splitwise_id`
