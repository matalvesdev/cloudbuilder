# Cross-ADR Architectural Consistency Audit

**Date**: 2026-06-22
**Author**: FAANg Principal Architect Agent
**Scope**: All 23 ADRs (008-030) in `docs/architecture/`
**Method**: Read-only cross-reference of ADR decision sections, status headers, dependency chains, and codebase verification reports

---

## Executive Summary

| Category | Count |
|----------|-------|
| Total ADRs audited | 23 (008-030) |
| Contradictions found | **7** |
| Status mismatches (ADR vs README vs reality) | **6** |
| Missing prerequisites in dependency chains | **4** |
| Overlapping scope with potential merge candidates | **2** |
| Technology contradictions | **0** |
| Gap to 30-ADR roadmap target | **7** ADRs (001-007 never created, need 7 more for 030→037) |

**Bottom line**: The ADR set has high individual quality but suffers from **status inflation** (ADRs claim "Implemented" when partially or not implemented), a **stale README status table**, and a **missing foundational ADRs 001-007 gap**.

---

## 1. Complete ADR Dependency & Status Map

| ADR | File Status | README Status | Actual Status | Dependencies | Depended-On By |
|-----|------------|---------------|---------------|-------------|----------------|
| **008** | Auditado | ✅ Implementado | ✅ Impl (4 low gaps) | — | 009, 012, 019, 021, 022, 024, 027, 029, 030 |
| **009** | Implementado | ✅ Implementado | ✅ Impl (1 med gap) | 008 | 017 |
| **010** | Implementado | ✅ Implementado | ✅ Impl | — | 011, 013, 014, 015 |
| **011** | Implementado | ✅ Implementado | ✅ Impl | 010 | — |
| **012** | Implementado | ✅ Implementado | ✅ Impl (54+ files) | 008, 010 | 013, 016, 018, 019, 020 |
| **013** | Implemented | ✅ Implementado | ✅ Impl | 012 | 017, 023 |
| **014** | Implemented | ✅ Implementado | ✅ Impl | 013 | 015 |
| **015** | Implemented | ✅ Implementado | ✅ Impl | 014 | 016, 022 |
| **016** | Implemented | ✅ Implementado | ⚠️ **Partial** | 012 | — |
| **017** | Implemented | ✅ Implementado | ✅ Impl | 013, 009 | — |
| **018** | Implemented | ✅ Implementado | ⚠️ **Partial** | 012 | 025, 026, 028 |
| **019** | Implemented | ✅ Implementado | ⚠️ **Partial** | 008, 012 | 030 |
| **020** | **Implemented** | ❌ Não Impl | ❌ **NOT Impl** | 012 | 023, 029 |
| **021** | **Proposed** | ✅ **Implementado** | Proposed | 008 | — |
| **022** | **Proposed** | ✅ **Implementado** | Proposed | 008, 015, 016, 019 | — |
| **023** | **Proposed** | ✅ **Implementado** | Proposed | 020, 013 | — |
| **024** | Proposed | 📝 Proposto | Proposed | 008 | — |
| **025** | Proposed | 📝 Proposto | Proposed | 018 | 026, 028, 030 |
| **026** | Proposed | 📝 Proposto | Proposed | 025, 018 | 030 |
| **027** | Proposed | 📝 Proposto | Proposed | 008 | 030 |
| **028** | Proposed | 📝 Proposto | Proposed | 025, 018 | 030 |
| **029** | Proposed | 📝 Proposto | Proposed | 020, 008 | 030 |
| **030** | Proposed | 📝 Proposto | Proposed | 025, 026, 027, 028, 029 | — |

**Legend**: ⚠️ = Mismatch, ❌ = Not implemented, Proposed = Design/spec only

---

## 2. Contradictions Found

### 2.1 CRITICAL: README Status Table Is Wrong for 3 ADRs

| ADR | README Says | ADR File Says | Actual | Impact |
|-----|------------|---------------|--------|--------|
| **021** Search Hexagonal | ✅ Implementado | **Proposed** | Proposed | Anyone reading README thinks search is refactored — it isn't |
| **022** API Versioning | ✅ Implementado | **Proposed** | Proposed | API has no version header support |
| **023** Circuit Breaker | ✅ Implementado | **Proposed** | Proposed | No Resilience4j in pom.xml |

**Root cause**: The README was bulk-updated without verifying each ADR's actual status. These 3 ADRs were incorrectly promoted from "Proposed" (ADR file header) to "Implemented" (README table).

### 2.2 HIGH: ADR-020 Claims "Implemented" But Is NOT

