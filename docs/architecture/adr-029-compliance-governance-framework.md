# ADR-029: Compliance & Governance Framework

**Status**: Proposed
**Date**: 2026-06-22
**Author**: Platform Engineering Team

## Context

CloudBuilder operates in regulated enterprise environments where compliance and governance are mandatory:

1. **Multi-tenant isolation** (already implemented): TenantFilter, TenantContext, `WHERE tenant_id = ?` on all queries
2. **Audit trail** (already implemented): `AuditEvent` entity + `AuditService` + `AuditController`
3. **RBAC** (already implemented): Admin/editor/viewer roles with `@PreAuthorize`
4. **SSO with SCIM** (ADR-025, ADR-026): Enterprise identity integration

However, there is no formal compliance framework:

- No compliance report generation
- No policy-as-code engine (ADR-020 proposed but not implemented)
- No evidence collection for SOC 2 / ISO 27001 / PCI audits
- No compliance scorecards visible in the platform
- No automated compliance rule evaluation
- No data retention or privacy controls (GDPR, LGPD)

The roadmap specifies Sprint 26-27 (Compliance & Governance) in Q1 2027 with:
- Policy as Code (OPA)
- Compliance frameworks
- Evidence collection
- Report automation

## Problem

How to build a compliance and governance framework that:

1. Provides compliance dashboards and scorecards visible to platform admins
2. Collects evidence automatically from platform operations (audit logs, configurations, access reviews)
3. Supports multiple compliance frameworks (SOC 2, ISO 27001, PCI DSS, LGPD)
4. Evaluates policies against platform state (can be rule-based — OPA integration is separate per ADR-020)
5. Generates compliance reports for external auditors
6. Operates without external dependencies beyond PostgreSQL and Spring Boot
7. Integrates with existing audit, IAM, and provisioning modules

## Alternatives Considered

| Alternative | Pros | Cons |
|-------------|------|------|
| **OPA (Open Policy Agent) — ADR-020** | Policy-as-code standard; decoupled evaluation | External service; complex setup; not yet implemented |
| **Custom compliance engine (chosen)** | Integrated with existing audit framework; no new deps | Must build from scratch; limited to rule-based policies |
| **Third-party compliance platform (Vanta, Drata)** | SOC 2 automation; evidence collection | Cost per month; external data access; contradicts $0 infra |
| **Manual compliance (spreadsheets)** | Zero cost | Not scalable; error-prone; fails audit |
| **Spring Modulith test-based compliance** | Automated via CI | Limited to technical controls; no evidence collection |

**Rationale for custom compliance engine**: Since ADR-020 (OPA) is flagged as "Not Implemented" and requires significant infra, a lightweight rule-based compliance engine can be built in ~2 sprints using existing audit infrastructure. OPA can be added later for advanced policy scenarios.

## Decision

### 1. Compliance Framework Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      COMPLIANCE & GOVERNANCE                         │
│                                                                     │
│  ┌──────────────────┐  ┌────────────────┐  ┌────────────────────┐  │
│  │ Compliance        │  │ Evidence       │  │ Report             │  │
│  │ Framework         │  │ Collector      │  │ Generator          │  │
│  │ (SOC2, ISO27001)  │  │ (automated)    │  │ (PDF/CSV export)   │  │
│  └────────┬─────────┘  └───────┬────────┘  └─────────┬──────────┘  │
│           │                    │                      │              │
│  ┌────────▼────────────────────▼──────────────────────▼──────────┐  │
│  │              Compliance Rule Engine                             │  │
│  │  (evaluates rules against audit data, config, entity state)    │  │
│  │  Rules: PASS / FAIL / NOT_APPLICABLE / ERROR                   │  │
│  └────────────────────────────────────────────────────────────────┘  │
│           │                    │                                      │
│  ┌────────▼────────────────────▼──────────────────────┐              │
│  │  Audit Module (events)  │  IAM (roles)  │  Config │              │
│  └────────────────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
```

### 2. Data Model

```sql
-- Compliance framework definition (SOC 2, ISO 27001, etc.)
CREATE TABLE compliance_frameworks (
    id              UUID DEFAULT gen_random_uuid(),
    tenant_id       VARCHAR(64) NOT NULL,
    name            VARCHAR(128) NOT NULL,     -- "SOC 2 Type II", "ISO 27001"
    version         VARCHAR(32) NOT NULL,       -- "2023", "2022"
    description     TEXT,
    enabled         BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, name, version)
);

