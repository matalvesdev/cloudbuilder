# CloudBuilder — MVP to Production Roadmap

**Gerado por**: FAANg — Sisyphus em 2026-06-22
**Status Atual**: Mock Removal (Phase 6) em andamento
**Stack**: React 19 + Java 21 Spring Boot 3.4.4 + Go 1.22 + PostgreSQL 16

---

## Visão Geral

```
Hoje         Semana 1-2     Semana 3-4     Semana 5-6     Semana 7-8
├────────┼────────┼────────┼────────┼────────┼────────┼────────┤
│ Mock    │ Phase 6B │ Phase 7  │ Phase 8  │ Phase 9  │ GO ⚡  │
│ Removal │ API Gaps  │ Security │ Infra    │ E2E QA   │       │
│ (60%)   │ + Tests   │ Hardening│ Prod     │ + Docs   │       │
└─────────┴──────────┴──────────┴──────────┴──────────┴───────┘
```

---

## Phase 6A — Mock Removal ✅ (Current — 60% Complete)

| Item | Store/File | Status |
|------|-----------|--------|
| Mock cost data | costStore.ts | ✅ Removed |
| Mock analytics data | analytics.types.ts + analyticsStore.ts | ✅ Removed |
| Mock activity events | activityStore.ts | ✅ Removed |
| Mock AI templates | api/aiops.ts | ✅ Removed |
| Mock incident fix history | incidentStore.ts | ✅ Removed |
| Mock persist (credentials) | credentialStore.ts | ✅ Removed |
| Mock persist (deployments) | deployStore.ts | ✅ Removed |
| Mock persist (approvals) | approvalStore.ts | ✅ Removed |
| **Tenant API + store** | api/tenant.ts + tenantStore.ts | 🔧 Background task |
| **Policy API + store** | api/policy.ts + policyStore.ts | 🔧 Background task |
| **Drift API + store** | driftStore.ts | 🔧 Background task |

**Verification**: ✅ TypeScript 0 errors, ✅ 73/73 tests passing, ✅ Vite build 7.92s

---

## Phase 6B — Backend API Gap Closure (Week 1-2)

### Priority 1 — Missing Backend Endpoints

| Feature | Store | Backend Needed | Effort |
|---------|-------|---------------|--------|
| Credential Management | credentialStore.ts | `POST/GET/PUT/DELETE /api/v1/credentials` + `POST /credentials/{id}/test` | 3-4 files |
| Environment CRUD | credentialStore.ts (envs) | `POST/GET/PUT/DELETE /api/v1/environments` | 3-4 files |
| Approval Workflow | approvalStore.ts | `POST/GET/PUT /api/v1/approval/rules`, `POST /approval/requests`, `POST /approval/requests/{id}/approve|reject` | 5-6 files |
| App Deployments | deployStore.ts | `POST/GET/PUT/DELETE /api/v1/deployments` | 3-4 files |

**Total**: ~14-18 new backend files + DTOs + repositories + services + controllers

### Priority 2 — Existing Endpoint Validation

| Endpoint | Status | Action |
|----------|--------|--------|
| `GET /cost/overview/{envId}` | ✅ Exists | Add byProvider breakdown |
| `GET /cost/records/{envId}` | ✅ Exists | Wire to costStore.fetchCostHistory |
| `GET /environments/{envId}/drift` | ✅ Exists | Test integration |
| `GET /compliance/evaluate/{tenantId}` | ✅ Exists | Wire to policyStore |
| `GET /projects` | ✅ Exists | Wire to tenantStore |
| `GET /aiops/incidents/{envId}` | ✅ Exists | Wire to incidentStore |

### Deliverables
- [ ] 14-18 backend files (controllers, services, repositories, DTOs)
- [ ] credentialStore.ts → full API integration
- [ ] approvalStore.ts → full API integration
- [ ] deployStore.ts → full API integration
- [ ] costStore.fetchCostHistory → wired to `/cost/records`
- [ ] Frontend tests for all new integrations
- [ ] Backend JUnit tests for new controllers/services

---

## Phase 7 — Security Hardening (Week 3-4)

### Authentication & Authorization
- [ ] Audit all `@PreAuthorize` annotations for correct role checks
- [ ] Rate limiting on auth endpoints (already has basic implementation)
- [ ] MFA/2FA login flow (Sprint 21 item)
- [ ] Session timeout + refresh token rotation
- [ ] DevAuthController → `@Profile("dev")` only (already done)

### Data Protection
- [ ] HSTS, CSP, X-Content-Type-Options headers (already in SecurityConfig)
- [ ] Input validation on all DTOs (jakarta.validation)
- [ ] SQL injection prevention (JPA parameterized queries verified)
- [ ] CORS restrict to production domain

