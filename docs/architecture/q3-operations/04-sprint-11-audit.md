## 4. Sprint 11 — Audit & Compliance

### 4.1 Current State
- AuditEvent.java: basic fields (id, tenantId, userId, action, resourceType, resourceId, details, ipAddress, timestamp)
- AuditService: recordEvent + getEventsByTenant + getEventsByUser (no pagination)
- AuditController: GET /events/{tenantId} + POST /events
- AuditEventRepository: findByTenantId, findByUserId, findByAction (no filtering, no pagination)

### 4.2 Enhanced Audit Query Service

```java
@Service
@Transactional(readOnly = true)
public class AuditQueryService {
    public Page<AuditEvent> queryEvents(AuditFilter filter, Pageable pageable) {
        // Spring Data JPA Specifications for dynamic WHERE
        // Filters: tenantId, userId, action, resourceType, resourceId,
        //          dateRange (startTime-endTime), ipAddress
        // Sort: timestamp desc (default)
        // Paginated via Pageable
    }

    public List<AuditAggregation> getAggregatedByAction(String tenantId, LocalDate start, LocalDate end);
    public List<AuditAggregation> getAggregatedByUser(String tenantId, LocalDate start, LocalDate end);
    public List<AuditAggregation> getAggregatedByDay(String tenantId, LocalDate start, LocalDate end);
}
```

**AuditFilter DTO**:
```java
public record AuditFilter(
    String tenantId, String userId, String action, String resourceType,
    String resourceId, Instant startTime, Instant endTime, String ipAddress
) {}
```

### 4.3 Compliance Rules Engine

**Architecture**: Strategy Pattern

```
                    ┌──────────────────┐
                    │ ComplianceService │
                    └────────┬─────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
  ┌──────▼──────┐    ┌──────▼──────┐    ┌──────▼──────┐
  │AuditTrail   │    │AccessControl│    │DataRetention│
  │RuleStrategy │    │RuleStrategy │    │RuleStrategy │
  └─────────────┘    └─────────────┘    └─────────────┘
```

**Interface**:
```java
public interface ComplianceRuleStrategy {
    ComplianceCheckResult evaluate(ComplianceRule rule, String tenantId);
    String getRuleType();
}

public record ComplianceCheckResult(String status, String details, Map<String, Object> evidence) {}
```

**Built-in Strategies**:

| Strategy | Rule Type | Evaluation Logic |
|----------|-----------|-----------------|
| AuditTrailRuleStrategy | AUDIT_TRAIL | Check audit_events for gaps > 24h without audit trail. Verify critical actions (DELETE, ROLE_CHANGE) are logged. |
| AccessControlRuleStrategy | ACCESS_CONTROL | Find stale admin users (90d inactive). Flag excessive role assignments. |
| DataRetentionRuleStrategy | DATA_RETENTION | Verify partition boundaries exist. Check archival status of data > 1y. Validate backup frequency. |
| EncryptionRuleStrategy | ENCRYPTION | Verify TLS endpoints configured. Check no plaintext secrets. JWT signing key rotation. |

### 4.4 ComplianceRule + ComplianceCheck Entities

```java
@Entity @Table(name = "compliance_rules")
public class ComplianceRule {
    @Id private String id;
    private String tenantId, name;
    @Column(columnDefinition="TEXT") private String description;
    private String ruleType;    // AUDIT_TRAIL, ACCESS_CONTROL, DATA_RETENTION, ENCRYPTION
    @Column(columnDefinition="TEXT") private String configJson; // rule-specific config
    private String severity;    // CRITICAL, HIGH, MEDIUM, LOW
    private boolean enabled;
    private Instant createdAt, updatedAt;
}

@Entity @Table(name = "compliance_checks")
public class ComplianceCheck {
    @Id private String id;
    private String complianceRuleId, tenantId;
    private String status;      // PASS, FAIL, ERROR
    @Column(columnDefinition="TEXT") private String details;
    private Instant checkedAt;
}
```

### 4.5 ComplianceService

```java
@Service
public class ComplianceService {
    @Scheduled(cron = "0 0 8 * * ?") // daily 8 AM
    public void runAllRules() {
        // For each enabled compliance rule:
        // 1. Look up strategy by ruleType
        // 2. strategy.evaluate(rule, tenantId)
        // 3. Save ComplianceCheck result
        // 4. If FAIL, create alert event
    }

    public ComplianceSummary getSummary(String tenantId) {
        // Score = pass / total * 100
        // Breakdown by ruleType
    }
}
```

### 4.6 AuditExportService

```java
@Service
public class AuditExportService {
    public byte[] exportCsv(AuditFilter filter);   // Query + CSV format
    public byte[] exportJson(AuditFilter filter);  // Query + JSON array
}
```

### 4.7 Controller Endpoints

```
# Audit Events (replaces existing AuditController)
GET    /api/v1/audit/events                    → Query (paginated, filtered)
GET    /api/v1/audit/events/aggregate           → Aggregated stats

# Export
GET    /api/v1/audit/export/csv                 → CSV download
GET    /api/v1/audit/export/json                → JSON download

# Compliance Rules
GET    /api/v1/audit/compliance/rules           → List rules
POST   /api/v1/audit/compliance/rules           → Create rule
PUT    /api/v1/audit/compliance/rules/{id}      → Update rule
DELETE /api/v1/audit/compliance/rules/{id}      → Delete rule
PUT    /api/v1/audit/compliance/rules/{id}/toggle → Enable/disable

# Compliance Checks
GET    /api/v1/audit/compliance/checks           → Latest checks
GET    /api/v1/audit/compliance/summary          → Score summary
POST   /api/v1/audit/compliance/run              → Trigger immediate run
```

### 4.8 Frontend Changes
- Audit Timeline: paginated event list with action/resource/user/date filters
- Compliance Dashboard: gauge chart showing score, rule status table
- Export buttons: CSV/JSON download triggers
- Compliance Rule CRUD: admin panel for managing rules (reuse existing dialog patterns)

### 4.9 Test Plan
- AuditQueryServiceTest: all filter combinations, pagination edge cases
- AuditExportServiceTest: CSV/JSON format correctness
- ComplianceServiceTest: mock rule configs, verify PASS/FAIL logic
- Strategy tests: each strategy with known-good and known-bad inputs
- E2E: Create compliance rule → run check → verify result in dashboard
