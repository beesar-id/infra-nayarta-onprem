#!/bin/bash
# Install Docker, Docker Compose (if missing), then NVIDIA Container Toolkit.
# Target: Debian/Ubuntu. Run with: sudo ./scripts/install-container-toolkit.sh

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

# --- Root check ---
if [ "$(id -u)" -ne 0 ]; then
  log_error "Script must be run as root (e.g. sudo $0)"
  exit 1
fi

# --- OS check (Debian/Ubuntu) ---
if ! command -v apt-get &>/dev/null; then
  log_error "This script requires apt-get (Debian/Ubuntu)."
  exit 1
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Docker + Docker Compose + NVIDIA CTK${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# ========== 1. Docker ==========
install_docker() {
  log_info "Installing Docker..."
  apt-get update -qq
  apt-get install -y --no-install-recommends ca-certificates curl gnupg

  # Detect distro for Docker repo (Debian or Ubuntu)
  if [ -f /etc/os-release ]; then
    . /etc/os-release
    case "$ID" in
      ubuntu) DOCKER_DISTRO="ubuntu" ;;
      debian) DOCKER_DISTRO="debian" ;;
      *)
        log_error "Unsupported distro: $ID. Only Debian/Ubuntu are supported for Docker install."
        exit 1
        ;;
    esac
    DOCKER_CODENAME="${VERSION_CODENAME:-$VERSION_ID}"
  else
    log_error "Cannot detect OS (no /etc/os-release)."
    exit 1
  fi

  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL "https://download.docker.com/linux/${DOCKER_DISTRO}/gpg" | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg

  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/${DOCKER_DISTRO} ${DOCKER_CODENAME} stable" \
    | tee /etc/apt/sources.list.d/docker.list > /dev/null

  apt-get update -qq
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  systemctl enable --now docker
  log_ok "Docker installed."
}

if ! command -v docker &>/dev/null; then
  log_warn "Docker not found. Installing Docker..."
  install_docker
else
  log_ok "Docker already installed: $(docker --version)"
fi

# ========== 2. Docker Compose ==========
# Prefer plugin: docker compose
if docker compose version &>/dev/null; then
  log_ok "Docker Compose (plugin) already available: $(docker compose version --short 2>/dev/null || docker compose version)"
elif command -v docker-compose &>/dev/null; then
  log_ok "Docker Compose (standalone) already installed: $(docker-compose --version)"
else
  log_warn "Docker Compose not found. Installing Docker Compose plugin..."
  if command -v docker &>/dev/null; then
    # If we just installed Docker, plugin is usually already there; try installing plugin explicitly
    apt-get update -qq
    apt-get install -y docker-compose-plugin 2>/dev/null || install_docker
  else
    install_docker
  fi
  if docker compose version &>/dev/null; then
    log_ok "Docker Compose (plugin) installed."
  else
    log_error "Docker Compose still not available. Install manually: https://docs.docker.com/compose/install/"
    exit 1
  fi
fi

# ========== 3. NVIDIA Container Toolkit ==========
log_info "Checking NVIDIA Container Toolkit..."

if command -v nvidia-ctk &>/dev/null; then
  log_ok "NVIDIA Container Toolkit already installed: $(nvidia-ctk --version 2>/dev/null || true)"
  read -p "Reinstall/configure NVIDIA Container Toolkit anyway? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_info "Skipping NVIDIA Container Toolkit installation."
    exit 0
  fi
fi

log_info "Installing prerequisites for NVIDIA Container Toolkit..."
apt-get update -qq
apt-get install -y --no-install-recommends ca-certificates curl gnupg2

log_info "Configuring NVIDIA Container Toolkit repository..."
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list | \
  sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
  tee /etc/apt/sources.list.d/nvidia-container-toolkit.list > /dev/null

log_info "Updating package list..."
apt-get update -qq

NVIDIA_CONTAINER_TOOLKIT_VERSION="${NVIDIA_CONTAINER_TOOLKIT_VERSION:-1.18.2-1}"
log_info "Installing NVIDIA Container Toolkit ${NVIDIA_CONTAINER_TOOLKIT_VERSION}..."
apt-get install -y \
  nvidia-container-toolkit="${NVIDIA_CONTAINER_TOOLKIT_VERSION}" \
  nvidia-container-toolkit-base="${NVIDIA_CONTAINER_TOOLKIT_VERSION}" \
  libnvidia-container-tools="${NVIDIA_CONTAINER_TOOLKIT_VERSION}" \
  libnvidia-container1="${NVIDIA_CONTAINER_TOOLKIT_VERSION}"

log_info "Configuring container runtime (Docker)..."
nvidia-ctk runtime configure --runtime=docker

log_info "Restarting Docker..."
systemctl restart docker

log_ok "NVIDIA Container Toolkit installed and configured."
echo ""
echo -e "${GREEN}Done. Verify with: sudo docker run --rm --gpus all nvidia/cuda:12.6.3-base-ubuntu24.04 nvidia-smi"
