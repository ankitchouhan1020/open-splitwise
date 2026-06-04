#!/bin/sh
set -e

if [ -n "$DATABASE_URL" ]; then
  echo "Waiting for Postgres..."
  until pg_isready -h postgres -U open_splitwise -d open_splitwise >/dev/null 2>&1; do
    sleep 2
  done
  echo "Postgres is ready."
  # US-005: run database migrations here (e.g. pnpm db:migrate)
fi

exec "$@"
