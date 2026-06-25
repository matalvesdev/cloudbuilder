# Tech Debt Assessment — CloudBuilder

**Date**: 2026-06-23  
**Author**: CTO Agent (Tech Lead)  
**Status**: Active — reviewed across Phases 4-7

---

## Overview

This document catalogs known technical debt across all CloudBuilder modules. Each item is scored on **Effort** (1-5, low to high) and **Impact** (1-5, low to high). Items are categorized as **Must Fix** (blocking production), **Should Fix** (recommended before GA), or **Defer** (acceptable for MVP).

---

## 🔴 Must Fix Before Production

| # | Item | Location | Description | Effort | Impact | 
|---|------|----------|-------------|--------|--------|
| TD-01 | **6 pre-existing JUnit failures** | Multiple provision tests | GaCDetector (Dockerfile extension), PropertyMappingService (first-5 limit), TerraformImportService (module warning assertion), GitHubOAuthService (null clientId), +2 undetermined. ADR-030 documents these. | 2 | 5 |
| TD-02 | **Missing @PreAuthorize on AnalyticsController** | `analytics/infrastructure/web/AnalyticsController.java` | No role-based access control. Anyone with valid JWT can access analytics endpoints. | 1 | 5 |
| TD-03 | **Missing @PreAuthorize on SearchController** | `search/infrastructure/web/SearchController.java` | Same as TD-02 — search endpoints exposed without authorization checks. | 1 | 5 |
| TD-04 | **No `package-info.java` with `@NullMarked`** | All 16 backend modules | AGENTS.md requires `@NullMarked` on all packages for null-safety. Zero `package-info.java` files exist. Systematic convention violation. | 3 | 3 |
| TD-05 | **Go engine missing 4+ provider templates** | `provision-engine/internal/provider/templates/` | Only `aws.go` exists. Azure, GCP, K8s, Vercel, Supabase, Render have no Terraform/OpenTofu templates. Frontend allows creating nodes for these providers but engine can't generate code for them. | 4 | 5 |
| TD-06 | **Frontend `as any` usages (9 instances)** | `canvasStore.ts`, `canvasExport.ts`, `collaborationManager.ts`, `canvasStore.test.ts` | Type safety violations. `as any` suppresses type checking — risks runtime errors from incorrect type assumptions. | 2 | 3 |

---

## 🟡 Should Fix Before GA

| # | Item | Location | Description | Effort | Impact |
|---|------|----------|-------------|--------|--------|
| TD-07 | **Mock pricing data in CostNode** | `frontend/src/modules/design/components/CostEstimationBar.tsx` (implied by CloudNode.tsx line 11 import) | Pricing estimates use hardcoded values per resource type, not fetched from backend cost API. Users see estimates that may be inaccurate. | 2 | 3 |
| TD-08 | **Hardcoded provider component definitions** | Frontend design palette | Provider resources (AWS/Azure/GCP/Vercel/etc.) defined as hardcoded JSON, not fetched from backend `component-definitions` API. Palette won't auto-update when backend adds new resources. | 3 | 3 |
| TD-09 | **Drift detection uses local mock data + persist** | `frontend/src/store/driftStore.ts` | `simulateDriftDetection()` generates hardcoded mock drift data instead of calling backend DriftDetectionService. Worse — uses `persist` middleware so mock data survives page reloads. Users see fake drift. | 2 | 4 |
| TD-10 | **Hardcoded mock regions in ObserveModule** | `frontend/src/modules/observe/ObserveModule.tsx` (lines 269-276) | `mockRegions` array of 6 AWS/Azure regions with hardcoded latency, uptime, status. Not connected to backend multi-region API. | 1 | 2 |
| TD-11 | **Mock infra scan data in ImportInfraDialog** | `frontend/src/modules/provision/ImportInfraDialog.tsx` (line 33, 331) | `providerMockData` generates fake scan results with delay simulation. Users see fake infrastructure instead of real cloud scan results. | 3 | 4 |
| TD-12 | **Missing application/ layer in analytics module** | `backend/.../analytics/` | Hexagonal architecture requires 3 layers (domain, application, infrastructure). Analytics module only has domain + infrastructure — no `application/dto/` package. | 1 | 2 |
| TD-13 | **Missing application/ layer in search module** | `backend/.../search/` | Same as TD-12 — search has domain + infrastructure but no application layer. | 1 | 2 |
| TD-14 | **5 open bugs from ADR audit** | Multiple backend modules | H1 (JWKS signature verification), C9 (SSO refresh token endpoint), M2 (hardcoded encryption key), M6/M7 (ADR documentation cleanup). 2.5h total estimated effort. | 2 | 4 |
| TD-15 | **No Flyway migration for observability schema** | `backend/src/main/resources/db/observability/` | V9 migration exists as reference but Flyway isn't in pom.xml. Observability schema must be applied manually. | 2 | 3 |