### Infrastructure Security
- [ ] Secrets management (no hardcoded keys in code)
- [ ] JWT secret rotation mechanism
- [ ] Container scanning in CI pipeline
- [ ] Dependency vulnerability audit (`mvn dependency-check`)

### Deliverables
- [ ] Security audit report
- [ ] Fixed P0/P1 security findings
- [ ] Security tests (penetration test cases)

---

## Phase 8 — Production Infrastructure (Week 5-6)

### Docker & Deployment
- [ ] `docker-compose.prod.yml` — production-grade (resource limits, health checks, restart policies)
- [ ] `Dockerfile` optimization (multi-stage builds, .dockerignore)
- [ ] `nginx.conf` for frontend SPA + reverse proxy to backend
- [ ] TLS/SSL certificate automation (Let's Encrypt)

### CI/CD Pipeline
- [ ] `.github/workflows/ci.yml` — test + lint + build (exists, needs hardening)
- [ ] `.github/workflows/deploy.yml` — deploy to staging/production
- [ ] Database migration automation (Flyway or Liquibase)
- [ ] Smoke tests in CI (Playwright)

### Monitoring (Production)
- [ ] Spring Boot Actuator health checks (exists)
- [ ] Prometheus metrics endpoint (exists via `@Timed`)
- [ ] Centralized logging (ELK or native — ADR-008)
- [ ] Uptime monitoring (Pingdom/StatusCake)

### Scaling
- [ ] PostgreSQL connection pooling (HikariCP — already configured)
- [ ] Read replica for analytics queries
- [ ] Redis caching (or Caffeine — already implemented)
- [ ] CDN for static assets

### Deliverables
- [ ] `docker-compose.prod.yml`
- [ ] Production Dockerfiles (optimized)
- [ ] CI/CD pipeline `.github/workflows/deploy.yml`
- [ ] Monitoring dashboard (Grafana or native)
- [ ] Load test results (k6)

---

## Phase 9 — E2E QA + Documentation (Week 7-8)

### Testing
- [ ] Playwright E2E smoke tests for ALL modules (6 passing currently)
- [ ] Backend integration tests with Testcontainers
- [ ] Performance/load testing (k6 — 100 concurrent users)
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Mobile responsiveness audit

### Documentation
- [ ] Deployment runbook (one-page ops guide)
- [ ] Architecture overview (ADR-009 done)
- [ ] API documentation (OpenAPI/Swagger)
- [ ] User guide (getting started, common workflows)

### Compliance
- [ ] GDPR/LGPD readiness (data retention, user data export)
- [ ] SOC2 evidence collection (audit logs, access controls)
- [ ] OPA Policy-as-Code for compliance rules (ADR-020)

### Deliverables
- [ ] E2E test report
- [ ] Performance test report
- [ ] Deployment runbook
- [ ] Compliance checklist

---

## Phase GO — Production Deployment (Week 8+)

### Launch Checklist
- [ ] DNS configured (production domain)
- [ ] TLS certificates in place
- [ ] Database backup strategy configured
- [ ] Monitoring alerts configured (PagerDuty/OpsGenie)
- [ ] Rollback plan documented
- [ ] Load testing passes at 2x expected traffic
- [ ] Security scan passes (no critical/high findings)
- [ ] All P0/P1 bugs closed
- [ ] Stakeholder sign-off

### Post-Launch (Week 1-2 after go-live)
- [ ] Error budget tracking (SLO 99.5% uptime)
- [ ] Performance baseline established
- [ ] User feedback collection
- [ ] Incident response drills

---

## Effort Summary

| Phase | Timeline | Files | Tests | Dependencies |
|-------|----------|-------|-------|-------------|
| 6A Mock Removal | Week 1 | ~15 stores | Existing | None |
| 6B API Gaps | Week 1-2 | ~20 files | +30 | Backend controllers |
| 7 Security | Week 3-4 | ~10 files | +20 | Security tools |
| 8 Infra | Week 5-6 | ~10 configs | +5 | Cloud account |
| 9 E2E QA | Week 7-8 | ~5 files | +50 | Staging env |
| GO | Week 8+ | — | — | All above |

**Total to production**: ~8 weeks from current state

---

## Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Backend API gap effort underestimated | Medium | High | Prioritize by store usage frequency |
| Security audit reveals critical issues | Low | High | Pen test in Phase 7, fix before Phase 8 |
| Production scaling issues | Low | Medium | Load test targeting 2x expected load |
| Database migration issues | Low | Medium | Test migrations on staging first |
| Team capacity constraints | Medium | Medium | Parallelize Phase 6B + Phase 7 |

---

*Roadmap gerado por FAANg — Sisyphus. Atualizado conforme resolução dos mocks.*
