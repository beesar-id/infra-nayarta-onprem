# Nayarta VMS - Docker Compose

Super clean dan modular Docker Compose setup dengan **include-based architecture**.

---

### Quick Start

#### 1. Setup Environment Variables

**Option A: Automatic Setup (Recommended)**
```bash
# Run the setup script to automatically detect and set HOST_PROJECT_ROOT
./scripts/setup-env.sh
```

**Option B: Manual Setup**
```bash
# Create .env file from example (if .env.example exists)
cp .env.example .env

# Or create manually and set HOST_PROJECT_ROOT
echo "HOST_PROJECT_ROOT=$(pwd)" >> .env
```

**Important:** `HOST_PROJECT_ROOT` must be set to the absolute path of the project directory. This is required for volume mounts to work correctly.

**To get your current path:**
```bash
pwd
# Example output: /home/username/nayarta-onprem-compose
# Use this value for HOST_PROJECT_ROOT
```

> **Note:**
> You need to update the `HOST_IP` value every time your IP changes.

For run the services
```bash
docker compose --profile appstack up -d   # For VMS
docker compose --profile analytics up -d  # For Analytics
```

For shutdown the services
```bash
docker compose --profile appstack down    # For VMS
docker compose --profile analytics down   # For Analytics
```

Run All Services VMS and Analytics
```bash
docker compose --profile all up -d
```

Shutdown All Services VMS and Analytics
```bash
docker compose --profile all down
```

additional command for debuging
```bash
docker logs <container_name> -f       # For stream container logs use -f flag
```

### Aditional profile command for any services
```bash
docker compose --profile analytics        # For all analytics
docker compose --profile analytics-system # For Clickhouse and Rabbitmq
docker compose --profile pipeline         # For all pipeline service (scheduler, task, firesmome, amqp_bridge)
docker compose --profile firesmoke        # For firesmoke and amqp-bridge
docker compose --profile facesearch       # For facesearch
docker compose --profile scheduler        # For scheduler api and scheduler script
```

### Command for submodule
```bash
git submodule update --init --remote --recursive
git submodule update --init --recursive
git submodule update --remote
git submodule sync --recursive
git submodule status
```

add submodule :
```bash
git submodule add <repo-url> <path/destination>
```

### Additional command
#### Build multi platform support for image

```bash
docker buildx version # Check existing buildx
docker buildx use # to switch if already axist multiple buildx
docker buildx create --use # Create if no exist
docker buildx inspect --bootstrap # to activated

docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t beesar/analytics-scheduler:latest \
  --push \
  .
```

#### Manual Restore Database
```sh
# 1️⃣ Restore global roles & permissions
psql -U admin -d postgres -f /docker-entrypoint-initdb.d/globals.sql

# 2️⃣ Create Database
psql -U admin -d postgres -c "CREATE DATABASE vms_development;"
psql -U admin -d postgres -c "CREATE DATABASE analytics_db;"
psql -U admin -d postgres -c "CREATE DATABASE schedulerdb;"

# 3️⃣ Restore Database
pg_restore -U admin -d vms_development /docker-entrypoint-initdb.d/vms_development.dump
pg_restore -U admin -d analytics_db /docker-entrypoint-initdb.d/analytics_db.dump
pg_restore -U admin -d schedulerdb /docker-entrypoint-initdb.d/schedulerdb.dump
```

## NVIDIA Container toolkit

Script otomatis (cek Docker & Docker Compose, lalu install NVIDIA Container Toolkit):

```sh
sudo ./scripts/install-nvidia-container-toolkit.sh
```

Atau langkah manual berikut.

### 1. Install the prerequisites for the instructions below:
```sh
sudo apt-get update && sudo apt-get install -y --no-install-recommends \
   ca-certificates \
   curl \
   gnupg2
```

### 2. Configure the production repository:
```sh
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg \
  && curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list | \
    sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
    sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list
```

### 3.Update the packages list from the repository:
```sh
sudo apt-get update
```

### 4. Install the NVIDIA Container Toolkit packages:
```sh
export NVIDIA_CONTAINER_TOOLKIT_VERSION=1.18.2-1
  sudo apt-get install -y \
      nvidia-container-toolkit=${NVIDIA_CONTAINER_TOOLKIT_VERSION} \
      nvidia-container-toolkit-base=${NVIDIA_CONTAINER_TOOLKIT_VERSION} \
      libnvidia-container-tools=${NVIDIA_CONTAINER_TOOLKIT_VERSION} \
      libnvidia-container1=${NVIDIA_CONTAINER_TOOLKIT_VERSION}
```

### 5. Configure the container runtime by using the nvidia-ctk command:
```sh
sudo nvidia-ctk runtime configure --runtime=docker
sudo systemctl restart docker
```

### Convert config file to unix
```bash
dos2unix /file/config.conf
```