---

## 🟢 Defer (MVP Acceptable)

| # | Item | Location | Description | Effort | Impact |
|---|------|----------|-------------|--------|--------|
| TD-16 | **docsStore hardcoded fallback tree** | `frontend/src/store/docsStore.ts` | When API is offline, store uses hardcoded tree. Degrades gracefully — not a blocker. | 1 | 1 |
| TD-17 | **In-memory repositories** | `DocAutoLink`, `ScorecardHistory` | Use `ConcurrentHashMap` instead of JPA — data lost on restart. Acceptable for MVP. | 3 | 2 |
| TD-18 | **VTEX pricing mock** | Cost estimation | VTEX cost data is hardcoded mock (if VTEX provider is present). Low usage expected initially. | 1 | 1 |
| TD-19 | **No performance baseline** | System-wide | No load test baseline established. Acceptable for internal/staging deployment. ADR-030 addresses for GA. | 4 | 2 |
| TD-20 | **Rate limiting in-memory (ConcurrentHashMap)** | `shared/security/` | Resets on restart, not shared across instances. Sufficient for single-instance MVP. | 2 | 2 |
| TD-21 | **No backup/restore automation** | Operations | Backup scripts defined in ADR-030 but not implemented. Acceptable for internal use with manual pg_dump. | 3 | 2 |
| TD-22 | **Recharts uses any for chart data** | `frontend/src/modules/observe/*.tsx` | Recharts component props loosely typed. Low risk since charts render known data shapes. | 1 | 1 |

---

## Summary Heatmap

```
Priority     Effort 1-2    Effort 3    Effort 4-5
───────────  ──────────    ────────    ──────────
Impact 4-5   TD-01, TD-02  TD-09       TD-05
             TD-03, TD-06  TD-14
             TD-07, TD-10
             TD-13

Impact 3     TD-12         TD-04       TD-08
                           TD-11
                           TD-15

Impact 1-2   TD-16, TD-17             TD-19
             TD-18, TD-20
             TD-21, TD-22
```

### Quick Wins (Effort ≤ 2, Impact ≥ 4)
| # | Item | Est. Time |
|---|------|-----------|
| TD-02 | Add @PreAuthorize to AnalyticsController | 15min |
| TD-03 | Add @PreAuthorize to SearchController | 15min |
| TD-01 | Fix 6 test failures | 3h |
| TD-06 | Remove 9 `as any` instances | 1h |
| TD-14 | Fix 5 open bugs from ADR audit | 2.5h |
| **Total** | | **≈ 7h** |

---

## Recommended Sprint Allocation

```
Sprint  ❐ Pre-Production Blitz (3 days)
├── Day 1: Fix TD-01 (test failures) + TD-02/TD-03 (auth)
├── Day 2: Fix TD-06 (as any) + TD-14 (ADR bugs)
└── Day 3: Fix TD-12/TD-13 (application layer) + TD-04 (package-info)

Sprint  ❐ Provider Completeness (1 week)
├── Add Azure, GCP, K8s template stubs to Go engine (TD-05)
├── Connect drift detection to backend API (TD-09)
└── Connect infra import to backend API (TD-11)

Sprint  ❐ GA Readiness (deferred to Q1 2027)
├── Performance baseline (TD-19)
├── Backup/restore automation (TD-21)
└── ADR-020 OPA implementation
```

---

## References

- ADR-030: Production Readiness & Stabilization
- AGENTS.md: Backend Conventions (@NullMarked requirement)
- `adr-final-comprehensive-audit.md`: 5 open bugs
- `progress_memory.md`: Phase summaries with known gaps
