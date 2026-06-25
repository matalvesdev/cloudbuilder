# ADR Governance Report — CloudBuilder

**Generated**: 2026-06-21  
**Auditor**: FAANg Tech Lead (CTO Agent)  
**Scope**: All 18 ADRs (008–025) in `docs/architecture/`  
**Method**: Read-only source code verification — actual files checked, not ADR status text trusted.

---

## Executive Summary

| Metric | Value |
|--------|-------|
| Total ADRs audited | 18 |
| Fully Implemented | 9 (50%) |
| Partially Implemented | 4 (22%) |
| Not Implemented (incorrect status) | 1 (6%) |
| Proposed (correct — not intended to be implemented yet) | 4 (22%) |
| ADRs with incorrect/misleading status | 3 |

**Critical**: ADR-020 claims "Implemented" but is NOT implemented.  
**High concern**: ADR-016, ADR-018 claim "Implemented" but are only Partial.  
**Moderate concern**: ADR-019 claims "Implemented" but entity-only.

---

## Detailed ADR Status Table

| # | ADR Title | ADR Status | Actual Status | Gap | Severity |
|---|-----------|------------|---------------|-----|----------|
| 008 | Native Observability Subsystem | Auditado | Partially Impl. | Old mock metrics module still exists alongside real observability (53 files). Dual-write not fully cleaned. SSE streaming not verified. | Medium |
| 009 | Auto-Documentation Module | Implementado | Fully Implemented | No gaps. DocScannerService (239L), AutoDocService, DocsController (261L), DocsModule + docsStore. | None |
| 010 | Backend Quality Gate | Implementado | Fully Implemented | 53 test files, 554 @Test methods (exceeds claimed 479). All major modules covered. | None |
| 011 | Cost/Preview Persistence | Implementado | Fully Implemented | CostScenario + DeployPlan (entity/repo/service) all verified real. | None |
| 012 | Q3 Operations Architecture | Proposed | Proposed (correct) | Design document only. | None |
| 013 | LLM Provider Abstraction | Implemented | Fully Implemented | LlmClient + 3 implementations (RuleBased, OpenAI, Anthropic). Package structure matches ADR. | None |
| 014 | Catalog Version History | Implemented | Fully Implemented | CatalogItemVersion entity + repo. Publish/Unpublish endpoints. platformStore. | None |
| 015 | Marketplace Architecture | Implemented | Fully Implemented | PlatformModule 2-tab layout (catalogo/marketplace). Marketplace listings + partners in API/store. | None |
| 016 | GitOps Webhook Event-Driven | Implemented | Partially Impl. | WebhookService (176L, HMAC) exists. MISSING: GitWebhookController, GitPushEvent, GitScanCompleteEvent, Commit entity. Naming differs. | High |
| 017 | Hybrid Auto-Remediation | Implemented | Fully Implemented | RemediationAction + RemediationService + RemediationRepository all exist. | None |
| 018 | TOTP MFA + JWT Refresh | Implemented | Partially Impl. | UserMfa + MfaService (234L, RFC 6238) + Session exists. MISSING: MfaController, SAST CI pipeline, dedicated refresh rotation endpoint. | High |
| 019 | Multi-Region Replication | Implemented | Partially Impl. | ReplicationConfig (139L) + repo exist. MISSING: ReplicationService, failover automation, frontend UI. | Medium |
| 020 | Policy as Code with OPA | Implemented | NOT Implemented | OpaClientService HTTP stub exists. MISSING: OPA container, Rego policies, opa/policies/ dir, hot-reload. | Critical |
| 021 | Search Hexagonal Refactoring | Proposed | Proposed (correct) | Design doc only. GlobalSearchService still has inline classes. | None |
| 022 | API Versioning Strategy | Proposed | Proposed (correct) | No ApiVersion enum or interceptor exists. | None |
| 023 | Circuit Breaker Pattern | Proposed | Proposed (correct) | No resilience4j dependency in pom.xml. | None |
| 024 | Analytics Aggregation Strategy | Proposed | Proposed (correct) | No rollup entities or AggregationService. Analytics module has 7 basic files. | None |
| 025 | SSO Authentication Flow | Proposed | Proposed (correct) | SsoProviderConfig entities exist (pre-ADR). SSO auth flow (PKCE, callback) not implemented. | None |

---

## ADRs Requiring Immediate Attention

