#!/usr/bin/env sh
set -e

# ensure DATABASE_URL is provided
: "${DATABASE_URL:?Need to set DATABASE_URL}"

# extract host and port from the URL
# DATABASE_URL is of the form: postgresql://user:pass@host:port/db
PATTERN='postgresql://[^@]+@([^:]+):([0-9]+)/.*'
if echo "$DATABASE_URL" | grep -Eq "$PATTERN"; then
  DB_HOST=$(echo "$DATABASE_URL" | sed -r "s#$PATTERN#\\1#")
  DB_PORT=$(echo "$DATABASE_URL" | sed -r "s#$PATTERN#\\2#")
else
  echo "⚠️  Could not parse host/port from DATABASE_URL: $DATABASE_URL"
  exit 1
fi

echo "⏳ Waiting for Postgres at tcp:${DB_HOST}:${DB_PORT}…"
npx wait-on "tcp:${DB_HOST}:${DB_PORT}" --timeout 60000

echo "🚀 Running Prisma migrations…"
npx prisma migrate deploy

echo "🎉 Starting app…"

# If no arguments passed, default to npm start
if [ $# -eq 0 ]; then
    exec npm start
else
    exec "$@"
fi