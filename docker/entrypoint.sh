#!/bin/sh
set -e

if [ -n "$DATABASE_URL" ] && [ -f /app/drizzle/meta/_journal.json ]; then
  echo "Running database migrations…"
  tries=0
  until node /app/scripts/migrate.mjs; do
    tries=$((tries + 1))
    if [ "$tries" -ge 30 ]; then
      echo "Migrations failed after 30 attempts."
      exit 1
    fi
    echo "Database not ready, retrying in 2s… ($tries/30)"
    sleep 2
  done
fi

exec "$@"
