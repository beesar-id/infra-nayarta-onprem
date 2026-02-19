#!/bin/bash
# Initial setup: pull images, start database + clickhouse, then run migrations with logs.
# Run from project root: ./scripts/initial-setup.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()  { echo -e "${BLUE}[INFO]${NC} $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Nayarta Initial Setup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
log_info "Project root: $PROJECT_ROOT"
echo ""

if [ ! -f ".env" ]; then
  log_error ".env file not found. Run first: ./scripts/setup-env.sh"
  exit 1
fi

if ! command -v docker &>/dev/null; then
  log_error "Docker not found. Install Docker first."
  exit 1
fi

if ! docker compose version &>/dev/null; then
  log_error "Docker Compose not available. Install Docker Compose plugin."
  exit 1
fi

# Create network if it does not exist (required: external nayarta-network)
if ! docker network inspect nayarta-network &>/dev/null; then
  log_info "Creating network nayarta-network..."
  docker network create nayarta-network
  log_ok "Network nayarta-network created."
else
  log_ok "Network nayarta-network already exists."
fi
echo ""

# 1. Pull all images
log_info "Step 1/6: Pull images (--profile all)..."
docker compose --profile all pull
log_ok "Pull complete."
echo ""

# 2. Start database (postgres, etc.)
log_info "Step 2/6: Start database (--profile database)..."
docker compose --profile database up -d
log_ok "Database stack is running."
echo ""

# 3. Start ClickHouse
log_info "Step 3/6: Start ClickHouse (--profile clickhouse)..."
docker compose --profile clickhouse up -d
log_ok "ClickHouse is running."
echo ""

# 4. Start storage (MinIO), then run minio-init (init container is removed when done)
log_info "Step 4/6: Start storage MinIO (--profile storage)..."
docker compose --profile storage up -d minio
log_ok "MinIO is running."
log_info "Waiting for MinIO to be healthy (healthcheck)..."
for i in 1 2 3 4 5 6 7 8 9 10; do
  if docker inspect -f '{{.State.Health.Status}}' nayarta-minio 2>/dev/null | grep -q healthy; then
    log_ok "MinIO is ready."
    break
  fi
  [ "$i" -eq 10 ] && { log_error "MinIO did not become healthy within the wait time."; exit 1; }
  sleep 5
done
log_info "Running minio-init (buckets, user, policy)..."
docker compose --profile storage run --rm minio-init
log_ok "minio-init complete, container removed."
echo ""

# Wait for Postgres and ClickHouse to be ready
log_info "Waiting 15 seconds for databases to be ready..."
sleep 15
echo ""

# 5. Run migration and show logs (foreground)
log_info "Step 5/6: Run migration (--profile migration), showing logs..."
docker compose --profile migration up

# 6. Remove migration containers when done
log_info "Step 6/6: Removing migration containers..."
docker compose --profile migration down --remove-orphans
log_ok "Migration containers removed."

echo ""
log_ok "Initial setup complete."
