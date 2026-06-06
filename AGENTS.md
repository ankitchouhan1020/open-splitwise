# Agent notes (open-splitwise)

Reusable patterns for contributors and coding agents. Read this before adding features, API routes, or UI.

## Before you commit

- Run `pnpm typecheck`, `pnpm lint`, and `pnpm test`
- New DB columns → update `src/lib/db/schema.ts`, generate migration (`pnpm db:generate`), apply (`pnpm db:migrate`)
- Server-only modules: import `"server-only"` at top; Vitest aliases it to `src/test/server-only.mock.ts`
- Prefer focused diffs — match surrounding naming, types, and file layout

---

## Architecture

| Layer         | Location                   | Notes                                              |
| ------------- | -------------------------- | -------------------------------------------------- |
| Pages         | `src/app/`                 | Next.js 15 App Router; path alias `@/*` → `src/*`  |
| API           | `src/app/api/`             | JSON handlers; auth enforced in middleware         |
| Domain logic  | `src/lib/`                 | Expenses, sync, AI, security, Splitwise client     |
| UI components | `src/components/`          | Shared shell, forms, skeletons, `ui/*` primitives  |
| DB            | `src/lib/db/` + `drizzle/` | Drizzle ORM + Postgres; multi-tenant by `users.id` |
| Client data   | `src/lib/query/`           | TanStack Query hooks, keys, invalidation           |

- `output: "standalone"` in `next.config.ts` for Docker
- Production env validated at boot via `assertProductionEnv()` in `src/instrumentation.ts`

### Deploy modes

- **Showcase** (`isShowcaseMode()`): no Splitwise OAuth env → fictional data, no DB required, read-only writes blocked
- **Production**: OAuth + `DATABASE_URL` + strong `SESSION_SECRET`; `assertProductionEnv()` enforces URL/secret checks
- **Fake-data toggle**: connected users can browse sample fixtures via session flag; same read-only write rules as showcase

### Multi-tenant data

- Each Splitwise OAuth user → one `users` row (`splitwise_id` unique)
- Session `splitwiseUserId` selects tenant; access token stays server-side only
- Synced rows keyed by `account_user_id` + Splitwise entity id
- Account helpers: `getAuthenticatedAccount()`, `upsertConnectedUser()` in `src/lib/db/account.ts`
- Per-tenant sync locks: `src/lib/sync/lock.ts`
- **Always scope DB queries** to the authenticated account — never trust client-supplied user ids for tenancy

### Splitwise integration

- OAuth: authorize `https://secure.splitwise.com/oauth/authorize`, token `https://secure.splitwise.com/oauth/token`, API `https://secure.splitwise.com/api/v3.0/`
- Session via `iron-session` (`src/lib/session.ts`, `src/lib/session-config.ts`); cookie `open_splitwise_session`, 7-day max age
- `getEnv()` requires OAuth + `SESSION_SECRET`; redirect via `resolveSplitwiseRedirectUri()` — `SPLITWISE_REDIRECT_URI` overrides `APP_URL` / request origin
- Use `getEnvOptional()` on settings pages when explaining missing config
- All v3.0 calls through `createSplitwiseClient(token)` (`src/lib/splitwise/client.ts`) — retries + typed errors
- API errors: `SplitwiseAuthError` (401), `SplitwiseForbiddenError`, `SplitwiseNotFoundError`, `SplitwiseRateLimitError` (429 + Retry-After)

### Sync

- `src/lib/sync/expenses.ts`, `src/lib/sync/metadata.ts`; orchestration in `src/lib/sync/run.ts`
- Trigger: `POST /api/sync` with `{ scope: "all" | "expenses" | "metadata" }`
- After sync or expense mutations, invalidate caches via `invalidateExpenseCaches()` in `src/lib/query/invalidate.ts`
- Disconnect (`POST /api/auth/disconnect`) clears session only
- Delete synced data (`POST /api/account/delete-synced-data`) wipes tenant rows in Settings

### Feature map (existing)

