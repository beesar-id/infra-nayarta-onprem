#!/bin/bash
set -e

DB_USER="${DB_USER:-${POSTGRES_USER:-admin}}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${POSTGRES_DB:-postgres}"
export PGPASSWORD="${POSTGRES_PASSWORD:-${DB_PASSWORD}}"

# Detect context
if [ -n "$POSTGRES_DB" ]; then
  # Initdb context
  DB_HOST=""            # EMPTY = unix socket
  WAIT_FOR_DB=false
  echo "Context: docker-entrypoint-initdb.d (unix socket)"
else
  # Restore container context
  DB_HOST="${DB_HOST:-nayarta-postgres}"
  WAIT_FOR_DB=true
  echo "Context: restore container (tcp)"
fi

echo "=== Starting database restoration ==="
echo "User: $DB_USER | DB: $DB_NAME | Host: ${DB_HOST:-socket}"

# Wait ONLY in restore container
if [ "$WAIT_FOR_DB" = true ]; then
  until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" >/dev/null 2>&1; do
    echo "Waiting for PostgreSQL to be ready..."
    sleep 2
  done
fi

# Restore global objects (roles, tablespaces, etc.)
if [ -f /dumps/globals.sql ]; then
    echo "Restoring globals..."
    PGPASSWORD="$PGPASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f /dumps/globals.sql || echo "Warning: Some globals may already exist"
fi

PGPASSWORD="$PGPASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<-EOSQL
    SELECT 'CREATE DATABASE analytics_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'analytics_db')\gexec
EOSQL

echo "=== Database restoration completed! ==="
