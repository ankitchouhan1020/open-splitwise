# UX improvement plan — inspired by Splitwise redesign case study

Source: [Splitwise — Redesigning for more complicated but much-needed use cases](https://medium.muz.li/splitwise-redesigning-for-more-complicated-but-much-needed-use-cases-4c6ceb991567) (Jishnu K O, 2020).

This plan adapts that case study to **Open Splitwise** — a self-hosted analytics companion that syncs Splitwise data. We are not rebuilding Splitwise; we improve how users **understand balances, groups, activity, and complex splits** after sync, while keeping settle-up and primary expense workflows in the official app where appropriate.

**Mock UIs:** [`docs/design/mocks/`](./mocks/) — open `.excalidraw` files in [Excalidraw](https://excalidraw.com) or the VS Code Excalidraw extension.

---

## Executive summary

| Theme from article            | Open Splitwise today                          | Proposed direction                                                            |
| ----------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------- |
| Natural expense entry order   | Single dialog: amount-first, equal split only | Reorder create flow; surface multi-payer + split types when API supports them |
| One bill, many split patterns | Multiple expenses required                    | Read-only **split breakdown** view from synced `expense` payload              |
| Settle via UPI/wallets        | Not in scope (OAuth companion)                | Deep-link **“Settle in Splitwise”** + optional payment-record filter          |
| Friends hub                   | Balances only on Home                         | Dedicated **Friends** page with “to get / to pay” language                    |
| Groups hub                    | Filter pills in Explore                       | **Groups** page with Activity / Members tabs                                  |
| Activity feed                 | Explore (search-heavy)                        | Activity-first presentation + type filters                                    |
| Accessibility & dark mode     | Light only; some contrast gaps                | WCAG AA tokens + system dark mode                                             |
| iPad / wide web               | `max-w-6xl` single column                     | Sidebar nav + master–detail on `lg+`                                          |

---

## Product principles (companion-app constraints)

1. **Sync truth** — UI reflects Splitwise data; don’t invent balances.
2. **Splitwise for money movement** — settle-up, reminders, and complex edits stay in Splitwise unless we add full API write support.
3. **Open Splitwise for clarity** — search, filters, trends, and complicated-split _visibility_.
4. **Mobile-first, web-enhanced** — bottom nav on phone; sidebar + split pane on desktop.

---

## Phase 1 — Language, balances & navigation (4–6 weeks)

### 1.1 Balance copy: “to get” / “to pay”

**Article insight:** “You owed / you are owed” is awkward; “to get / to pay” matches how people talk.

**Changes:**

- Update `balanceLabel()` and Home balance panel copy in `src/lib/balance-style.ts`, `home-dashboard.tsx`.
- Use directional labels consistently: list headers “To get”, “To pay”; net line “₹X to get overall”.
- Keep color system (teal = inflow, amber = outflow).

**Mock:** `01-mobile-friends-balances.excalidraw`, `05-web-friends-groups-layout.excalidraw`

### 1.2 Friends page (`/friends`)

**Article insight:** Show final amount per person; details one tap away; contextual CTAs (remind / settle).

**New route:**

- **Mobile:** card list grouped by To get / To pay; tap → friend detail (shared groups, recent expenses, net balance).
- **Web:** table with Name | To get | To pay | Action; friend detail as right drawer or `/friends/[id]`.
- **CTAs:** “Remind” → Splitwise deep link if available; “Settle in Splitwise” → group or friend settle URL.
- Data: extend dashboard balance API or new `GET /api/friends` from synced friends + live balance endpoint.

**Nav:** Add Friends to `NAV_LINKS`; mobile bottom nav may become 5 tabs + FAB — consider replacing Settings in tab bar with overflow menu, or move Add to header on mobile.

### 1.3 Groups page (`/groups`)

**Article insight:** Visual inflow/outflow; group name is enough (drop Apartment/House/Trip taxonomy).

**New route:**

- List groups with net balance badge and member count.
- **Group detail** with tabs:
  - **Activity** — expenses in group, who paid, your share (mock `02-mobile-group-detail.excalidraw`).
  - **Members** — per-member spend summary for selected period.
- Overflow menu (⋯): open in Splitwise, export group CSV, sync group.

**Data:** `GET /api/groups`, `GET /api/groups/[id]/activity`, `GET /api/groups/[id]/members` from Postgres + metadata sync.

---

## Phase 2 — Activity & Explore UX (3–4 weeks)

### 2.1 Activity presentation (enhance Explore)

**Article insight:** Consistent verbs (“You paid”, “Jonas paid you”); amount right-aligned; readable dates; prominent search; filters All / Payment made / Payment received / Non-payment.

**Changes to Explore (`expense-explorer.tsx`, `expense-list-item.tsx`):**

- Row copy generator from expense type + payer + current user.
- Right-align amounts; secondary line: group name + description.
- Date format: relative + absolute on hover (web).
- **Filter chips:** All | Paid by you | Received | Expenses (hide settlements toggle stays in advanced).
- Promote search bar above filters on mobile (mock `03-mobile-activity-feed.excalidraw`).

### 2.2 Web master–detail

**Article insight:** iPad / wide layouts benefit from split view.

**On `md+`:**

- List left (~55%), detail drawer pinned right (mock `06-web-activity-complex-split.excalidraw`).
- Keyboard: j/k navigate rows, Enter opens detail.

---

## Phase 3 — Expense creation flow (4–6 weeks, API-dependent)

### 3.1 Reorder create flow

**Article insight:** Natural order is description → who paid (amounts) → split with → how to split; total = sum of payments.

**Current:** description + cost + group + equal split (`add-expense-form.tsx`).

**Proposed wizard (mobile: full-screen steps; web: stepped modal):**

| Step          | Fields                                        |
| ------------- | --------------------------------------------- |
| 1. What       | Description, date, category, optional notes   |
| 2. Who paid   | Multi-payer rows; auto-sum total              |
| 3. Split with | Participants (default: group members)         |
| 4. How        | Equal (now); later: exact, %, shares, by item |

**Mock:** `04-mobile-add-expense-flow.excalidraw`

**Backend:** Splitwise API supports multiple payers and split modes — extend `POST /api/expenses` payload mapping in stages.

### 3.2 Complex split visibility (read-first)

**Article insight:** Supermarket scenario needs one expense with mixed split modes.

**Short term (no write):**

- Parse synced expense JSON (`users`, `repayments`, split mode) into human-readable **split breakdown** in `expense-detail-view.tsx`.
- Show sections: “Equal · 4 people”, “By share · 2 people”, “Not shared” when detectable from line items / shares.

**Long term:** Itemized splits on create (Phase 3b) if Splitwise API + UI investment justified.

---

## Phase 4 — Theme, accessibility & polish (2–3 weeks)

### 4.1 WCAG AA contrast pass

**Article insight:** Original Splitwise orange/teal fails contrast on small text.

**Actions:**

- Audit `globals.css` tokens with contrast checker (target 4.5:1 body, 3:1 large).
- Fix `text-muted`, amber/teal balance text on `bg-card`.
- Document token pairs in `docs/design/ux-improvement-plan.md` appendix.

### 4.2 Dark mode

**Article insight:** Dark mode as first-class customization increases ownership.

**Actions:**

- `prefers-color-scheme` + manual toggle in Settings.
- Duplicate `:root` tokens for `.dark` (background `#1c1917`, card `#292524`, accent `#2dd4bf`).
- Recharts/tooltip/chart grid colors theme-aware.

**Mock:** `07-theme-dark-mode-a11y.excalidraw`

### 4.3 Configurable CTAs & reduced chrome

- Remove duplicate “+” affordances (nav FAB vs header Add) — article notes confusion; keep FAB on mobile, hide header Add on `md-`.
- Group name on every activity row when expense belongs to a group.

---

## Phase 5 — Out of scope / Splitwise-only (document, don’t build)

| Article feature            | Recommendation                                                           |
| -------------------------- | ------------------------------------------------------------------------ |
| In-app UPI / wallet settle | Link out to Splitwise; optional future “payment recorded” badge via sync |
| OTP / mobile login         | Keep Splitwise OAuth                                                     |
| Splitwise Pro paywall      | N/A                                                                      |
| Apple Watch / widgets      | Future; low priority for web companion                                   |

---

## Information architecture (target)

```
Mobile bottom nav:  Home | Friends | [Add] | Groups | Stats
                    (Settings → header avatar/menu)

Web sidebar:        Home, Friends, Groups, Explore, Insights, Settings
```

Explore remains the power-user search surface; **Friends** and **Groups** are the social/balance hubs the article emphasizes.

---

## Implementation priority matrix

| Priority | Item                                | Effort | Impact |
| -------- | ----------------------------------- | ------ | ------ |
| P0       | Balance copy + a11y contrast        | S      | High   |
| P0       | Friends page + API                  | M      | High   |
| P1       | Groups page + Activity/Members tabs | M      | High   |
| P1       | Activity row copy + filters         | S      | Medium |
| P1       | Split breakdown in expense detail   | M      | High   |
| P2       | Web master–detail Explore           | M      | Medium |
| P2       | Dark mode                           | M      | Medium |
| P3       | Multi-step expense create           | L      | Medium |
| P3       | Multi-payer + advanced split write  | L      | Medium |

---

## Success metrics

- Time to answer “who do I owe / who owes me?” (Friends page vs Home scroll).
- Explore filter usage (payment vs expense chips).
- Expense detail engagement (split breakdown expands).
- Accessibility: zero AA failures on primary routes (axe / Lighthouse).
- Optional: session recordings on mobile — bottom nav discoverability.

---

## Mock UI index

| File                                       | Platform | Screen                            |
| ------------------------------------------ | -------- | --------------------------------- |
| `01-mobile-friends-balances.excalidraw`    | Mobile   | Friends list, to get/to pay, CTAs |
| `02-mobile-group-detail.excalidraw`        | Mobile   | Group detail, Activity tab        |
| `03-mobile-activity-feed.excalidraw`       | Mobile   | Activity search + filters         |
| `04-mobile-add-expense-flow.excalidraw`    | Mobile   | 4-step create flow                |
| `05-web-friends-groups-layout.excalidraw`  | Web      | Sidebar + Friends table           |
| `06-web-activity-complex-split.excalidraw` | Web      | Master–detail + split breakdown   |
| `07-theme-dark-mode-a11y.excalidraw`       | Both     | Light vs dark balance card        |

**Regenerate mocks:** `node scripts/generate-ux-mocks.mjs`

---

## Suggested sprint breakdown

**Sprint A:** Copy + contrast + Friends page (mobile cards, web table).  
**Sprint B:** Groups list + detail tabs; nav IA update.  
**Sprint C:** Explore activity filters + row copy + web split pane.  
**Sprint D:** Expense detail split breakdown; dark mode tokens.  
**Sprint E:** Multi-step add expense (equal split only); iterate on write APIs.

---

## Open questions

1. **Bottom nav slot:** Replace Settings with Groups, or use 6-item overflow?
2. **Live balances:** Friends page always hit Splitwise API or cache with sync?
3. **Remind CTA:** Splitwise deep link per friend — verify URL patterns.
4. **Itemized splits:** Does synced expense JSON include enough for breakdown v1?

---

_Last updated: 2026-06-05_
