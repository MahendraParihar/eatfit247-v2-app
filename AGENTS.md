# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project-Specific Guides

Each project has its own AGENTS.md with detailed build commands, architecture, and conventions:

- [server_1/AGENTS.md](server_1/AGENTS.md) — NestJS backend API (admin-api :3001 + public-api :3000)
- [eatfit247-admin/AGENTS.md](eatfit247-admin/AGENTS.md) — Angular 20 admin CMS
- [eatfit247-web-1/AGENTS.md](eatfit247-web-1/AGENTS.md) — Angular 21 public website with SSR
- [infra/AGENTS.md](infra/AGENTS.md) — Docker, Nginx, deployment infrastructure

## Monorepo Overview

EatFit247 v2 is a health & nutrition coaching platform. The monorepo contains:

| Project | Tech | Dev Port | Purpose |
|---------|------|----------|---------|
| `server_1` | NestJS 11, PostgreSQL, Sequelize, Redis | 3000/3001 | Two REST APIs (public + admin) |
| `eatfit247-admin` | Angular 20, Material, NX | 4200 | Internal admin CMS (NgModule-based SPA) |
| `eatfit247-web-1` | Angular 21, SSR, Material, NX | 4200 | Public website (standalone, zoneless) |
| `shared-library` | Pure TypeScript | — | Shared interfaces, enums, utilities |
| `infra` | Docker, Nginx | — | Container orchestration & deployment |
| `db_changes` | SQL | — | Database migration scripts (113+ files) |

## Development Setup Order

1. **shared-library** first — all other projects depend on it
2. **server_1** — starts backend APIs
3. **eatfit247-admin** or **eatfit247-web-1** — start frontend(s)

```bash
# 1. Build shared library
cd shared-library && npm install && npm run build

# 2. Start backend (both APIs)
cd server_1 && npm install && npm start

# 3. Start admin CMS (in separate terminal)
cd eatfit247-admin && npm install && npm start

# 4. Start public website (in separate terminal)
cd eatfit247-web-1 && npm install && npm start
```

## Shared Library

Pure TypeScript library providing interfaces, enums, and utilities shared between frontend and backend.

```bash
cd shared-library
npm run build     # one-time compile
npm run dev       # watch mode
```

Import path across all projects: `@eatfit247-shared-lib`

Any interface used by both frontend and backend **must** be defined here. Frontend-only or backend-only interfaces stay in their respective projects.

## Cross-Project Conventions

- **TypeScript only** — never create `.js` files
- **No `any` keyword** — always use typed interfaces
- **Database columns**: `snake_case` (camelCase mapping in service/repository layer)
- **Model naming**: `mst-*` = master/lookup, `txn-*` = transactional
- **Architecture**: Controller → Service → Repository → Database
- **Angular components**: Always create `.html` and `.scss` files alongside `.ts`
- **Angular styling**: No hardcoded colors — use CSS custom properties (`var(--mat-*)`)
- **Angular Material**: Always use Material components, never raw HTML equivalents
- **Standalone components with `inject()`**: Preferred over constructor injection
- **Backend layer enforcement**: NX module boundaries prevent circular deps. Run `npx nx graph` to verify.
- **NX generators**: Use `npx nx g feature-module` / `npx nx g master-table` — never create modules manually

## Environment Setup

```bash
# Backend env
cp server_1/.env.example server_1/.env

# Docker env
cp infra/main.env.example infra/main.env
```

Required: PostgreSQL, Redis, Node.js 22+

## Docker (Full Stack)

```bash
docker compose -f ./infra/docker-compose.yml build --no-cache
docker compose -f ./infra/docker-compose.yml up -d
```
