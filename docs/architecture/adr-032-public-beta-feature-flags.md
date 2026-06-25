# ADR-032: Public Beta Feature Flags

**Status**: Proposed
**Date**: 2026-06-23
**Author**: Principal Architect Agent

## Context

CloudBuilder is preparing for Public Beta (Phase 2 per ADR-030). During beta, we need to selectively enable modules and features per tenant or user group without full deployment cycles. Key requirements:

1. **Gradual rollout** -- enable modules for specific beta tenants before GA
2. **Dark launch** -- deploy code merged to main but hidden behind flags
3. **Per-tenant targeting** -- certain features only for specific tenants
4. **Kill switch** -- disable a problematic module without full rollback
5. **No external dependency** -- Phase 2 should not require SaaS flag services

Currently there is no feature flag mechanism. All modules are either compiled in or out. Frontend uses ProtectedAction and ProtectedContent for RBAC, but there is no per-feature toggle independent of role.

## Problem

How to selectively enable/disable modules and features across tenants during the beta phase, without external services, without full redeploys, and without coupling feature flags to RBAC roles?

## Decision

### 1. Backend: FeatureFlag Entity + Repository + Controller

**Chosen**: Simple JPA-based feature flags with FeatureFlag entity, FeatureFlagRepository, and FeatureFlagService. Exposed via GET /api/v1/flags endpoint.

- tenant_id nullable: NULL = global flag, non-NULL = tenant-specific override
- flag_key: hierarchical name (e.g., module.cost, module.aiops)
- config_json: optional JSON for parameterized flags
- Resolution: tenant-specific > global > default (false)

**Not chosen**:
- LaunchDarkly/Split.io: SaaS dependencies, cost for MVP
- Spring Cloud Config: Heavy, requires Git repository
- Feature flags in application.yml: Requires redeploy, no per-tenant
- Unleash: Open-source but adds container dependency

### 2. Frontend: uiStore exposes isEnabled()

**Chosen**: Frontend fetches flags via GET /api/v1/flags on app startup. uiStore stores parsed flags and exposes isEnabled(flagKey).

**Not chosen**:
- Vite env vars: Requires rebuild, not per-tenant
- LocalStorage-only flags: Not controllable server-side
- GraphQL flag queries: Overengineered for simple toggles

### 3. Flag Caching and Refresh

**Chosen**: Caffeine cache (backend, 30s TTL). Frontend fetches once per session.
- Backend: FeatureFlagService caches tenant flags with 30s TTL
- POST /api/v1/flags/refresh clears cache for admin operations
- Frontend: flags fetched on login
- Admin panel has reload flags button

### 4. Flag Naming Convention

| Flag Key | Scope | Default | Purpose |
|----------|-------|---------|---------|
| module.cost | Global | true | Enable Cost module |
| module.platform | Global | true | Enable Platform module |
| module.aiops | Global | true | Enable AIOps module |
| module.audit | Global | true | Enable Audit module |
| module.iam | Global | false | Enable IAM module (stub) |
| feature.what-if-cost | Per-tenant | false | What-if cost scenarios |
| feature.preview-workflow | Per-tenant | false | Preview deploy workflow |
| config.max-users | Per-tenant | 10 | Tenant user limit |

### 5. Admin UI for Flag Management

**Chosen**: Admin-only page gated via admin role. List, toggle, set tenant overrides, view audit history.

### 6. Beta Phase Flag Profile

Internal beta: All modules and features enabled, no user limit.
Public beta: Design, Provision, Observe, Cost, Platform enabled. AIOps with rule-based fallback. User limit 10.

### 7. Integration with RBAC

**Chosen**: Feature flags AND-ed with RBAC. Access = hasRole(role) AND isEnabled(flagKey).
Flags cannot bypass security.

## Alternatives Considered

| Alternative | Pros | Cons |
|-------------|------|------|
| JPA FeatureFlag (chosen) | Simple, per-tenant, auditable | DB round-trip (mitigated by cache) |
| LaunchDarkly | Real-time, targeting | 00+/month; external dependency |
| application.yml | Simple, no DB | Requires redeploy; no per-tenant |
| Unleash | Open-source | Additional container; complexity |

## Trade-offs

- DB-backed vs. config file: DB gives per-tenant but adds read overhead. Caffeine cache mitigates.
- Session-based refresh vs. real-time: Session refresh is simpler than SSE. Acceptable for MVP.
- AND with RBAC vs. override: Prevents bypass but adds complexity. Correct security model.
- Per-tenant vs. global only: Essential for beta targeting.

## Consequences

1. New: FeatureFlag JPA entity + repository + service
2. New: FeatureFlagController with GET /api/v1/flags and admin endpoints
3. New: Migration V14__feature_flags.sql with initial beta flag profile
4. Modified: uiStore.ts -- add featureFlags, fetchFlags(), isEnabled()
5. Modified: App.tsx -- fetch flags after login
6. Modified: Module navigation -- gate with isEnabled()
7. New: Admin flag management page
8. New: Audit events for flag toggles
9. Documentation: Flag naming convention documented

## References

- ADR-030: Production Readiness & Stabilization (beta phases)
- Martin Fowler -- Feature Toggles: https://martinfowler.com/articles/feature-toggles.html
- LaunchDarkly: https://launchdarkly.com (considered)
- Caffeine cache: Already part of CloudBuilder stack