| Feature          | UI                               | API / lib                                                                       |
| ---------------- | -------------------------------- | ------------------------------------------------------------------------------- |
| Home dashboard   | `src/app/home-dashboard.tsx`     | `GET /api/dashboard`, `src/lib/expenses/dashboard.ts`                           |
| Expense explorer | `/explore`                       | `GET /api/expenses`, `GET /api/expenses/summary`, `src/lib/expenses/queries.ts` |
| Insights         | `/insights`                      | `GET /api/insights`, `src/lib/expenses/insights.ts`                             |
| AI narrative     | Home insights section            | `GET /api/ai/narrative`, `src/lib/ai/narrative.ts`                              |
| AI smart filters | Explore toolbar                  | `POST /api/ai/parse-filters`, `src/lib/ai/parse-filters.ts`                     |
| AI settings      | Settings → AI tab                | `GET/POST /api/ai/settings`, `src/lib/ai/settings.ts`                           |
| Groups / friends | `/groups`, `/friends`, `/people` | `src/lib/groups/`, `src/lib/friends/`                                           |

---

## Security checklist

Use this when adding routes, mutations, or features that touch user data or external services.

### Middleware (`src/middleware.ts`)

All `/api/*` requests pass through middleware unless listed as public:

1. **Path-specific rate limits** — add rules to `RATE_LIMIT_RULES` in `src/lib/security/rate-limit.ts`
2. **CSRF / same-origin** — mutating methods require matching `Origin` or `Referer` (`src/lib/security/csrf.ts`); in production, only `APP_URL` / `NEXT_PUBLIC_APP_URL` origins allowed
3. **Session auth** — non-public APIs require `sessionIsActive()` or return `{ error: "unauthorized" }` (401)
4. **Authenticated read cap** — 180 GET/min per IP+tenant (`AUTHENTICATED_READ_RULE`)
5. **Demo write block** — showcase/fake-data sessions cannot POST/PUT/PATCH/DELETE except allowlisted paths (`src/lib/security/demo-write.ts`)

Public API paths (no session): OAuth routes, `/api/health`, and `/api/demo/start` in showcase mode only.

Protected **pages** (`/explore`, `/insights`, `/friends`, `/groups`) redirect unauthenticated users to Settings with `?error=connect_required`.

### Secrets and tokens

- **Never** expose Splitwise access tokens, AI API keys, or decrypted credentials to the client
- AI keys encrypted at rest with AES-256-GCM (`src/lib/ai/crypto.ts`); uses `AI_ENCRYPTION_SECRET` or falls back to `SESSION_SECRET` (min 32 chars)
- Settings UI shows `hasKey: true/false` only — never return plaintext keys from API
- `shouldExposeSetupDetails()` gates env checklists and copyable OAuth snippets on production anonymous visits

### Rate limits (extend when adding heavy endpoints)

| Path                              | Limit / window       |
| --------------------------------- | -------------------- |
| `/api/sync`                       | 6 / min              |
| `/api/expenses/export`            | 6 / min              |
| `/api/account/delete-synced-data` | 3 / min              |
| `/api/ai/parse-filters`           | 20 / min             |
| `/api/ai/narrative`               | 10 / min             |
| `/api/ai/settings`                | 30 / min             |
| All authenticated GET `/api/*`    | 180 / min per tenant |

Return `{ error: "rate_limited" }` with `Retry-After` header. Use `clientIpFromHeaders()` — prefers `cf-connecting-ip`; set `TRUST_PROXY_IP=true` in production behind a trusted proxy.

### New API route checklist

- [ ] Is it public? If not, rely on middleware auth — don't skip session checks in the handler
- [ ] Mutations: will CSRF middleware block legitimate calls? Same-origin fetches from the app are fine
- [ ] Demo/showcase: should writes be blocked? Add to `DEMO_READ_ONLY_WRITE_ALLOWED` only if the POST is safe (toggle/session, not data mutation)
- [ ] Fake-data path: branch with `isFakeDataRequest()` and serve from `src/lib/demo/handlers.ts` where appropriate
- [ ] DB required: guard with `isDatabaseConfigured()` → 503 `database_not_configured`
- [ ] Tenant scope: use `getAuthenticatedAccount()` and filter by `accountUserId`
- [ ] Rate limit: add to `RATE_LIMIT_RULES` if expensive or abuse-prone
- [ ] Error shape: `{ error: "snake_case_code" }` with appropriate HTTP status; optional `message` for AI errors
- [ ] API `error` codes are for programmatic use — **never** render them directly in the UI; map to friendly copy in the component (see User-friendly errors)
- [ ] No sensitive details in error messages sent to client

