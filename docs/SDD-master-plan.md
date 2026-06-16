# CloudBuilder — SDD Master Plan (Spec-Driven Development)

## Current State Audit (Jun 2026)

### ✅ Completo
| Módulo | Frontend | Backend |
|--------|----------|---------|
| Design | ★ Complete (Canvas, Palette, Properties, Validation, AI Chat, Code Preview) | ★ Complete (Hexagonal: domain/model, service, port, validator + application/dto + infrastructure/web) |
| Shared/Security | — | JWT auth, TenantFilter, SecurityConfig |
| Infra (Docker) | — | 9 services running |

### ⚠️ Parcial
| Módulo | Frontend | Backend |
|--------|----------|---------|
| Provision | ProvisionModule (mock), TerraformExecutor (mock), card.tsx | Entities + Controllers (sem lógica de domínio completa) |

### 🔴 Stub/Skeleton
| Módulo | Frontend | Backend |
|--------|----------|---------|
| Observe | ObserveModule.tsx (mock data only) | {application/, {domain/, {infrastructure/ (curly dirs) |
| Cost | CostModule.tsx (mock data only) | Skeleton dirs |
| Platform | PlatformModule.tsx (mock data only) | Skeleton dirs |
| AIOps | AIOpsModule.tsx (mock chat UI) | Skeleton dirs |
| Audit | — | Skeleton dirs |
| IAM | — | Skeleton dirs |

### 🐛 Known Gaps (Critical)
1. **ID mismatch**: Frontend nanoid (string) ↔ Backend UUID
2. **No API client**: `src/api/` vazio — frontend salva em localStorage
3. **No auth FE**: JWT backend completo, frontend sem login
4. **No multi-tenancy FE**: Backend tem TenantFilter, frontend ignora
5. **Missing FE modules**: `audit` e `iam` sem frontend
6. **card.tsx misplaced**: Dentro de `provision/` em vez de `components/ui/`
7. **Position format**: XYPosition (object) vs flat positionX/positionY (doubles)

---

## SDD — 30 Sprints Implementation Plan

### Phase 1: Foundation (Sprints 1-9) — Q2/Q3 2026

#### Step 1: Fix Critical Gaps (immediate)

| Gap | Ação | Arquivos |
|-----|------|----------|
| API Client | Criar `src/api/client.ts` + módulos | `frontend/src/api/` |
| Auth FE | Login page + token storage + auth context | `frontend/src/modules/auth/` |
| ID Mapping | Serviço de tradução nanoid ↔ UUID | `frontend/src/lib/id-mapper.ts` |
| Position mapping | Adapter XYPosition ↔ flat doubles | Ambos lados |
| card.tsx | Mover para `components/ui/card.tsx` | `frontend/src/components/ui/` |

#### Step 2: Provision v1 (Sprints 7-9)

| Componente | Ação |
|------------|------|
| Backend CodeGen | Implementar CodeGeneratorService completo |
| Backend State | StateController + StateService real |
| Backend Drift | Drift detection endpoints |
| Go Engine | gRPC server + Cobra CLI + Terraform executor |
| Frontend | Provision UI real conectada à API |

### Phase 2: Operations (Sprints 10-17) — Q3/Q4 2026

#### Observe v1 (Sprints 10-13)
- Backend: Module observe completo (domain/service/port + controllers)
- Frontend: ObserveModule real conectado à API
- Integração: OpenTelemetry + Prometheus + Grafana

#### Cost v1 (Sprints 14-17)
- Backend: Module cost completo
- Frontend: CostModule real com charts
- Integração: Budgets, forecasts, anomaly detection

### Phase 3: Intelligence (Sprints 18-23) — Q4 2026/Q1 2027

#### Platform v1 (Sprints 18-20)
- Backend: Service Catalog + Golden Paths + Policy Engine
- Frontend: Catalog UI + Policy UI

#### AIOps v1 (Sprints 21-23)
- Backend: Incident analysis + RCA + NL Query
- Frontend: AIOpsModule real com API integration

### Phase 4: Scale (Sprints 24-30) — Q1/Q2 2027

#### Enterprise (Sprints 24-26)
- Multi-tenancy, RBAC, Audit, SSO

#### Performance (Sprints 27-28)
- Canvas 500+ nodes @60fps, API scaling

#### Multi-Region (Sprints 29-30)
- DR architecture, Marketplace

---

## SDD Methodology

1. **Spec first**: Define contract (DTOS, types) before implementation
2. **Harness engineer**: Automated tests validate every module
3. **BE ↔ FE alignment**: Every backend endpoint has frontend integration
4. **Audit loop**: Each phase reviewed by Oracle agent
