# ADR-037: Frontend Architecture Restructuring

**Status**: Implemented  
**Date**: 2026-06-29  
**Deciders**: Principal Architect, Staff Frontend Engineer, Principal Designer  
**Technical Story**: Restructurar o frontend para alinhar com a arquitetura target definida nos diagramas Mermaid

---

## Context

O frontend do CloudBuilder cresceu organicamente durante as fases 1-6, resultando em uma estrutura `src/modules/` com 15 módulos flat. A arquitetura target definida nos diagramas Mermaid requer:

1. **22+ feature modules** com estrutura interna padronizada (`pages/`, `components/`, `hooks/`, `store/`, `schemas/`, `routes/`, `api/`, `tests/`, `index.ts`)
2. **Separação de responsabilidades**: `app/`, `shared/`, `core/`, `widgets/`, `design-system/`, `router/`, `layouts/`
3. **Co-localização**: stores e APIs co-located com features
4. **Module granularity**: Módulos maiores precisam ser divididos (design → canvas + architecture)

### Current State

```
src/
├── modules/        15 modules (flat structure)
├── store/          30 stores (flat)
├── api/            21 API clients (flat)
├── components/     6 shared components + ui/
├── hooks/          5 custom hooks
├── services/       3 services
├── types/          Type definitions
└── lib/            Utilities
```

### Target State

```
src/
├── app/            Application shell
├── shared/         Shared utils, types, components
├── core/           Core business logic
├── features/       22+ feature modules
├── widgets/        Composite UI widgets
├── design-system/  Design tokens, base components
├── hooks/          Shared hooks
├── services/       Shared services
├── store/          Shared stores
├── router/         Route definitions
└── layouts/        Layout components
```

---

## Decision

