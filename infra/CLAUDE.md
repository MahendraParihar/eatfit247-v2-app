# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Docker Commands

All commands run from repository root (parent of `infra/`):

```bash
# Build individual images
docker build . -f ./infra/Dockerfile.server -t eatfit-server
docker build . -f ./infra/Dockerfile.admin -t eatfit-admin
docker build . -f ./infra/Dockerfile.client1 -t eatfit-client-1

# Build all images (no cache)
docker compose -f ./infra/docker-compose.yml build --no-cache

# Start/stop services
docker compose -f ./infra/docker-compose.yml up -d
docker compose -f ./infra/docker-compose.yml down

# Health checks
curl http://localhost:3000/api/v2/public/health
curl http://localhost:3001/api/v2/admin/health
```

## Services

| Service | Container | Image | Port |
|---------|-----------|-------|------|
| `public-api` | `eatfit-public-api` | `eatfit-server` | 3000 |
| `admin-api` | `eatfit-admin-api` | `eatfit-server` | 3001 |
| `admin-web` | `eatfit-admin-web` | `eatfit-admin` | 8080→443 |
| `client-web1` | `eatfit-client-web-1` | `eatfit-client-1` | 443 |

Both API services share the same `eatfit-server` image; the `command` field selects which app to run.

## Dockerfiles

| File | Purpose |
|------|---------|
| `Dockerfile.server` | NestJS APIs (Node 22, includes Puppeteer/Chromium for PDF) |
| `Dockerfile.admin` | Angular 20 admin SPA + Nginx |
| `Dockerfile.client1` | Angular 21 public website SSR + Nginx |
| `Dockerfile.setup` | Database initialization container |

## Nginx Configs

| File | Purpose |
|------|---------|
| `nginx-admin.conf` | Admin app reverse proxy |
| `nginx-client1.conf` | Public website SSR reverse proxy |
| `eatfit24by7-admin.conf` | Admin SSL/TLS vhost |
| `eatfit24by71.conf` | Public website SSL/TLS vhost |

## Environment

Copy `main.env.example` to `main.env` and fill in database, JWT, payment gateway, and other credentials.

Shared volume `assets` + bind mount `media-files` provide persistent file storage across containers.

## Utility Scripts

- `init-media-dirs.sh` — Initialize media upload directories
- `backup-media.sh` — Backup media files
