FROM cloudflare/cloudflared:latest

# Token is injected at runtime via TUNNEL_TOKEN (Railway variable or docker compose).
ENTRYPOINT ["cloudflared", "tunnel", "--no-autoupdate", "run"]