### AI-specific security

- Gate all AI routes with `requireAiAccount()` (`src/lib/ai/guard.ts`): DB configured, not fake-data, user connected, AI enabled in settings
- Map errors through `aiErrorResponse()` — never leak provider stack traces
- Structured outputs only: Zod schema + JSON schema in `src/lib/ai/response-schemas.ts`; validate in `src/lib/ai/client.ts`
- Prompts in `src/lib/ai/prompts.ts` — send aggregated/summary data only, not raw PII beyond what the user already sees in UI
- Cache AI responses per tenant when safe (`src/lib/ai/cache.ts`); invalidate on relevant data changes
- Document new AI data flows on the privacy page (`src/app/privacy/page.tsx`)

### Production boot checks (`src/lib/security/production.ts`)

When OAuth is fully configured in production, startup fails if:

- `SESSION_SECRET` missing, too short, or a known weak default
- `APP_URL` or `SPLITWISE_REDIRECT_URI` missing or origin-mismatched
- `DEMO_MODE` enabled alongside real OAuth

---

## API route patterns

```ts
// Typical authenticated read
export async function GET() {
  if (await isFakeDataRequest()) {
    return NextResponse.json(demoHandler());
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "database_not_configured" },
      { status: 503 },
    );
  }
  const account = await getAuthenticatedAccount();
  if (!account) {
    return NextResponse.json({ error: "not_connected" }, { status: 401 });
  }
  // ... query scoped to account.id
  return NextResponse.json(result);
}
```

- Parse query params with shared helpers (e.g. `parseExpenseFilters`) — don't duplicate filter logic in routes
- Validate JSON bodies explicitly; return `invalid_json` (400) on parse failure
- Use typed domain functions in `src/lib/` — keep routes thin

---

## Frontend and product UX

**Default rule:** layout, spacing, typography, and component choices should match existing sections (Home, Explore, Insights, Settings). Do not invent new visual patterns unless the task explicitly asks for a different design.

### Layout shell

- Wrap authenticated/main pages in `AppShell` (`src/components/app-shell.tsx`) — nav, fake-data banner, sync banner, mobile bottom nav, add-expense FAB
- Content width: `PageContainer` (`max-w-6xl`, responsive padding) from `src/components/page-container.tsx`
- Nav links defined in `src/lib/nav.ts`; add new primary destinations there and to `MobileBottomNav` if top-level
- Page vertical rhythm: `space-y-3` / `space-y-4` between major blocks (see Home, Explore, Insights)

### Layout and design consistency

When adding UI, copy structure from the closest existing feature — don't introduce one-off layouts.

| Pattern                | Where to mirror                                                              | Building blocks                                                                                   |
| ---------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Filter toolbar + pills | Explore (`explore-filters-card.tsx`), Insights (`insights-filters-card.tsx`) | `border-border bg-card rounded-lg border`, `FilterPills`, `ui.input` / `ui.select`, `pillClass()` |
| Data lists             | Home activity feed, Explore expense list                                     | `DataList`, `ExpenseListItemRow`, `ui.listRow`, `ui.monthHeader`                                  |
| In-page tabs           | Home feed tabs                                                               | `SegmentTabs` + `ui.segmentTabRail`                                                               |
| Summary / stat cards   | Home hero, Insights summary                                                  | `ui.cardGradient` or `ui.summaryCard`, tabular nums for amounts                                   |
| Settings panels        | Any Settings tab                                                             | `SettingsSection`, `SettingsBlock`, `SettingsAlert` from `settings-ui.tsx`                        |
| Drawers / detail       | Expense detail                                                               | `ExpenseDetailDrawer`, `ui.overlay`, `ui.panelFooter`                                             |
| Forms                  | Add/edit expense                                                             | `ui.input`, `ui.btnSecondary`, inline `ui.errorBox`                                               |

