# PRD: Open Splitwise — Analytics & Search Companion

## Introduction

**Open Splitwise** is a personal, non-commercial web companion for [Splitwise](https://www.splitwise.com/) users who connect their own account via the [Splitwise Self-Serve API](https://dev.splitwise.com/). It does **not** replace Splitwise for splitting bills, settling up, or inviting friends to groups. Instead it adds what free (and many power) users ask for on Reddit and forums: **fast search across all expenses**, **rich filtering**, and **spending analysis**—features increasingly locked behind Splitwise Pro.

The product keeps users on the Splitwise platform: balances stay authoritative in Splitwise; edits and settlements can deep-link to Splitwise where appropriate. Writes go through the official API only when the user explicitly acts (create/update expense), never by bypassing Splitwise.

### Problem

- Splitwise Pro gates **expense search**, **charts/trends**, receipt scan, and removes ads/limits for heavy users.
- Native expense list is weak for **multi-axis filters** (category + person + date + group + “my share” + payment vs expense).
- API `get_expenses` is **paginated** (default `limit=20`) with only `group_id`, `friend_id`, and date bounds—no full-text search—so a companion must **sync and index locally** for power-user queries.
- Power users want **export**, **saved views**, and **personal spend analytics** (what _I_ paid vs group total), not just group balances.

### Locked scope (1A, 2A, 3C, 4A, 5B)

| Topic      | Decision                                                                                               |
| ---------- | ------------------------------------------------------------------------------------------------------ |
| Platform   | **1A** — Web only (responsive), desktop-first analytics                                                |
| Hosting    | **2A** — Self-hosted (Docker Compose; operator provides Postgres volume)                               |
| Writes     | **3C** — Read + **create expense** via API (`create_expense`); settle/edit complex splits in Splitwise |
| Auth       | **4A** — Each user registers their own Splitwise OAuth app (client id/secret in env)                   |
| Analytics  | **5B** — Full Insights tab: US-012–US-014 (dashboard, trends, per-person/group)                        |
| Audience   | Individual power users (single connected account per deployment)                                       |
| Compliance | Personal plugin under API Terms; clear disclaimers; no Splitwise trademark in app name/icon            |

---

## Goals

1. Let a connected user **find any expense in &lt;2s** via full-text search across synced history.
2. Provide **multi-filter expense exploration** (group, friend, category, date, amount, currency, payment flag, “my share” range) with **shareable URL state**.
3. Show **personal spending insights**: by category, by month, by group, and “my share” totals—without requiring Splitwise Pro charts.
4. **Respect API limits**: incremental sync, backoff, and transparent sync status.
5. **Retain Splitwise as system of record**: prominent “Open in Splitwise” on expenses/groups; no standalone friend/group onboarding.
6. Ship an **MVP in small Ralph-sized stories** that can run against the Self-Serve API.

---

## User Stories

### Phase 0 — Foundation

#### US-001: Application scaffold and quality baseline

**Description:** As a developer, I need a typed web app skeleton so later stories share lint, test, and env conventions.

**Acceptance Criteria:**

- [ ] Next.js (App Router) + TypeScript project at repo root
- [ ] ESLint + Prettier configured; `pnpm lint` passes
- [ ] `.env.example` documents required vars (no secrets committed)
- [ ] Health route `GET /api/health` returns `{ ok: true }`
- [ ] README updated with local dev commands
- [ ] Typecheck passes

#### US-002: Docker Compose for self-hosted deployment

**Description:** As an operator, I want to run Open Splitwise on my own infrastructure with Docker so data stays on my servers.

**Acceptance Criteria:**

- [ ] `Dockerfile` multi-stage build for Next.js production image
- [ ] `docker-compose.yml` with `app` + `postgres` services and named volume for DB
- [ ] `.env.example` documents `DATABASE_URL`, `SESSION_SECRET`, and Splitwise OAuth vars
- [ ] README section: register OAuth app at Splitwise, set redirect URI, copy env, `docker compose up`
- [ ] App container waits for Postgres health before starting migrations
- [ ] Typecheck passes

#### US-003: Splitwise OAuth connection flow (BYO OAuth app)

**Description:** As a user, I want to connect my Splitwise account using my own registered OAuth application.

**Acceptance Criteria:**

- [ ] Settings documents how to create a Splitwise OAuth app and required redirect URI
- [ ] `SPLITWISE_CLIENT_ID` and `SPLITWISE_CLIENT_SECRET` read from server env (not hardcoded)
- [ ] OAuth flow uses operator-configured redirect URI (document in README)
- [ ] On success, session stores access token server-side (httpOnly cookie or sealed session)
- [ ] `GET /api/me` returns current user from `get_current_user` after connect
- [ ] Disconnect clears tokens and local sync data for that user
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-004: Splitwise API client with rate-limit handling

**Description:** As a developer, I need a reliable API wrapper so sync and UI do not hammer the Self-Serve API.

**Acceptance Criteria:**

- [ ] Client targets `https://secure.splitwise.com/api/v3.0/`
- [ ] Supports OAuth bearer token from session
- [ ] Centralized error mapping (401 → re-auth, 403/404, 429 → retry-after)
- [ ] Exponential backoff on 429/5xx with configurable max retries
- [ ] Unit tests for error mapping and retry policy (mocked fetch)
- [ ] Typecheck passes

---

### Phase 1 — Sync & local index (enables search)

#### US-005: Local data model for synced Splitwise entities

**Description:** As a developer, I need a schema for users, groups, friends, categories, and expenses so queries are fast and incremental sync is possible.

**Acceptance Criteria:**

- [ ] Tables (or equivalent): `users`, `groups`, `friends`, `categories`, `expenses`, `expense_shares`, `sync_state`
- [ ] Expense stores Splitwise `id`, `group_id`, `friendship_id`, `cost`, `currency_code`, `category_id`, `description`, `details`, `date`, `payment`, `deleted_at`, raw JSON snapshot
- [ ] `expense_shares` stores per-user `paid_share`, `owed_share`, `net_balance`
- [ ] Unique constraint on Splitwise expense `id` per connected account
- [ ] Migration runs cleanly on empty DB
- [ ] Typecheck passes

#### US-006: Initial and incremental expense sync job

**Description:** As a user, I want my expenses downloaded in the background so search works across all history, not just the last page.

**Acceptance Criteria:**

- [ ] Job paginates `get_expenses` with `limit` ≤ 50 and increasing `offset` until empty
- [ ] Supports `updated_after` from `sync_state` for incremental runs
- [ ] Upserts expenses and shares; soft-deletes when `deleted_at` set
- [ ] Sync progress exposed: `{ status, lastSyncAt, expenseCount, error }`
- [ ] Manual “Sync now” button triggers job (debounced, one at a time)
- [ ] Respects rate-limit wrapper from US-004
- [ ] Typecheck passes

#### US-007: Sync groups, friends, and categories metadata

**Description:** As a user, I want filters to show human-readable group and category names during search.

**Acceptance Criteria:**

- [ ] Sync `get_groups`, `get_friends`, `get_categories` on connect and daily refresh
- [ ] Filter UI can resolve IDs to names without live API calls
- [ ] Typecheck passes

---

### Phase 2 — Search & filtering (Reddit “Pro search” alternative)

#### US-008: Expense explorer table with virtualized list

**Description:** As a user, I want to browse expenses in a dense, sortable table so I can scan history faster than the Splitwise app.

**Acceptance Criteria:**

- [ ] Columns: date, description, group, category, total cost, **my share**, paid by, currency
- [ ] Default sort: date descending
- [ ] Pagination or virtualization handles 10k+ rows without freezing
- [ ] Row click opens expense detail drawer
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-009: Full-text search across expenses

**Description:** As a user, I want to search descriptions, notes, and comments so I can find “that Uber from March” instantly.

**Acceptance Criteria:**

- [ ] Search box with debounced query (&lt;300ms feel)
- [ ] Matches `description`, `details`, and concatenated comment text from synced data
- [ ] Highlights matched terms in results
- [ ] Search works offline against local index (no per-keystroke API calls)
- [ ] Empty state when no results
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-010: Multi-dimensional filters with URL persistence

**Description:** As a power user, I want to combine filters and share/bookmark the view.

**Acceptance Criteria:**

- [ ] Filters: date range, group, friend (participant), category, currency, payment vs expense, amount min/max, **my share** min/max
- [ ] Filters compose with AND logic
- [ ] State serialized to URL query params; reload restores view
- [ ] “Clear all filters” control
- [ ] Active filter chips visible above table
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-011: Saved filter views (power user)

**Description:** As a power user, I want to save named filter presets (e.g. “Trip 2024 – Food”) for one-click recall.

**Acceptance Criteria:**

- [ ] Save current filters as named view (max 20 per user)
- [ ] List, rename, delete saved views in sidebar
- [ ] Selecting a view applies filters and updates URL
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### Phase 3 — Spending analysis

#### US-012: Personal spend dashboard (by category & time)

**Description:** As a user, I want to see where **my money** went over time, not only group totals.

**Acceptance Criteria:**

- [ ] Dashboard uses **my owed_share** (exclude pure settlement payments unless configured)
- [ ] Chart: monthly totals for selected date range
- [ ] Breakdown: top categories (bar or donut) for range
- [ ] Group selector: all groups | single group
- [ ] Currency toggle when user has multi-currency expenses (per-currency series, no FX conversion in MVP)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-013: Trends and comparison view

**Description:** As a user, I want to compare this month vs last month (and vs same month last year) to spot spending changes.

**Acceptance Criteria:**

- [ ] Shows current period vs previous period totals (my share)
- [ ] Table of categories with delta % and absolute change
- [ ] Click category drills into filtered expense list (US-010)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-014: Per-person and per-group contribution summary

**Description:** As a user splitting with roommates, I want to see how much I spent with each friend or in each group.

**Acceptance Criteria:**

- [ ] “By group” table: group name, expense count, sum of my share, % of total
- [ ] “By friend” table: friend name, sum of my share on shared expenses
- [ ] Row navigates to pre-filtered explorer
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### Phase 4 — Platform loyalty & power utilities

#### US-015: Deep links back to Splitwise

**Description:** As a user, I want to jump to the canonical Splitwise screen to settle up or edit when needed.

**Acceptance Criteria:**

- [ ] Each expense has “Open in Splitwise” using official web URL pattern (document in code comments)
- [ ] Group rows link to group on splitwise.com
- [ ] Footer disclaimer: “Not affiliated with Splitwise”; link to splitwise.com
- [ ] No Splitwise logo as app icon (API branding rules)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-016: Export filtered expenses to CSV

**Description:** As a power user, I want to export search results for spreadsheets or taxes.

**Acceptance Criteria:**

- [ ] Export respects current search + filters
- [ ] CSV columns: date, description, details, group, category, cost, currency, my paid_share, my owed_share, payer names
- [ ] Filename includes date range and timestamp
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-017: Create expense via API (equal group split)

**Description:** As a user, I want to add a simple group expense from the companion so I can log spending without leaving my analytics workflow.

**Acceptance Criteria:**

- [ ] “Add expense” form: group (required), description, cost, currency, category, date, optional details
- [ ] Submits `create_expense` with `split_equally: true` for selected group
- [ ] Surfaces API `errors` object on failure; success toast with link to Open in Splitwise
- [ ] Triggers incremental sync or upserts returned expense into local index
- [ ] Copy: custom splits and settle-up remain in Splitwise
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

## Functional Requirements

### Compliance & positioning

- **FR-1:** App MUST NOT market itself as a Splitwise replacement; copy positions it as an analytics/search companion.
- **FR-2:** App MUST NOT replicate core Splitwise flows (onboarding friends, settle-up UX, group creation wizard) as primary experience.
- **FR-3:** App MUST display privacy policy covering stored tokens, cached Splitwise data, retention, and deletion on disconnect.
- **FR-4:** App MUST obtain explicit OAuth consent; no API keys in client bundles.

### API integration

- **FR-5:** Use Self-Serve API v3.0 endpoints: `get_current_user`, `get_groups`, `get_friends`, `get_expenses`, `get_categories`, `get_currencies` (read path).
- **FR-6:** Paginate `get_expenses` until exhaustion on full sync; use `updated_after` for incremental sync.
- **FR-7:** Honor `limit`/`offset`; never assume single-page history.
- **FR-8:** Writes (US-017) use `create_expense` with equal group split only; `update_expense` / delete out of scope for MVP.

### Search & filters

- **FR-9:** Full-text search runs on local DB only after sync.
- **FR-10:** Filters support: `dated_after`, `dated_before`, `group_id`, friend/participant, `category_id`, `currency_code`, `payment`, amount bounds, computed **my share** bounds.
- **FR-11:** Filter and search state MUST be reproducible from URL.

### Analytics

- **FR-12:** “My share” = authenticated user’s `owed_share` on non-payment expenses; payments handled per configurable rule (default: exclude from spend charts).
- **FR-13:** Aggregations computed from local data; no dependency on Pro chart APIs.

### Power-user utilities

- **FR-14:** CSV export of current result set.
- **FR-15:** Up to 20 saved named filter views per user.

### UX

- **FR-16:** Sync status always visible when stale (&gt;24h) or in error.
- **FR-17:** Keyboard: `/` focuses search; `Esc` clears drawer.

---

## Non-Goals (Out of Scope for MVP)

- **Not** a standalone bill-splitting app or “invite friends without Splitwise.”
- **Not** receipt OCR (Splitwise Pro feature; separate compliance surface).
- **Not** replacing Splitwise push notifications or mobile apps.
- **Not** multi-user SaaS, admin dashboards, or storing other people’s data without their OAuth.
- **Not** commercial API usage or reselling Splitwise data (contact Splitwise for enterprise).
- **Not** real-time FX conversion beyond displaying amounts per `currency_code`.
- **Not** custom split calculators, debt simplification engines, or Venmo/Payment integrations.
- **Not** bulk delete/edit of hundreds of expenses (post-MVP).
- **Not** Android/iOS native apps (web responsive only for MVP).
- **Not** features that violate API Terms §2.6 (competing product, scraping beyond API, trademark misuse).

---

## Design Considerations

### Information architecture

1. **Home / Dashboard** — spend trends, quick stats, sync status
2. **Explore** — search + filters + table (primary power-user surface)
3. **Insights** — category/person/group breakdowns
4. **Settings** — connection, sync, export, disconnect, legal

### UX principles

- **Data-dense tables** over card feeds for history.
- **Filter chips + saved views** visible without buried menus (contrast with Splitwise mobile).
- **My share** always visible alongside total cost.
- **Calm analytics** — neutral palette, clear currency labeling, accessible charts (WCAG AA contrast).

### Reddit-informed feature mapping

| Community ask                    | Open Splitwise response                  |
| -------------------------------- | ---------------------------------------- |
| Pro-only expense search          | US-009 local FTS                         |
| Scroll forever to find old bills | US-008 + US-009                          |
| Charts / trends behind paywall   | US-012, US-013, US-014                   |
| Export for taxes/sheets          | US-016                                   |
| “What did _I_ spend on food?”    | US-012 + my share                        |
| Filter by roommate/category/date | US-010                                   |
| Still use Splitwise with friends | US-015 deep links; no social graph clone |

---

## Technical Considerations

### Stack (recommended)

- **Frontend:** Next.js 15, React, Tailwind, shadcn/ui, TanStack Table + Virtual, Recharts
- **Backend:** Next.js Route Handlers / Server Actions
- **DB:** Postgres (Docker Compose); Drizzle ORM
- **Search:** Postgres `tsvector` on expense text fields
- **Jobs:** Background sync via queue (in-process MVP → cron/worker later)
- **SDK:** [`splitwise-ts`](https://github.com/athulanilthomas/splitwise-ts) or thin typed fetch layer

### Sync strategy

```
Connect OAuth → full sync (paginated) → periodic incremental (updated_after)
                ↓
         Local FTS + aggregates refreshed on sync complete
```

### Rate limits

- Self-Serve API has conservative limits; batch sync off-peak, show user-facing progress.
- Cache categories/currencies with long TTL.

### Security

- Encrypt OAuth tokens at rest.
- Per-user row-level isolation.
- CSP, CSRF protection on OAuth routes.

### API gaps / workarounds

- No server-side search → **must** sync history (user informed on first connect).
- Comments may require per-expense fetch or embedded in expense payload—sync job should persist comment text for search.
- Group `id: 0` = non-group expenses—label as “No group” in UI.

---

## Success Metrics

| Metric                              | Target (90 days post-MVP)                                     |
| ----------------------------------- | ------------------------------------------------------------- |
| Time to find expense (user testing) | Median &lt; 5s with search                                    |
| Sync reliability                    | &gt;95% completes without manual retry                        |
| Weekly retained connected users     | Track cohort (self-hosted: optional telemetry off by default) |
| Support burden                      | Zero API key leaks; disconnect wipes data                     |

Qualitative: users report they **still add expenses in Splitwise** but **analyze in Open Splitwise**.

---

## Resolved decisions

**1A, 2A, 3C, 4A, 5B** — see [Locked scope](#locked-scope-1a-2a-3c-4a-5b) above.

---

## Appendix: API surface used

From [Splitwise API 3.0](https://dev.splitwise.com/):

| Area     | Endpoints                                                          |
| -------- | ------------------------------------------------------------------ |
| Auth     | OAuth 2.0 + bearer                                                 |
| Users    | `get_current_user`                                                 |
| Groups   | `get_groups`, `get_group/{id}`                                     |
| Friends  | `get_friends`                                                      |
| Expenses | `get_expenses`, `get_expense/{id}`, `create_expense` (equal split) |
| Meta     | `get_categories`, `get_currencies`                                 |
| Comments | `get_comments` (for search enrichment)                             |

Query params for sync: `dated_after`, `dated_before`, `updated_after`, `updated_before`, `group_id`, `friend_id`, `limit`, `offset`.

---

## Ralph handoff

Ralph task list: `scripts/ralph/prd.json`. Run: `./scripts/ralph/ralph.sh` from repo root.

`branchName`: `ralph/open-splitwise-mvp`.