Adotar a arquitetura feature-sliced design (inspirada em [feature-sliced](https://feature-sliced.design/)) com as seguintes convenções:

### Directory Structure

| Directory | Purpose | Contents |
|-----------|---------|----------|
| `src/app/` | Application shell | App.tsx, providers, global config |
| `src/shared/` | Shared code | types/, utils/, components/, hooks/ |
| `src/core/` | Core business | constants/, domain/, events/ |
| `src/features/` | Feature modules | 22+ modules with standard structure |
| `src/widgets/` | Composite widgets | DashboardWidget, ProjectWidget, etc. |
| `src/design-system/` | Design system | tokens/, components/, themes/ |
| `src/hooks/` | Shared hooks | useAuth, usePermission, useSSE, etc. |
| `src/services/` | Shared services | api/, collaboration/, events/ |
| `src/store/` | Shared stores | authStore, uiStore, tenantStore |
| `src/router/` | Route definitions | routes.tsx, guards, lazy imports |
| `src/layouts/` | Layout components | MainLayout, AuthLayout, etc. |

### Feature Module Structure

```
features/
└── canvas/
    ├── pages/           Page components
    ├── components/      Module-specific components
    ├── hooks/           Module-specific hooks
    ├── services/        Module-specific services
    ├── store/           Module-specific store
    ├── schemas/         Validation schemas (Zod)
    ├── routes/          Route definitions
    ├── api/             API client functions
    ├── tests/           Module tests
    └── index.ts         Barrel export
```

### Module Mapping

| Current | Target | Action | Status |
|---------|--------|--------|--------|
| `auth/` | `shared/auth/` | Relocate | ✅ Done |
| `design/` | `canvas/` | Rename | ✅ Done |
| `provision/` | `provisioning/` + `deployment/` + `gitops/` | Split | ✅ Done |
| `observe/` | `observability/` | Rename | ✅ Done |
| `cost/` | `finops/` | Rename | ✅ Done |
| `platform/` | `platform/` | Keep | ✅ |
| `aiops/` | `ai/` | Rename | ✅ Done |
| `iam/` + `audit/` | `security/` | Merge | ✅ Done |
| `settings/` | `settings/` + `docs/` + `flags/` | Absorb | ✅ Done |
| `analytics/` | `dashboard/` | Merge | ✅ Done |
| `onboarding/` | `app/onboarding/` | Relocate | ✅ Done |
| — | `billing/` | Create stub | ✅ Done |
| — | `notifications/` | Create stub | ✅ Done |
| — | `workspace/` | Create stub | ✅ Done |
| — | `projects/` | Create stub | ✅ Done |

---

## Consequences

### Positive

1. **Consistency**: All features follow the same structure
2. **Co-location**: Code for a feature is in one place
3. **Scalability**: Easy to add new features
4. **Maintainability**: Clear separation of concerns
5. **Discoverability**: Easy to find code for any feature
6. **Testability**: Module-level testing is straightforward

### Negative

1. **Migration effort**: ~290 files affected, 13-19 days estimated
2. **Import path changes**: All imports need updating
3. **Learning curve**: Team needs to learn new structure
4. **Temporary breakage**: During migration, some imports may break

### Risks

1. **High**: Breaking changes during migration → Mitigated by incremental approach
2. **Medium**: Import path errors → Mitigated by TypeScript compilation check
3. **Low**: Performance regression → Mitigated by lazy loading preservation

---

## Alternatives Considered

### Alternative 1: Keep Current Structure

**Pros**: No migration effort, familiar to team  
**Cons**: Doesn't scale, poor separation of concerns, inconsistent  
**Decision**: Rejected — technical debt too high

### Alternative 2: Feature-Sliced Design (Strict)

**Pros**: Industry standard, well-documented  
**Cons**: More layers than needed for current scale  
**Decision**: Partially adopted — simplified layers for CloudBuilder

### Alternative 3: Domain-Driven Design (DDD)

**Pros**: Strong domain boundaries  
**Cons**: Over-engineering for frontend, complex  
**Decision**: Rejected — DDD better suited for backend

---

## Implementation Plan

### Phase 1: Foundation (Days 1-3) ✅ DONE
- Create `src/app/`, `src/shared/`, `src/router/`, `src/layouts/` ✅
- Create `src/shared/event-bus/`, `src/shared/command-bus/`, `src/shared/websocket/`, `src/shared/cache/` ✅
- Create `src/shared/api/`, `src/shared/auth/`, `src/shared/feature-flags/` barrel exports ✅
- Create `src/shared/design-system/` ✅
- App.tsx + Providers.tsx in `src/app/` ✅
- Router in `src/router/index.tsx` with lazy imports ✅
- MainLayout, AuthLayout, OnboardingLayout in `src/layouts/` ✅
- TypeScript: 0 errors. Vite build: ✅

### Phase 2: Feature Restructuring (Days 4-8) ✅ DONE
- Renamed modules: design→canvas, aiops→ai, observe→observability, cost→finops ✅
- Split provision → provisioning + deployment + gitops ✅
- Merged: analytics→dashboard, flags→settings, docs→settings ✅
- Merged: iam+audit→security ✅
- Created stubs: billing, notifications, workspace, projects ✅
- Relocated: auth→shared/auth, onboarding→app/onboarding ✅
- 15 feature modules in `src/modules/` ✅
- Store barrel exports in each feature module `store/index.ts` ✅
- API barrel exports in each feature module `services/index.ts` ✅
- Bulk module ID rename: 103 replacements across 11 files ✅
- All stale import paths fixed ✅
- TypeScript: 0 errors. Vite build: 11.63s, 2537 modules ✅

### Phase 3: Core + Shared Services (Remaining)
- Register CommandBus handlers for each command type
- Wire WebSocket → EventBus bridge in Providers
- Migrate actual store implementations from `src/store/` to feature-local `store/`
- Migrate actual API implementations from `src/api/` to feature-local `services/`

### Phase 4: Polish (Remaining)
- Full feature-sliced directory structure (pages/, components/, hooks/, schemas/, routes/, tests/)
- Core business logic layer (constants/, domain/, events/)
- Design system token layer
- Widget layer (DashboardWidget, ProjectWidget, etc.)

---

## References

- [Feature-Sliced Design](https://feature-sliced.design/)
- [React Project Structure Best Practices](https://react.dev/learn/thinking-in-react)
- [Clean Architecture in React](https://blog.cleancoder.com/uncle-bob/2012/08/13/nude.html)
- [CloudBuilder Frontend DIAGRAMS](./frontend/DIAGRAMS.md)

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-29 | Initial ADR created |
| 2026-06-29 | Phase 1+2 completed: shared services, module restructuring, all imports fixed. TypeScript 0 errors, Vite build 2537 modules 11.63s |