**Shared card shell** (filters, settings, grouped content):

```tsx
<div className="border-border bg-card overflow-hidden rounded-lg border">
  <div className="border-border border-b px-4 py-3">{/* header */}</div>
  <div className="p-2.5 sm:p-4">{/* body */}</div>
</div>
```

**Typography scale** — stay consistent across pages:

- Page / hero emphasis: `text-2xl font-semibold tracking-tight` (amounts: add `tabular-nums`)
- Section titles: `text-sm font-semibold`
- Secondary / helper: `text-muted text-xs leading-relaxed`
- Body list text: `text-sm`

**Spacing and controls:**

- Card padding: `p-2.5` on mobile, `sm:p-4` on larger screens for dense toolbars; Settings uses `px-4 py-3`
- Gaps between controls: `gap-2` in toolbars, `gap-3`/`gap-4` between sections
- Buttons: `ui.btnSecondary` for secondary actions, ghost for toolbar icons; match Explore/Settings sizing (`text-xs`/`text-sm`, `rounded-lg`/`rounded-md`)
- Inputs and selects: always compose from `ui.input` / `ui.select` — same focus ring and border tokens

**Charts and tables** (Insights): reuse layout constants from `insights-table-layout.ts` and `chartThemeFromDocument()` — don't hardcode new table cell classes or chart colors outside `chart-theme.ts` / existing palette.

**When deviation is OK:** only when the user or spec explicitly calls for a different layout (e.g. marketing landing, a one-off modal flow). Even then, keep semantic tokens and typography scale; change structure, not the design system.

### Visual system

- **Semantic tokens** in `globals.css` — use `ui` bundles from `src/lib/ui-classes.ts`, not raw `stone-*` / hardcoded colors
- **Status tones**: `insightToneClass`, `statusBadgeClass`, `settingsAlertClass` in `src/lib/tone-styles.ts`
- **Dark mode**: `ThemeProvider` + CSS variables; test both themes
- Reuse primitives: `EmptyState`, `FilterPills`, `SegmentTabs`, `DataList` under `src/components/ui/`

### Loading, empty, and error states

- Page-level: `Suspense` + dedicated skeleton components (e.g. `HomeDashboardSkeleton`, `InsightsDashboardSkeleton`)
- Inline: show skeleton rows or `animate-pulse` placeholders matching final layout — avoid layout shift
- Empty data: `EmptyState` with plain copy and optional action link (e.g. "Sync to load expenses")
- Errors: use `ui.errorBox` / `ui.errorBoxLg`; sync failures surface in `SyncStatusBanner` globally
- Toasts for transient success/failure: `ToastProvider` + existing patterns in forms

### User-friendly errors

API responses use machine-readable codes (`rate_limited`, `not_connected`, `database_not_configured`). The UI must translate these into plain language — never show snake_case codes, HTTP status numbers, stack traces, or raw `Error.message` from fetch/network failures.

**Write errors for humans:**

- Say **what happened** and **what to do next** — e.g. "Couldn't load your expenses. Try syncing from the header." not "Failed to load dashboard"
- Validation: short, direct imperatives — "Select a group.", "Enter a description." (see `add-expense-form.tsx`)
- Unknown/network failures: generic fallback — "Something went wrong. Try again." (see `add-expense-form.tsx`, `edit-expense-form.tsx`)
- Actionable context: link or name the fix — "Connect Splitwise in Settings", "Check your API key in Settings → AI"
- Sync issues: plain status in `SyncStatusBanner` — "Expense sync failed" / "Your expense data may be out of date"

**Avoid in UI copy:**

- Raw API `error` fields (`ai_disabled`, `invalid_json`)
- Provider or Splitwise error strings returned by the server
- Field names from validation payloads (`groupId: required`) — rephrase for users
- Technical jargon ("502", "misconfigured", "unauthorized")

**Pattern — map codes at the UI boundary:**

