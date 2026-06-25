# ADR-030: Production Readiness & Platform Stabilization

**Status**: Proposed
**Date**: 2026-06-22
**Author**: Platform Engineering Team

## Context

CloudBuilder has completed all 8 sprints of Release 1 (Foundation) and is entering Release 2 (Operations). The platform has:

- 54 frontend module files across 12 modules
- 200+ backend Java files across 16 Modulith modules  
- 479 JUnit tests (473 passing, 6 pre-existing failures)
- 62 Vitest frontend tests (all passing)
- 23 Go engine tests (all passing)
- 5 Playwright E2E smoke tests (all passing)
- Docker Compose with 3 services (PostgreSQL, Backend, Frontend)

However, several production readiness gaps exist:

1. **No health check endpoints** beyond basic Spring Actuator
2. **No startup probes or liveness checks** in Docker Compose
3. **No resource limits** in Docker Compose (containers can consume all host resources)
4. **No backup strategy** for PostgreSQL
5. **No monitoring/alarming** for platform infrastructure
6. **No CI/CD pipeline** beyond basic build/test (no deployment automation)
7. **No disaster recovery plan** for the platform itself (as opposed to infra provisioned by the platform)
8. **No performance baseline** under load
9. **6 pre-existing backend test failures** not investigated

The roadmap specifies Sprint 30 (Platform Stabilization) as the final sprint, but many of these items are prerequisites for production deployment.

## Problem

How to achieve production readiness for CloudBuilder, addressing:

1. **Reliability**: Health checks, probes, resource limits, graceful shutdown
2. **Data safety**: PostgreSQL backup/restore, migration safety
3. **Observability of the platform itself**: Dogfooding our own Native Observability (ADR-008)
4. **Deployment automation**: CI/CD for staging and production
5. **Incident response**: Runbooks, escalation, post-mortem process
6. **Test stability**: Fix pre-existing test failures; add integration tests for critical paths
7. **Documentation**: Runbooks, architecture diagrams, user guides
8. **Security baseline**: Before production, ensure TLS, secrets, and access controls are in place (ADR-028)

## Alternatives Considered

| Alternative | Pros | Cons |
|-------------|------|------|
| **Phased production rollout (chosen)** | Lower risk; incremental value | Longer to full production readiness |
| **Big-bang production launch** | Faster to market | High risk; no gradual validation |
| **Beta program first** | Real user feedback | Delays GA; requires support |
| **Keep as internal tool only** | Avoids production complexity | Contradicts product vision and roadmap |

**Rationale for phased rollout**: CloudBuilder is a platform engineering tool — its users depend on it for infrastructure. A phased approach (internal → beta → GA) builds confidence through real usage before full production commitment.

## Decision

### 1. Docker Compose Production Hardening

```yaml
# docker-compose.yml — production-ready version
services:
  postgres:
    image: postgres:16-alpine
    ports: ["5432:5432"]
    environment:
      POSTGRES_DB: cloudbuilder
      POSTGRES_USER: cloudbuilder
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?}
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./backend/src/main/resources/db/migration:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U cloudbuilder"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '1.0'
    restart: unless-stopped

  backend:
    build: ./backend
    ports: ["8080:8080"]
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/cloudbuilder
      SPRING_DATASOURCE_USERNAME: cloudbuilder
      SPRING_DATASOURCE_PASSWORD: ${POSTGRES_PASSWORD:?}
      CLOUDBUILDER_MASTER_KEY: ${CLOUDBUILDER_MASTER_KEY:-}
      CLOUDBUILDER_JWT_SECRET: ${CLOUDBUILDER_JWT_SECRET:?}
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '2.0'
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    environment:
      VITE_API_URL: /api
    depends_on:
      - backend
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          memory: 256M
          cpus: '0.5'
    restart: unless-stopped

volumes:
  pgdata:
```

### 2. PostgreSQL Backup & Recovery