**ADR-020 header**: "Status: Implemented"
**README**: "❌ Não Implementado" ✅ *correct*
**Code reality**: OPA container absent, no Rego policies, OpaClientService is HTTP stub in wrong module.

**Recommendation**: Change ADR-020 header to "Proposed". The README is correct; the ADR itself is wrong.

### 2.3 MEDIUM: ADR-016, ADR-018, ADR-019 — Status Inflation

| ADR | Claims | Reality | Missing Components |
|-----|--------|---------|-------------------|
| **016** GitOps | Implemented | Partially Impl | GitWebhookController, GitPushEvent, GitScanCompleteEvent, Commit entity |
| **018** TOTP MFA | Implemented | Partially Impl | MfaController, SAST CI pipeline, dedicated refresh rotation endpoint |
| **019** Multi-Region | Implemented | Partially Impl | ReplicationService (lag monitoring, pause/resume), failover automation, frontend |

**Recommendation**: Change all 3 ADR headers to "Partially Implemented".

### 2.4 MEDIUM: Governance Report Contradicts Itself on ADR-012

**Governance report (adr-governance-report.md)**: Lists ADR-012 as "Proposed (correct)" and writes "Design document only."
**But same report**: States "All 7 decisions verified in code: PostgreSQL RANGE partitioning, AnomalyDetectionService, ComplianceService, Modulith events, CostProjectionService, @Scheduled services, AuditQueryService."
**Decision memory**: Confirms ~54 new Java files implemented for Q3 Operations.

**Verdict**: ADR-012 IS implemented. The governance report's "Proposed" label is an error within the same document.

### 2.5 MEDIUM: ADR-028's Context Table Shows SSO as "✅ Implemented"

**ADR-028 section "Context" table**: Marks SSO as "✅ Implemented" (citing ADR-025)
**ADR-025 status**: "Proposed"
**Code reality**: SsoProviderConfig entities exist but OAuth2 PKCE flow, callback, and state validation are NOT implemented.

**Impact**: ADR-028 (Secrets) builds on the assumption that SSO authentication is already in place. The httpOnly cookie migration and secret encryption depend on a working SSO flow that doesn't exist yet.

### 2.6 LOW: ADR-012 References Kafka for Future Module Split

**ADR-012 section 4**: "If modules are split into separate services later, migrate to Kafka."
**Current infra state**: Kafka was removed in $0 infra cleanup (2026-06-16). No Kafka in docker-compose, pom.xml, or codebase.
**Contradiction**: The ADR references a technology that was explicitly removed. The mitigation plan references Kafka re-integration but there's no ADR or plan for when/if this happens.

---

## 3. Overlapping Scope Analysis

### 3.1 COMPLIANCE: ADR-012 (Strategy Pattern) vs ADR-029 (Compliance Engine)

| Aspect | ADR-012 (Q3 Ops) | ADR-029 (Compliance) |
|--------|------------------|---------------------|
| Interface | `ValidationStrategy` | Implied `ComplianceRuleStrategy` |
| Implementation | 3 strategies (AuditPattern, CostThreshold, ResourceConstraint) | 3 rule types (audit_query, entity_check, config_check) |
| Evaluation | `ComplianceService.evaluate()` | `ComplianceEvaluationService` with `@Scheduled` |
| Pattern | Strategy pattern + Spring components | Strategy pattern + RuleType enum |

**Risk**: ADR-029 defines a parallel compliance engine that may overlap with ADR-012's existing `ValidationStrategy`/`ComplianceService`. ADR-029 does reference ADR-020 (OPA) but makes no mention of ADR-012's existing compliance infrastructure.

**Recommendation**: ADR-029 should explicitly reference ADR-012's existing `ComplianceService` as the foundation. The new rule types (audit_query, entity_check, config_check) could be new `ValidationStrategy` implementations rather than a separate engine.

### 3.2 RESILIENCE: ADR-013 (Graceful Degradation) vs ADR-023 (Circuit Breaker)

| Aspect | ADR-013 (LLM) | ADR-023 (Circuit Breaker) |
|--------|---------------|--------------------------|
| Pattern | try-catch → RuleBasedLlmClient fallback | Resilience4j `@CircuitBreaker` + `@TimeLimiter` |
| Coverage | LLM calls only | All external clients (OPA, LLM, GitHub) |
| Status | ✅ Implemented | ❌ Proposed |

**Risk**: ADR-023 proposes Resilience4j for LLM calls without acknowledging that ADR-013 already has try-catch graceful degradation. The two patterns should compose: Resilience4j aggregates metrics and provides half-open state recovery, while the try-catc
