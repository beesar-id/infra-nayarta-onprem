# Nayarta Docker Dashboard

Dashboard berbasis web untuk monitoring dan mengelola Docker containers menggunakan Bun + Hono (backend) dan React (frontend).

## Fitur

- ✅ Monitor semua container Docker yang terkait dengan project Nayarta
- ✅ Filter container berdasarkan profile (appstack, analytics-tools, app, stream)
- ✅ Kontrol docker compose dengan profile tertentu (up/down)
- ✅ Kontrol individual container (start/stop/restart)
- ✅ Tampilan detail container
- ✅ Auto-refresh setiap 5 detik

## Struktur Project

```
dashboard/
├── server/          # Backend (Bun + Hono)
│   ├── index.ts     # Main server file
│   └── package.json
└── client/          # Frontend (React + Vite)
    ├── src/
    │   ├── components/
    │   ├── services/
    │   └── App.tsx
    └── package.json
```

## Setup

### Prerequisites

- [Bun](https://bun.sh) - Runtime JavaScript yang cepat
- Node.js (untuk React development)
- Docker & Docker Compose

### Backend Setup

```bash
cd dashboard/server
bun install
bun run dev
```

Server akan berjalan di `http://localhost:3001`

### Frontend Setup

```bash
cd dashboard/client
npm install
npm run dev
```

Frontend akan berjalan di `http://localhost:3000`

## Konfigurasi

### Backend Environment Variables

Buat file `.env` di folder `dashboard/server/`:

```env
PORT=3001
PROJECT_ROOT=/path/to/nayarta-onprem-compose
```

### Frontend Environment Variables (Optional)

Buat file `.env` di folder `dashboard/client/` jika API URL berbeda:

```env
VITE_API_URL=http://localhost:3001
```

## API Endpoints

### GET `/api/profiles`
Mendapatkan daftar semua profile yang tersedia.

### GET `/api/containers?profile={profile}`
Mendapatkan daftar containers. Query parameter `profile` opsional.

### POST `/api/compose/:profile/:action`
Menjalankan docker compose command.
- `profile`: appstack | analytics-tools | app | stream
- `action`: up | down

### POST `/api/containers/:id/:action`
Kontrol container individual.
- `action`: start | stop | restart | remove

### GET `/api/containers/:id`
Mendapatkan detail container.

### GET `/api/containers/:id/logs?tail=100`
Mendapatkan logs container.

## Profile yang Tersedia

1. **appstack** - Semua aplikasi stack
2. **analytics-tools** - Tools analytics (RabbitMQ, ClickHouse, dll)
3. **app** - Aplikasi utama (API, Admin, Frontend)
4. **stream** - Streaming services (MediaMTX, EMQX, dll)

## Penggunaan

1. Buka dashboard di browser: `http://localhost:3000`
2. Pilih profile dari dropdown untuk filter containers
3. Gunakan tombol "Up" atau "Down" untuk menjalankan/menghentikan semua container dalam profile
4. Gunakan tombol kontrol individual pada setiap container card untuk start/stop/restart
5. Klik "Details" untuk melihat informasi lebih lanjut tentang container

## Development

### Backend
```bash
cd dashboard/server
bun run dev  # Development dengan hot reload
bun run start  # Production
```

### Frontend
```bash
cd dashboard/client
npm run dev  # Development server
npm run build  # Build untuk production
npm run preview  # Preview production build
```

## Catatan Keamanan

⚠️ **PENTING**: Dashboard ini memberikan akses kontrol penuh ke Docker containers. Pastikan:
- Hanya dijalankan di lingkungan development/testing
- Jangan expose ke internet tanpa autentikasi
- Pertimbangkan menambahkan autentikasi untuk production use

## Troubleshooting

### Error: Cannot connect to Docker
Pastikan Docker daemon sedang berjalan dan user memiliki akses ke Docker socket.

### Error: PROJECT_ROOT not found
Pastikan `PROJECT_ROOT` di `.env` mengarah ke root directory project nayarta-onprem-compose.

### Containers tidak muncul
Pastikan containers memiliki nama atau image yang mengandung keyword "nayarta" atau sesuai dengan filter profile.


