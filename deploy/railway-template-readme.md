# Deploy and Host Open Splitwise on Railway

Self-hosted [Splitwise](https://splitwise.com) companion: sync expenses locally, then search, filter, and chart your data. Settling up still happens in Splitwise.

## About Hosting

This template provisions **PostgreSQL**, the **open-splitwise** Next.js app, and a **cloudflared** sidecar in one Railway project. The app builds from the repo [Dockerfile](https://github.com/ankitchouhan1020/open-splitwise/blob/main/Dockerfile); the tunnel builds from [`deploy/cloudflared`](https://github.com/ankitchouhan1020/open-splitwise/tree/main/deploy/cloudflared).

## Why Deploy

- Keep a private copy of your Splitwise expenses for search, filters, CSV export, and charts
- Multi-tenant: several Splitwise accounts can share one deployment with isolated data
- Expose the app via **Cloudflare Tunnel** (outbound-only) instead of a public Railway URL

## Common Use Cases

- Personal expense exploration and insights beyond the Splitwise mobile app
- Self-hosted analytics for shared households or roommates
- Production on Railway behind a custom Cloudflare hostname ([full tunnel guide](https://github.com/ankitchouhan1020/open-splitwise/blob/main/docs/cloudflare-tunnel.md))

## Dependencies for

### Deployment Dependencies

| Service | Notes |
| ------- | ----- |
| **Postgres** | Private network; `DATABASE_URL` wired automatically |
| **open-splitwise** | GitHub repo `ankitchouhan1020/open-splitwise` |
| **cloudflared** | Same repo, `deploy/cloudflared` — needs `TUNNEL_TOKEN` |

**You must provide:**

- `TUNNEL_TOKEN` — Cloudflare Zero Trust → **Networks** → **Tunnels** → **Configure** → Install connector
- `SPLITWISE_CLIENT_ID` and `SPLITWISE_CLIENT_SECRET` from [secure.splitwise.com/apps](https://secure.splitwise.com/apps)
- Cloudflare tunnel public hostname → `open-splitwise.railway.internal:3000` (see [cloudflare-tunnel.md](https://github.com/ankitchouhan1020/open-splitwise/blob/main/docs/cloudflare-tunnel.md))
- Set `APP_URL` and `SPLITWISE_REDIRECT_URI` to your Cloudflare hostname (not `*.up.railway.app`)

**After deploy:** remove public Railway domains from the app service if using the tunnel only → **Settings** → **Connect Splitwise** → **Sync**.
