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

# Create databases if they don't exist
PGPASSWORD="$PGPASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<-EOSQL
    SELECT 'CREATE DATABASE analytics_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'analytics_db')\gexec
    SELECT 'CREATE DATABASE schedulerdb' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'schedulerdb')\gexec
    SELECT 'CREATE DATABASE vms_development' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'vms_development')\gexec
EOSQL

# Restore database dumps
# # if [ -f /dumps/analytics_db.dump ]; then
# #     echo "Restoring analytics_db..."
# #     pg_restore -U "$DB_USER" -d analytics_db --no-owner --no-acl --if-exists -c /dumps/analytics_db.dump 2>/dev/null || echo "Restore completed with some warnings (normal)"
# # fi

if [ -f /dumps/schedulerdb.dump ]; then
    echo "Restoring schedulerdb..."
    PGPASSWORD="$PGPASSWORD" pg_restore -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d schedulerdb --no-owner --no-acl --if-exists -c /dumps/schedulerdb.dump 2>/dev/null || echo "Restore completed with some warnings (normal)"
fi

if [ -f /dumps/vms_development.dump ]; then
    echo "Restoring vms_development..."
    PGPASSWORD="$PGPASSWORD" pg_restore -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d vms_development --no-owner --no-acl --if-exists -c /dumps/vms_development.dump 2>/dev/null || echo "Restore completed with some warnings (normal)"
fi

echo "=== Database restoration completed! ==="