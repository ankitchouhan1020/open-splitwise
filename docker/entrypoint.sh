#!/bin/sh
set -e

if [ -n "$DATABASE_URL" ]; then
  echo "Waiting for Postgres..."
  until pg_isready -h postgres -U open_splitwise -d open_splitwise >/dev/null 2>&1; do
    sleep 2
  done
  echo "Postgres is ready."
  if [ -f /app/drizzle/meta/_journal.json ]; then
    echo "Running database migrations…"
    node /app/scripts/migrate.mjs
  fi
fi

exec "$@"
