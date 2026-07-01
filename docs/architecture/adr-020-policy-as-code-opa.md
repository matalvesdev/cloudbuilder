# ADR-020: Policy as Code with Open Policy Agent + Java Fallback

**Status**: ✅ Implemented (Phase 6B-9 FAANg Merge)
**Date**: 2026-06-21  
**Implemented**: 2026-06-24
**Author**: Principal Architect Agent

## Context

CloudBuilder already has a compliance engine (Sprint 11 — Audit & Compliance) with:
- `ComplianceRule` entity (type, description, severity, enabled, configuration JSON)
- `ValidationStrategy` interface with 3 implementations: AuditPatternStrategy, CostThresholdStrategy, ResourceConstraintStrategy
- `ComplianceService` with CRUD + evaluation API
- Frontend compliance dashboard with scorecards

However, the current implementation embeds compliance rules in Java code. For Sprints 26-27 (Compliance & Governance, Q1 2027), we need:

1. **Policy as Code** — policies defined in a declarative language, version-controlled in git
2. **Auditability** — every policy evaluation must be traceable to a specific rule version
3. **Separation of concerns** — compliance team writes policies, platform team maintains infra
4. **Hot-reload** — policies change without backend restart

## Problem

How to add Policy as Code capabilities without replacing the existing Java-based compliance engine, adding expensive third-party tools, or requiring a PhD in policy engineering?

## Decision

### 1. OPA (Open Policy Agent) + Java Fallback

**Chosen**: OPA sidecar as primary policy engine with Java-based ValidationStrategy as fallback when OPA is not configured.

**Alternatives considered**:
- **Full OPA**: Cleanest architecture but OPA is an additional container; requires learning Rego
- **Full Java (current)**: Already works but policies are code (not "Policy as Code")
- **Custom DSL**: Proprietary language — all the learning curve of Rego with none of the ecosystem
- **Hashicorp Sentinel**: Vendor lock-in (HashiCorp ecosystem)
- **AWS Cedar**: Newer, smaller ecosystem than OPA

**Rationale for OPA**:
1. **Industry standard** — CNCF graduated; used by Netflix, Pinterest, Chef, VMware
2. **Rego is declarative** — policies are data, not code — auditable by non-developers
3. **Hot-reload** — `POST /v1/policies` updates without restart
4. **REST API** — integrate via HTTP (no SDK dependency)
5. **Partial evaluation** — OPA can pre-compute policy decisions for known inputs
6. **Zero vendor lock-in** — OPA is open-source, CNCF, Apache 2.0 license

**Rationale for Java fallback**:
1. **Dev environment** — OPA container adds complexity for local development
2. **Test environment** — unit tests should not depend on OPA being available
3. **Graceful degradation** — if OPA is down, compliance evaluation continues with Java rules

### 2. OPA as Sidecar (not embedded)

**Chosen**: OPA running as a sidecar container in the same pod/network.

**Docker Compose**:
```yaml
opa:
  image: openpolicyagent/opa:latest
  command: ["run", "--server", "--log-level=info"]
  ports:
    - "8181:8181"
  volumes:
    - ./opa/policies:/policies
  healthcheck:
    test: ["CMD", "opa", "health"]
    interval: 30s
```

**Integration**: Backend calls `POST http://opa:8181/v1/data/compliance/cloudbuilder/allow` with input payload.

**Alternatives considered**:
- OPA as Go library (requires CGO, complex build)
- OPA as WASM module (experimental, limited library support)
- OPA HTTP API (standard, well-documented, language-agnostic)

**Consequences**: OPA container in docker-compose (opt-in for dev). CI needs OPA binary for policy tests.

### 3. Rego Policy Structure

**Chosen**: Namespaced policies under `/policies/compliance/cloudbuilder/`.

```
opa/policies/
├── compliance/
│   └── cloudbuilder/
│       ├── cost.rego        # Cost threshold policies
│       ├── security.rego    # Security compliance policies
│       ├── governance.rego  # Organizational governance
│       └── custom.rego      # Tenant-specific overrides
```

**Example Rego policy**:
```rego
package compliance.cloudbuilder.cost

default allow = false

# Cost threshold: alert if projected > 80% of budget
allow {
    input.resourceType == "budget"
    input.projectedCost / input.budgetLimit < 0.8
}

# Security: all S3 buckets must have encryption enabled
allow {
    input.resourceType == "s3_bucket"
    input.encryptionEnabled == true
}
```

### 4. Migration Path

**Chosen**: Hybrid mode — both engines run in parallel during migration. Results compared but Java engine is source of truth until OPA is validated.

**Phase 1 (Sprint 26)**: OPA sidecar + existing Java rules in parallel. OPA results logged but not enforced. Dashboard shows both scores.

**Phase 2 (Sprint 27)**: OPA becomes primary engine for policy evaluation. Java rules become fallback only (when OPA unavailable). Strategy pattern remains for non-policy validations (canvas compatibility, CIDR overlap).

**Phase 3 (Post-Sprint 30)**: Java ValidationStrategy rules are incrementally migrated to Rego. New policies are written in Rego by default.

## Consequences

1. **New container**: OPA sidecar in docker-compose.yml (opt-in)
2. **New directory**: `opa/policies/compliance/cloudbuilder/` for Rego policies
3. **Modified**: ComplianceService — add OPA client with HTTP fallback
4. **Modified**: ValidationStrategy — Java rules remain for non-policy validations
5. **Frontend**: Policy editor tab in Compliance view (Rego syntax highlighting)
6. **Tests**: OPA policy unit tests via `opa test` in CI
7. **One new dependency**: OPA container (openpolicyagent/opa:latest)

## References

- ComplianceRule.java: Existing rule entity
- ValidationStrategy.java: Existing strategy interface
- ComplianceService.java: Existing compliance engine
- Comp lianceDashboardView.tsx: Existing frontend compliance view
- ADR-012: Q3 Operations Architecture (compliance rule design)