-- Control within a framework
CREATE TABLE compliance_controls (
    id              UUID DEFAULT gen_random_uuid(),
    framework_id    UUID NOT NULL REFERENCES compliance_frameworks(id),
    control_id      VARCHAR(64) NOT NULL,       -- "CC6.1", "A.9.2.1"
    title           VARCHAR(256) NOT NULL,
    description     TEXT,
    category        VARCHAR(64),                -- "Access Control", "Cryptography"
    risk_level      VARCHAR(16) NOT NULL,       -- "high", "medium", "low"
    UNIQUE (framework_id, control_id)
);

-- Compliance rule (maps a control to an automated evaluation)
CREATE TABLE compliance_rules (
    id              UUID DEFAULT gen_random_uuid(),
    control_id      UUID NOT NULL REFERENCES compliance_controls(id),
    tenant_id       VARCHAR(64) NOT NULL,
    name            VARCHAR(256) NOT NULL,
    description     TEXT,
    rule_type       VARCHAR(32) NOT NULL,       -- "audit_query", "entity_check", "config_check"
    rule_config     JSONB NOT NULL,             -- rule-specific configuration
    severity        VARCHAR(16) NOT NULL DEFAULT 'medium',  -- "critical", "high", "medium", "low"
    enabled         BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Compliance evaluation result
CREATE TABLE compliance_evaluations (
    id              UUID DEFAULT gen_random_uuid(),
    rule_id         UUID NOT NULL REFERENCES compliance_rules(id),
    tenant_id       VARCHAR(64) NOT NULL,
    status          VARCHAR(16) NOT NULL,       -- "PASS", "FAIL", "NOT_APPLICABLE", "ERROR"
    details         TEXT,                         -- evaluation details / evidence reference
    evaluated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Evidence artifact
CREATE TABLE compliance_evidence (
    id              UUID DEFAULT gen_random_uuid(),
    control_id      UUID NOT NULL REFERENCES compliance_controls(id),
    tenant_id       VARCHAR(64) NOT NULL,
    title           VARCHAR(256) NOT NULL,
    description     TEXT,
    evidence_type   VARCHAR(32) NOT NULL,       -- "audit_log", "config_snapshot", "screenshot", "manual_upload"
    reference       TEXT,                         -- reference to source (event ID, file path, URL)
    collected_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMPTZ                  -- evidence retention
);

CREATE INDEX idx_comp_framework_tenant ON compliance_frameworks (tenant_id);
CREATE INDEX idx_comp_control_framework ON compliance_controls (framework_id);
CREATE INDEX idx_comp_rule_control ON compliance_rules (control_id);
CREATE INDEX idx_comp_eval_rule ON compliance_evaluations (rule_id, evaluated_at DESC);
CREATE INDEX idx_comp_evidence_control ON compliance_evidence (control_id);
```

### 3. Rule Types

#### Type 1: Audit Query Rules

Evaluated against the audit event log:

```json
{
    "rule_type": "audit_query",
    "rule_config": {
        "query": "SELECT COUNT(*) FROM audit_events WHERE event_type = 'USER_DELETED' AND created_by != 'SYSTEM' AND timestamp > NOW() - INTERVAL '30 days'",
        "expected": { "operator": "eq", "value": 0 },
        "description": "No manual user deletions in last 30 days (all deletions should go through SCIM)"
    }
}
```

#### Type 2: Entity Check Rules

Validate entity state:

```json
{
    "rule_type": "entity_check",
    "rule_config": {
        "entity": "SsoProviderConfig",
        "check": "enabled = true AND client_secret IS NOT NULL",
        "description": "All enabled SSO providers have client secrets configured"
    }
}
```

#### Type 3: Config Check Rules

Validate platform configuration:

```json
{
    "rule_type": "config_check",
    "rule_config": {
        "property": "cloudbuilder.scim.enabled",
        "expected": "true",
        "description": "SCIM provisioning is enabled (enterprise compliance)"
    }
}
```

### 4. Evaluation Scheduling

```java
// Compliance evaluation scheduler
@Component
public class ComplianceEvaluationService {
    
    @Scheduled(fixedRate = 3600000)  // Every hour
    public void evaluateAllRules() {
        var enabledRules = complianceRuleRepository.findByEnabledTrue();
        for (var rule : enabledRules) {
            try {
                var result = switch (rule.getRuleType()) {
                    case "audit_query" -> evaluateAuditQuery(rule);
                    case "entity_check" -> evaluateEntityCheck(rule);
                    case "config_check" -> evaluateConfigCheck(rule);
                    default -> EvaluationResult.ERROR;
                };
                complianceEvaluationRepository.save(
                    new ComplianceEvaluation(rule.getId(), tenantId, result)
                );
            } catch (Exception e) {
                log.error("Compliance rule evaluation failed: {}", rule.getId(), e);
            }
        }
    }
}
```

### 5. Evidence Collection

Automated evidence collection on key events:

```java
// Evidence hooks in existing services
@Component
public class ComplianceEvidenceCollector {
    
    @EventListener
    public void onAuditEvent(AuditEvent event) {
        // Collect evidence for relevant compliance controls
        if (isRelevantForCompliance(event)) {
            evidenceRepository.save(new ComplianceEvidence(
                controlIdForEvent(event),
                event.getTenantId(),
                "Audit Entry: " + event.getEventType(),
                event.getDescription(),
                "audit_log",
                event.getId(),
                event.getTimestamp()
            ));
        }
    }
    
    @EventListener
    public void onUserProvisioned(UserProvisionedEvent event) {
        evidenceRepository.save(new ComplianceEvidence(
            controlIdForFramework("SOC2", "CC6.1"), // Access provisioning
            event.getTenantId(),
            "User Provisioned: " + event.getUserEmail(),
            "SCIM auto-provisioning",
            "audit_log",
            event.getAuditEventId(),
            event.getTimestamp()
        ));
    }
}
```

### 6. Compliance Scorecard

Frontend view showing compliance posture:

```typescript
interface ComplianceScorecard {
    framework: string;           // "SOC 2 Type II"
    overallCompliance: number;   // 87 (percent)
    controlCount: number;        // 45
    passedControls: number;      // 39
    failedControls: number;      // 4
    notApplicable: number;       // 2
    lastEvaluation: string;      // ISO timestamp
    controls: ComplianceControl[];
}
```

### 7. Initial Framework Pack

**SOC 2 Type II** (initial — 10 controls):

| Control ID | Title | Rule Type | Risk |
|-----------|-------|-----------|------|
| CC6.1 | Logical access controls | entity_check | High |
| CC6.2 | User access provisioning | audit_query | High |
| CC6.3 | Access removal | audit_query | High |
| CC6.6 | Encryption of data in transit | config_check | High |
| CC7.1 | Monitoring and detection | audit_query | Medium |
| CC7.2 | Incident response | audit_query | Medium |
| CC8.1 | Change management | audit_query | Medium |
| CC9.1 | Risk assessment | manual | Low |

**LGPD Brasil** (initial — 5 controls):

| Control ID | Title | Rule Type | Risk |
|-----------|-------|-----------|------|
| LGPD-01 | Data subject access request | audit_query | High |
| LGPD-02 | Consent management | entity_check | High |
| LGPD-03 | Data retention policy | config_check | Medium |
| LGPD-04 | Data breach notification | audit_query | High |
| LGPD-05 | Data processing records | audit_query | Medium |

### 8. Report Generation

```java
// PDF/CSV compliance report generator
@Service
public class ComplianceReportService {
    
    public byte[] generateReport(String frameworkId, String tenantId, ReportFormat format) {
        var framework = frameworkRepository.findById(frameworkId);
        var controls = controlRepository.findByFrameworkId(frameworkId);
        var evaluations = evaluationRepository.findLatestByFramework(frameworkId);
        var evidence = evidenceRepository.findByFramework(frameworkId);
        
        return switch (format) {
            case PDF -> generatePdfReport(framework, controls, evaluations, evidence);
            case CSV -> generateCsvReport(controls, evaluations);
        };
    }
}
```

## Trade-offs

- **Rule-based vs. OPA policy engine**: Rule-based engine is simpler and uses existing infrastructure but limited to boolean checks. OPA (ADR-020) supports complex policy decisions (e.g., "deny deployment if cost > budget"). Use rule-based for compliance monitoring; add OPA for policy enforcement when needed.

- **Built-in frameworks vs. custom frameworks**: Pre-built SOC 2 and LGPD controls accelerate adoption but may not match every organization's exact requirements. The data model supports custom frameworks and controls — organizations can add their own.

- **Automated vs. manual evidence**: Automated evidence collection covers ~70% of controls. Remaining 30% (policies, risk assessments, training records) require manual upload. The evidence model supports both.

- **Compliance vs. performance**: Compliance evaluation adds database load. Mitigated by hourly scheduling and indexed queries. Real-time compliance dashboards use cached results.

## Consequences

1. **New**: `ComplianceFramework`, `ComplianceControl`, `ComplianceRule`, `ComplianceEvaluation`, `ComplianceEvidence` entities
2. **New**: `ComplianceEvaluationService.java` — scheduled rule evaluation
3. **New**: `ComplianceEvidenceCollector.java` — event-driven evidence collection
4. **New**: `ComplianceReportService.java` — PDF/CSV report generation
5. **New**: `ComplianceController.java` — REST endpoints for frameworks, controls, evaluations, evidence, reports
6. **New**: Frontend compliance module — ComplianceScorecard, ControlList, EvidenceView
7. **New**: Database migration — `V11__compliance_schema.sql`
8. **Modified**: `AuditService.java` — emit domain events for evidence collection
9. **New**: `ComplianceConfiguration.java` — `@ConditionalOnProperty(name = "cloudbuilder.compliance.enabled", havingValue = "true")`
10. **Configuration**: `cloudbuilder.compliance.enabled=false` by default
11. **Testing**: Unit tests for rule evaluation; integration tests for evidence collection and report generation

## References

- SOC 2 Trust Services Criteria: https://www.aicpa-cima.com/topic/audit-assurance/audit-and-assurance/soc-2
- ISO/IEC 27001:2022: https://www.iso.org/standard/27001
- LGPD (Lei Geral de Proteção de Dados Pessoais): https://www.gov.br/cidadania/pt-br/acesso-a-informacao/lgpd
- ADR-012: Q3 Operations Architecture (section 3 defines initial compliance strategy pattern)
- ADR-020: Policy-as-Code with OPA (implemented; OPA sidecar for policy evaluation)
- ADR-008: Native Observability Subsystem (monitoring foundation)
- CloudBuilder Roadmap — Sprints 26-27 (Compliance & Governance)

> **Note**: Section 3 of ADR-012 defines a minimal compliance rule strategy pattern (`ComplianceRuleStrategy` interface) with 4 initial strategies. ADR-029 supersedes that with a full compliance framework including frameworks, controls, scheduled evaluation, evidence collection, and report generation. The two coexist: ADR-012's rule engine handles technical audit checks; ADR-029 adds the enterprise compliance layer (SOC 2, LGPD, evidence, reports).