```bash
#!/bin/bash
# scripts/backup.sh — automated PostgreSQL backup

BACKUP_DIR=/var/backups/cloudbuilder
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Full backup
pg_dump -h $PGHOST -U $PGUSER -d $PGDATABASE \
  --format=custom \
  --file="$BACKUP_DIR/full_${TIMESTAMP}.dump"

# Transaction log archive (WAL)
pg_archivecleanup /var/lib/postgresql/data/pg_wal $RETENTION_DAYS

# Cleanup old backups
find $BACKUP_DIR -name "full_*.dump" -mtime +$RETENTION_DAYS -delete

# Verify backup integrity
pg_restore --list "$BACKUP_DIR/full_${TIMESTAMP}.dump" > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✅ Backup verified: full_${TIMESTAMP}.dump"
else
  echo "❌ Backup corrupted: full_${TIMESTAMP}.dump"
  exit 1
fi
```

**Recovery Time Objective (RTO)**: 1 hour
**Recovery Point Objective (RPO)**: 5 minutes (via WAL archiving + pg_dump every 6 hours)

### 3. Platform Health Dashboard

Dogfood our own Native Observability (ADR-008) to monitor the CloudBuilder platform itself:

```typescript
// Platform health dashboard — ObserveModule tab
interface PlatformHealth {
    services: {
        postgres: { status: "UP" | "DOWN"; latency: number; connections: number };
        backend: { status: "UP" | "DOWN"; heap: number; uptime: number };
        frontend: { status: "UP" | "DOWN"; version: string };
    };
    database: {
        poolSize: number;
        activeConnections: number;
        migrationVersion: number;
        pendingMigrations: number;
    };
    recentIncidents: Array<{
        timestamp: string;
        severity: string;
        description: string;
    }>;
}
```

### 4. CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml — deployment pipeline
name: Deploy to Production
on:
  push:
    tags:
      - 'v*'  # Trigger on version tags

