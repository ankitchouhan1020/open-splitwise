# open-splitwise

**Analytics & search companion for Splitwise** — connect via the [Splitwise API](https://dev.splitwise.com/), sync expenses locally, and get Pro-style search, filters, and spending insights without leaving the Splitwise platform for splitting and settlements.

Product spec: [`tasks/prd-open-splitwise.md`](tasks/prd-open-splitwise.md) (locked: **1A, 2A, 3C, 4A, 5B**)

Ralph tasks: [`scripts/ralph/prd.json`](scripts/ralph/prd.json) — 17 stories on branch `ralph/open-splitwise-mvp`

Built with [Ralph](https://github.com/snarktank/ralph) for autonomous, story-by-story implementation.

## Local development

**Requirements:** Node 20+, pnpm 9+

```bash
cp .env.example .env.local   # fill SESSION_SECRET and OAuth when ready
pnpm install
pnpm dev                     # http://localhost:3000
```

**Quality checks:**

```bash
pnpm typecheck
pnpm lint
```

**Health check:** `GET http://localhost:3000/api/health` → `{ "ok": true }`

## Self-hosted (Docker)

1. Register a Splitwise OAuth app at [dev.splitwise.com](https://dev.splitwise.com/).
2. Set redirect URI to `http://localhost:3000/api/auth/splitwise/callback` (or your public URL).
3. Configure environment:

```bash
cp .env.example .env
# Set SESSION_SECRET (openssl rand -base64 32)
# Set SPLITWISE_CLIENT_ID and SPLITWISE_CLIENT_SECRET
```

4. Start stack:

```bash
docker compose up --build
```

App waits for Postgres (`pg_isready`) before starting. Database migrations are added in US-005.

## Ralph setup (installed)

| Path                             | Purpose                                |
| -------------------------------- | -------------------------------------- |
| `scripts/ralph/ralph.sh`         | Agent loop (Amp or Claude Code)        |
| `scripts/ralph/prompt.md`        | Prompt for Amp                         |
| `scripts/ralph/CLAUDE.md`        | Prompt for Claude Code                 |
| `scripts/ralph/prd.json.example` | Example task format                    |
| `skills/prd/`                    | Generate PRDs → `tasks/prd-*.md`       |
| `skills/ralph/`                  | Convert PRD → `scripts/ralph/prd.json` |

### Prerequisites

- **Git** — initialized in this repo (required by Ralph)
- **`jq`** — `brew install jq` (already typical on macOS with Homebrew)
- **One AI CLI** (pick one):
  - [Amp CLI](https://ampcode.com/) — default for `ralph.sh`
  - [Claude Code](https://docs.anthropic.com/en/docs/claude-code) — `npm install -g @anthropic-ai/claude-code`

Optional: install Ralph skills globally for Claude Code:

```bash
mkdir -p ~/.claude/skills
cp -r skills/prd skills/ralph ~/.claude/skills/
```

In Cursor, you can use the same skills from `skills/` in chat (e.g. “create a prd for …”, “convert this prd to ralph format”).

### Workflow

1. **Create a PRD** — ask the agent to use the `prd` skill; output goes to `tasks/prd-<feature>.md`.
2. **Convert to Ralph JSON** — use the `ralph` skill on that file → `scripts/ralph/prd.json`.
3. **Run the loop** from the repo root:

```bash
# Amp (default), 10 iterations
./scripts/ralph/ralph.sh

# Claude Code
./scripts/ralph/ralph.sh --tool claude 10
```

Ralph picks one story per iteration, commits when checks pass, updates `prd.json` and `progress.txt`, and stops when all stories have `passes: true` (`<promise>COMPLETE</promise>`).

### Debug state

```bash
cat scripts/ralph/prd.json | jq '.userStories[] | {id, title, passes}'
cat scripts/ralph/progress.txt
git log --oneline -10
```

## License

Add your license when you publish the app.
