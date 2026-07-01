# SDD Spec — MVP 3 Modules (Dashboard, Design/Provision, Observe)

## REQ-001: Dashboard/Análise Module

**Status**: ✅ Functional — 0 gaps

### Verification Evidence
| Aspect | File | Status |
|--------|------|--------|
| Store | `canvasStore.ts` — real API via `design.ts` | ✅ |
| API | `dashboardApi.ts` — calls backend REST | ✅ |
| Stores | credentialStore, canvasStore, activityStore, uiStore, onboardingStore | ✅ |
| Components | DashboardView, MetricCard, ActivityFeed, QuickActions, WelcomeScreen | ✅ |
| Tests | 62 Vitest pass, Vite build 0 errors | ✅ |

### Actions
- **REQ-001-A**: No functional changes required.
- **REQ-001-B**: Pattern cleanup (optional) — extract `dashboardApi` calls into a dedicated `dashboardStore.ts` for store isolation.

---

## REQ-002: Infra/Design/Provision Module

**Status**: ✅ Functional — 0 gaps

### Verification Evidence
| Aspect | File | Status |
|--------|------|--------|
| Design API | `design.ts` — HttpClient calls backend REST | ✅ |
| Canvas store | `canvasStore.ts` — real CRUD via design API | ✅ |
| CanvasDesignFetcher | `CanvasDesignFetcherImpl.java` — properly injects `CanvasRepository` + `ComponentDefinitionRepository`, real DB calls | ✅ |
| Provision → Design bridge | CodeGeneratorController receives CanvasDesign via CanvasDesignFetcher | ✅ |
| Provision API | `provision.ts` — HttpClient calls backend REST | ✅ |
| Code generation | CodeGeneratorService — generates Terraform code in-process | ✅ |
| Drift detection | `driftStore.ts` — real API calls via provision API | ✅ |
| Approval/deploy | `approvalStore.ts`, `deployStore.ts` — real stores | ✅ |
| Go engine | `provision-engine/` — builds + tests pass (23 tests) | ✅ |

### Actions
- **REQ-002-A**: No functional changes required.

---

## REQ-003: Operações/Observar Module

**Status**: ✅ Functional — 1 cleanup needed

### Verification Evidence
| Aspect | File | Status |
|--------|------|--------|
| Observe component | `ObserveModule.tsx` — tabs: Visão Geral, Service Map, Scorecards, Métricas, Traces, Logs, Alertas, Incidentes, SLOs, Drift, Disaster Recovery, Regiões | ✅ |
| Overview data | `OverviewView.tsx` — calls `/observe/dashboard/{envId}` | ✅ |
| Drift detection | `DriftDetection.tsx` — uses `driftStore` with real API | ✅ |
| Service Map | `ServiceMapView.tsx` — ReactFlow from `servicemap.ts` API | ✅ |
| Scorecards | `ScorecardView.tsx` — from `scorecard.ts` API | ✅ |
| Native Observability | 55+ backend files — real Metrics/Traces/Logs/Alert/Incident/SLO controllers | ✅ |
| APM Module | `APMController.java` — **mock data** (ThreadLocalRandom) | ⚠️ |

### Actions
- **REQ-003-A**: Remove or rewire `APMController.java`. Currently generates fake traces/alerts via `ThreadLocalRandom` (lines 62-142). Frontend does NOT consume this endpoint, but dead mock code violates the "no mocks" mandate. Rewire to use real repositories or delete.
- **REQ-003-B**: Pattern cleanup (optional) — `OverviewView.tsx` calls `api.get()` directly; extract into `observeStore.ts` for consistency.

---

## Implementation Plan

### Wave 1 — Backend (launch in parallel)
- **backend-dev**: REQ-003-A — Remove APMController mock data, wire to real repositories
- **frontend-dev**: REQ-001-B — DashboardStore extraction (optional)
- **frontend-dev**: REQ-003-B — observeStore extraction (optional)

### Wave 2 — QA (after Wave 1)
- **qa-engineer**: REQ-ALL — Integration tests for each module pipeline

### Wave 3 — Memory
- Update `progress_memory.md` + `decision_memory.md`
