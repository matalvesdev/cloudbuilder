---
name: cloudbuilder-docker
description: Use when working with Docker, docker-compose, or container configuration for CloudBuilder. Covers multi-service setup, Dockerfiles, and best practices.
license: MIT
compatibility: opencode
metadata:
  stack: docker
---

# CloudBuilder Docker

## Services (docker-compose.yml)
- **PostgreSQL** — primary database (port 5432)
- **Backend** — Spring Boot API (port 8080)
- **Frontend** — Vite dev server (port 5173) or nginx production build
- **Engine** — Go provision engine (CLI, not a service)

## Dockerfiles Location
- `docker/backend.Dockerfile` — Java 21 + Maven multi-stage build
- `docker/frontend.Dockerfile` — Node 22 + nginx multi-stage build
- `docker/engine.Dockerfile` — Go 1.22 build

## Best Practices
- Multi-stage builds for small final images
- Use distroless or alpine base images for production
- Health checks on all services
- Named volumes for PostgreSQL data persistence
- Environment variables via .env file (not committed to git)
- Docker Compose profiles for dev/test/prod

## Development
```bash
docker compose up -d              # Start all services
docker compose up -d postgres     # Start only database
docker compose logs -f backend    # Follow backend logs
docker compose down               # Stop all services
```

## Production Build
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Network
- Internal bridge network `cloudbuilder-net`
- Backend accessible to frontend via `backend:8080`
- Frontend served on port 80 in production
- PostgreSQL not exposed externally in production