jobs:
  test:
    # ... existing test jobs ...

  build-and-push:
    needs: [test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build backend Docker image
        run: docker build -t cloudbuilder/backend:${{ github.ref_name }} ./backend
      - name: Build frontend Docker image
        run: docker build -t cloudbuilder/frontend:${{ github.ref_name }} ./frontend
      - name: Push to registry
        run: |
          docker push cloudbuilder/backend:${{ github.ref_name }}
          docker push cloudbuilder/frontend:${{ github.ref_name }}

  deploy-staging:
    needs: [build-and-push]
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to staging
        run: |
          # SSH to staging host
          ssh cloudbuilder-staging "docker-compose pull && docker-compose up -d"
      - name: Smoke test staging
        run: |
          sleep 30  # Wait for services to start
          curl -f http://staging.cloudbuilder.io/api/v1/actuator/health
          curl -f http://staging.cloudbuilder.io/ | grep "CloudBuilder"

  deploy-production:
    needs: [deploy-staging]
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to production (rolling update)
        run: |
          ssh cloudbuilder-prod "docker-compose pull && docker-compose up -d --no-deps"
```

### 5. Pre-existing Test Failure Investigation

The 6 pre-existing backend test failures must be triaged and resolved:

| Test | Module | Likely Root Cause | Priority |
|------|--------|-------------------|----------|
| GaCDetectorTest — Dockerfile extension | provision | File extension detection edge case | Medium |
| PropertyMappingServiceTest — first-5-raw limit | provision | Test expects 5 but gets different count | Low |
| TerraformImportServiceTest — module warning | provision | Assertion on warning message format | Low |
| GitHubOAuthServiceTest — null clientId | github | Missing test mock for null clientId | High |
| (2 more) | provision | Undetermined | Medium |

### 6. Runbooks & Documentation

Create runbooks for the following scenarios:

| Runbook | Content | Priority |
|---------|---------|----------|
| **Production deployment** | Steps to deploy a new version; rollback procedure | P0 |
| **Database recovery** | Restore from backup; point-in-time recovery | P0 |
| **Service outage** | Diagnose and recover from backend/frontend/DB outage | P0 |
| **Secret rotation** | Rotate master encryption key, JWT secret, DB password | P1 |
| **Capacity planning** | Monitor disk, memory, CPU; scale up procedure | P1 |
| **Incident post-mortem** | Template for post-incident analysis | P1 |

### 7. Production Checklist

Before GA launch, verify all items:

- [ ] **Health checks**: All 3 services have Docker health checks
- [ ] **Resource limits**: CPU/memory limits configured
- [ ] **Backup**: Automated pg_dump + WAL archiving running
- [ ] **Restore test**: Backup successfully restored in staging environment
- [ ] **TLS**: HTTPS enabled with Let's Encrypt (ADR-028)
- [ ] **Secrets**: Master encryption key configured (ADR-028)
- [ ] **Rate limiting**: Enabled on auth endpoints (ADR-028)
- [ ] **Session security**: httpOnly cookies, refresh rotation (ADR-028)
- [ ] **CI/CD**: Automated deploy pipeline to staging
- [ ] **Tests**: All backend tests passing (0 pre-existing failures)
- [ ] **Performance**: Baseline established under load (k6)
- [ ] **Runbooks**: P0 runbooks documented and tested
- [ ] **Monitoring**: Platform health dashboard active
- [ ] **Alerts**: Alert rules configured for service health
- [ ] **Backup verification**: Weekly automated restore test

### 8. Phased Rollout Plan

```
Phase 1 — Internal (Sprint 22-23, Q1 2027)
- Deploy to staging environment
- Dogfood: team uses CloudBuilder for internal infra
- Fix discovered issues
- Duration: 4 weeks

Phase 2 — Beta (Sprint 24-27, Q1 2027)
- Invite 5-10 beta customers
- SSO + SCIM integration tested (ADR-025, ADR-026)
- Performance under real workload
- Duration: 8 weeks

Phase 3 — GA (Sprint 28-30, Q1 2027)
- Production launch
- SLA defined and monitored
- Support channels established
- Full compliance framework operational (ADR-029)
```

## Trade-offs

- **Resource limits vs. performance**: Resource limits prevent runaway containers but may cause OOM kills under load. Start with generous limits (512MB Postgres, 1GB Backend, 256MB Frontend) and tune down after load testing.

- **Phase 1 overlap with feature development**: Running internal on staging while building new features creates overhead. However, the dogfooding value (finding issues early) outweighs the cost.

- **Test fixes vs. new features**: Fixing 6 pre-existing test failures is low effort but competes with feature development. These should be fixed as part of stabilization, not deferred.

- **Backup complexity**: WAL archiving adds operational complexity (archive storage, monitoring). For initial deployment, hourly `pg_dump` with 24-hour retention is simpler and sufficient. Add WAL archiving before GA.

## Consequences

1. **Modified**: `docker-compose.yml` — healthchecks, resource limits, restart policies
2. **New**: `scripts/backup.sh` — automated PostgreSQL backup with verification
3. **New**: Platform health dashboard in Observe module (dogfood ADR-008)
4. **New**: `.github/workflows/deploy.yml` — CI/CD pipeline to staging/production
5. **New**: Runbooks directory `docs/runbooks/` — production deployment, DB recovery, outage, secret rotation
6. **Fixed**: 6 pre-existing backend test failures (root cause investigation + fix)
7. **New**: `PRODUCTION_CHECKLIST.md` — GA readiness checklist
8. **Modified**: `application.yml` — production-appropriate logging, connection pool, timeouts
9. **New**: `Dockerfile` optimization — multi-stage builds, non-root user, healthcheck
10. **Testing**: Load testing with k6 (baseline + regression); restore test automation
11. **Documentation**: Runbooks, deployment guide, operations guide

## References

- ADR-008: Native Observability Subsystem (platform monitoring)
- ADR-025: SSO Authentication Flow (beta SSO integration)
- ADR-026: Enterprise Identity SCIM Provisioning (beta SCIM integration)
- ADR-027: Performance Optimization Strategy (load testing, baseline)
- ADR-028: Security Hardening & Secrets Management (TLS, secrets, rate limiting)
- ADR-029: Compliance & Governance Framework (compliance for GA)
- Docker Compose healthchecks: https://docs.docker.com/compose/compose-file/compose-file-v3/#healthcheck
- PostgreSQL backup: https://www.postgresql.org/docs/16/backup.html
- CloudBuilder Roadmap — Sprint 30 (Platform Stabilization)