```ts
const ERROR_MESSAGES: Record<string, string> = {
  not_connected: "Connect Splitwise in Settings to use this feature.",
  rate_limited: "Too many requests. Wait a moment and try again.",
  ai_disabled: "Turn on AI in Settings to use smart filters.",
};

function friendlyError(code: string | undefined, fallback: string): string {
  return (code && ERROR_MESSAGES[code]) || fallback;
}
```

Use a shared map in `src/lib/` when the same codes appear in multiple components. Keep copy in sentence case, concise, and consistent with Settings alerts (`settingsAlertClass`).

### Client data fetching

- Add hooks in `src/lib/query/hooks.ts` with keys from `src/lib/query/keys.ts`
- Use `fetchJson()` helper; set sensible `staleTime` for rarely-changing data
- Mutations: invalidate related keys — prefer `invalidateExpenseCaches()` for expense-affecting operations
- Don't fetch Splitwise directly from the browser — always go through `/api/*`

### Copy and settings UX

- User-facing strings for Settings tabs/sections: `src/app/settings/settings-copy.ts`
- Explain **what data leaves the server** for any feature that calls third parties (see AI section in Settings + privacy page)
- Setup/server details: respect `shouldExposeSetupDetails()` — don't show env snippets to anonymous production visitors
- Use `getSetupStatus()` for connection/database state messaging in Settings

### Mobile

- Bottom nav on connected sessions; primary actions via header (`AppNavActions`) and FAB for add-expense
- Keep touch targets ≥ 44px; test filter toolbars and drawers at `sm` breakpoint
- Abbreviate labels where needed (`shortLabel` on nav items)

### Accessibility

- Interactive rows: `focus-visible:ring-*` patterns from `ui.interactiveRow`
- Status banners: `role="status"`
- Icon-only buttons: `aria-label`
- Keyboard shortcuts in Explore (`/` focuses search) — don't steal keys when focus is in inputs

### New page / feature UX checklist

- [ ] Uses `AppShell` + `PageContainer`
- [ ] Layout and components match the closest existing section (see Layout and design consistency) unless spec says otherwise
- [ ] Loading skeleton matches content structure
- [ ] Empty state with next step (connect, sync, adjust filters)
- [ ] Works in showcase/fake-data and connected modes — or hides gracefully with explanation
- [ ] Mobile layout reviewed; no horizontal overflow on filter bars
- [ ] Uses semantic color tokens (success/warn/error), not ad-hoc reds/greens
- [ ] Errors are user-friendly: mapped from API codes, include a next step, no snake_case or status codes shown
- [ ] Settings entry added if feature needs configuration
- [ ] Privacy implications documented if data is sent externally

---

## AI features (extension guide)

1. **Availability** — `isAiAvailable()` checks user settings + provider config (`src/lib/ai/availability.ts`); expose status via `GET /api/ai/status`
2. **Route guard** — `requireAiAccount()` at top of handler
3. **Client** — `completeJson()` in `src/lib/ai/client.ts` with Zod response schema; 30s timeout
4. **Providers** — registry in `config/ai-providers.json` + `src/lib/ai/providers.ts`
5. **Settings** — per-tenant row in `user_ai_settings`; encrypt keys on save
6. **UI** — Settings AI tab (`src/app/settings/ai-section.tsx`); feature surfaces check `useAiStatus()` before showing AI controls
7. **Disable in demo** — AI must not run on fake-data/showcase (`ai_disabled` 403)

---

## Testing

- Unit tests: `src/**/*.test.ts` with Vitest (`pnpm test`)
- Co-locate tests with modules (`rate-limit.test.ts`, `csrf.test.ts`, `providers.test.ts`)
- Use `resetRateLimitsForTests()` between rate-limit cases
- Test security helpers and pure domain logic; avoid full Next.js integration tests unless necessary
- Mock `"server-only"` is automatic via Vitest alias

---

## Infrastructure

- Cloudflare Access + OAuth: `pnpm cloudflare:access-oauth-bypass` (`scripts/cloudflare-access-oauth-bypass.mjs`); docs in `docs/cloudflare-tunnel.md`
- Cloudflare Tunnel: `docker-compose.tunnel.yml` overlay + `docs/cloudflare-tunnel.md`; Railway sidecar in `deploy/cloudflared/`
