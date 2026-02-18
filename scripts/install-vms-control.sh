#!/bin/bash
# Install vms-control-panel as systemd service (vms-control.service).
# Run from project root, or confirm/enter project root when prompted.
# Requires: sudo

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

# Resolve absolute path (works without realpath)
abs_path() {
  local dir="$1"
  if command -v realpath &>/dev/null; then
    realpath -m "$dir"
  else
    (cd "$dir" 2>/dev/null && pwd -P) || echo "$dir"
  fi
}

# --- Root check ---
if [ "$(id -u)" -ne 0 ]; then
  log_error "Script must be run as root (e.g. sudo $0)"
  exit 1
fi

# Project root = current working directory when script was invoked
# Jalankan dari project root: cd /path/to/infra-nayarta-onprem && sudo ./scripts/install-vms-control-service.sh
PROJECT_ROOT="$(abs_path ".")"

WORKDIR="${PROJECT_ROOT}/vms-control-panel"
EXECSTART="${PROJECT_ROOT}/vms-control-panel/vms-control-server"
ENVFILE="${PROJECT_ROOT}/vms-control-panel/.env"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}VMS Control Panel - Systemd Service${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
log_info "Lokasi yang akan dipakai:"
echo "  Project root : $PROJECT_ROOT"
echo "  WorkingDir   : $WORKDIR"
echo "  ExecStart    : $EXECSTART"
echo "  EnvironmentFile : $ENVFILE"
echo "  PROJECT_ROOT (env) : $PROJECT_ROOT"
echo ""
read -p "Apakah lokasi tersebut benar? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  read -p "Masukkan lokasi project root yang benar: " INPUT_ROOT
  INPUT_ROOT="${INPUT_ROOT/#\~/$HOME}"
  INPUT_ROOT="$(abs_path "$INPUT_ROOT")"
  if [ ! -d "$INPUT_ROOT" ]; then
    log_error "Direktori tidak ada: $INPUT_ROOT"
    exit 1
  fi
  PROJECT_ROOT="$INPUT_ROOT"
  WORKDIR="${PROJECT_ROOT}/vms-control-panel"
  EXECSTART="${PROJECT_ROOT}/vms-control-panel/vms-control-server"
  ENVFILE="${PROJECT_ROOT}/vms-control-panel/.env"
  log_info "Menggunakan project root: $PROJECT_ROOT"
fi

if [ ! -d "$WORKDIR" ]; then
  log_error "Direktori vms-control-panel tidak ditemukan: $WORKDIR"
  exit 1
fi
if [ ! -f "$EXECSTART" ]; then
  log_error "Binary tidak ditemukan: $EXECSTART"
  exit 1
fi
if [ ! -x "$EXECSTART" ]; then
  log_warn "Binary ada tapi tidak executable: $EXECSTART"
fi

SERVICE_NAME="vms-control.service"
SERVICE_PATH="/etc/systemd/system/${SERVICE_NAME}"

# Build EnvironmentFile line only if .env exists
ENVFILE_LINE=""
if [ -f "$ENVFILE" ]; then
  ENVFILE_LINE="EnvironmentFile=$ENVFILE"
fi

cat > "$SERVICE_PATH" << EOF
[Unit]
Description=Dashboard Controll Server for nayarta service
After=network.target

[Service]
User=root
Group=root

WorkingDirectory=$WORKDIR

$ENVFILE_LINE
Environment="PROJECT_ROOT=$PROJECT_ROOT"
Environment="PORT=3030"

ExecStart=$EXECSTART

Restart=always
RestartSec=5
LimitNOFILE=65535

StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

log_ok "Service file ditulis: $SERVICE_PATH"
log_info "Daemon reload..."
systemctl daemon-reload
log_info "Enable vms-control.service..."
systemctl enable "$SERVICE_NAME"
log_info "Start vms-control.service..."
systemctl start "$SERVICE_NAME"
log_ok "Service terpasang, di-enable, dan di-start."
echo ""
systemctl status "$SERVICE_NAME" --no-pager || true
echo ""
echo -e "${GREEN}Selesai. Perintah: systemctl status vms-control, journalctl -u vms-control -f${NC}"