### 1. CRITICAL — ADR-020: Policy as Code — Status MISMATCH

**Problem**: Claims "Implemented" but OPA integration is absent:
- No OPA container in docker-compose.yml
- No opa/policies/ directory (expected: cost.rego, security.rego, governance.rego, custom.rego)
- No Rego policy files anywhere
- OpaClientService is HTTP stub in audit module — not dedicated OPA integration
- No ComplianceService modifications for OPA switching

**Action**: Either implement OPA per ADR-020 spec, or correct status to "Proposed".

### 2. HIGH — ADR-016: GitOps Webhook — Missing Core Components

**Problem**: Claims "Implemented" but key components missing:
- GitWebhookController — no POST /api/v1/git/webhooks/github endpoint
- GitPushEvent — no domain event class
- GitScanCompleteEvent — no domain event class
- Commit entity — no JPA entity

**What exists**: WebhookService (generalized) + WebhookEvent entity.

**Action**: Complete the event-driven flow or correct status to "Partially Implemented".

### 3. HIGH — ADR-018: TOTP MFA — Missing Controller + CI

**Problem**: Claims "Implemented" but:
- No MfaController — REST endpoints for setup/verify/disable missing
- No security-scan.yml CI workflow
- No explicit refresh rotation endpoint

**What exists**: UserMfa (87L), MfaService (234L, RFC 6238), Session with refreshToken, AuthService.refresh().

**Action**: Create MfaController with 4+ endpoints and security-scan.yml.

### 4. MEDIUM — ADR-019: Multi-Region — Entity-Only

**Problem**: Claims "Implemented" but entity-only:
- ReplicationConfig (139L) is well-implemented
- ReplicationService missing (lag monitoring, pause/resume)
- No DR service auto-failover modifications
- No frontend topology view

**Action**: Implement ReplicationService or correct ADR status.

### 5. MEDIUM — ADR-008: Native Observability — Residual Mock Module

**Problem**: Old com.cloudbuilder.metrics module (6 files) has mock MetricsService (ThreadLocalRandom). Real observability module (53 files) has real PostgreSQL persistence. Dual-write creates confusion and risk of mock data in production paths.

**Action**: Remove/deprecate old metrics module.

---

## ADRs Fully Verified

| # | ADR | Verification Notes |
|---|-----|-------------------|
| 009 | Auto-Documentation | DocScannerService (239L, SHA-256, path traversal), AutoDocService (template ADR), DocsController (261L, 6+ endpoints), DocsModule frontend |
| 010 | Backend Quality Gate | 53 test files, 554 @Test methods. Phase 5d UUID->String complete (559 refs, 206 files) |
| 011 | Cost/Preview Persistence | CostScenario entity (JPA, 3-tier costs) + DeployPlan (JPA, add/change/destroy) + services |
| 013 | LLM Provider Abstraction | LlmClient interface (3 methods) + RuleBased + OpenAI + Anthropic + Config |
| 014 | Catalog Version History | CatalogItemVersion entity + auto-bump + publish/unpublish + platformStore + version history UI |
| 015 | Marketplace Architecture | PlatformModule 2-tab (catalogo/marketplace) + MarketplaceListing + PartnerIntegration |
| 017 | Auto-Remediation | RemediationAction (actionType, status, source, confidence) + RemediationService + repository |

---

## ADRs Correctly Marked as Proposed

| # | ADR | Notes |
|---|-----|-------|
| 012 | Q3 Operations Architecture | Design doc — 3 sprints pending |
| 021 | Search Hexagonal Refactoring | GlobalSearchService still has inline classes |
| 022 | API Versioning Strategy | No implementation started |
| 023 | Circuit Breaker Pattern | No resilience4j dependency |
| 024 | Analytics Aggregation Strategy | 7 files (basic tracking), no rollups |
| 025 | SSO Authentication Flow | Config entities exist, auth flow not implemented |

---

## Recommendations

### Immediate (Fix Incorrect Status)
1. **ADR-020**: Change "Implemented" to "Proposed" — or implement OPA integration
2. **ADR-016**: Change "Implemented" to "Partially Implemented" — or complete event flow
3. **ADR-018**: Change "Implemented" to "Partially Implemented" — or add MfaController
4. **ADR-019**: Change "Implemented" to "Partially Implemented" — or add ReplicationService

### Short-term (Complete Partial Implementations)
5. **ADR-008**: Remove/redirect o
