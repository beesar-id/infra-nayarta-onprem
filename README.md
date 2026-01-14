# Nayarta VMS - Docker Compose

Super clean dan modular Docker Compose setup dengan **include-based architecture**.

---

### Quick Start

Copy the template and update your configuration:
```bash
cp .env.template .env
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

### Cross-Platform Compatibility (Mac ↔ Linux/Windows WSL)

Project ini dikonfigurasi untuk bekerja dengan baik di Mac, Linux, dan Windows WSL. Semua file konfigurasi menggunakan **LF (Unix) line endings** untuk memastikan kompatibilitas.

#### Setup Otomatis (Recommended)

Project sudah dikonfigurasi dengan:
- **`.gitattributes`** - Memastikan Git selalu menggunakan LF line endings
- **`.editorconfig`** - Memastikan editor menggunakan format yang benar

Editor modern (VS Code, Cursor, dll) akan otomatis menggunakan `.editorconfig`.

#### Normalize Line Endings (Jika Diperlukan)

Jika Anda mengalami masalah dengan line endings (misalnya error "input in flex scanner failed" di PostgreSQL), jalankan script normalisasi:

```bash
# Normalize semua file config
./scripts/normalize-line-endings.sh
```

Atau manual dengan dos2unix (di Linux/WSL):
```bash
# Install dos2unix jika belum ada
sudo apt-get update && sudo apt-get install -y dos2unix

# Normalize file config database
cd database/config
dos2unix postgresql.conf pg_hba.conf
```

#### Setup Git untuk Normalize Existing Files

Setelah setup `.gitattributes`, normalize semua file yang sudah ada:

```bash
# Re-normalize semua file di repository
git add --renormalize .
git commit -m "Normalize line endings to LF"
```

#### Troubleshooting Line Ending Issues

**Error di PostgreSQL:**
```
input in flex scanner failed at file "/etc/postgresql/postgresql.conf" line 1
FATAL: configuration file "/etc/postgresql/postgresql.conf" contains errors
```

**Solusi:**
1. Pastikan file menggunakan LF line endings:
   ```bash
   file database/config/postgresql.conf
   # Should show: "ASCII text" (not "with CRLF line terminators")
   ```

2. Normalize file:
   ```bash
   ./scripts/normalize-line-endings.sh
   ```

3. Restart container:
   ```bash
   docker compose --profile database down
   docker compose --profile database up -d
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

#### NVIDIA Container toolkit
##### 1. Add NVIDIA package repositories
(NVIDIA Docs)[https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html]
```bash
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/libnvidia-container/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/libnvidia-container/$distribution/libnvidia-container.list | \
  sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list

### 2. Install toolkit
sudo apt-get update
sudo apt-get install -y nvidia-container-toolkit

### 3. Configure Docker
sudo nvidia-ctk runtime configure --runtime=docker

### 4. Restart Docker
sudo service docker restart
```

### Disable firewall Windows
```bash
netsh advfirewall set allprofiles state off
```
