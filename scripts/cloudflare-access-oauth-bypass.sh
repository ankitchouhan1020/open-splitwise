#!/usr/bin/env bash
# Wrapper — prefer: pnpm cloudflare:access-oauth-bypass
set -euo pipefail
exec node "$(dirname "$0")/cloudflare-access-oauth-bypass.mjs" "$@"
