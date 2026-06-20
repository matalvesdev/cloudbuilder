## 2. Sprint 9 — Observabilidade Enhancements

### 2.1 Current State

| Layer | What Exists | What's Missing |
|-------|------------|----------------|
| Schema | schema.sql (12 tables: alert_rules, incidents, incident_timeline, notification_channels, slo_definitions, sli_snapshots, dashboards, metrics_ts, traces, spans, logs) | — |
| Backend | Alert.java, ServiceHealth.java, HealthCheckService.java | AlertRuleEntity, IncidentEntity, Timeline, SLO entities, NotificationChannel |
| Backend Controllers | ObserveController (dashboard + health basic) | AlertRuleController, IncidentController, SloController, NotificationChannelController |
| Frontend | AlertRulesView.tsx, IncidentsView.tsx, SloDashboard.tsx, MetricsDashboard, TraceExplorer, LogViewer | Backend API endpoints |
| Frontend API | observabilityApi.ts (calls /observability/*) | Backend /api/v1/observability/* routes |

### 2.2 Entities to Create

#### AlertRuleEntity
```java
@Entity @Table(name = "alert_rules")
public class AlertRuleEntity {
    @Id private String id;
    private String tenantId;
    private String name;
    @Column(columnDefinition = "TEXT") private String description;
    private String metricName;
    private String condition;      // gt, lt, gte, lte
    private double threshold;
    private int durationSec;
    private String severity;       // critical, warning, info
    private boolean enabled;
    @Column(columnDefinition = "TEXT") private String notifyChannels; // JSON
    private Instant createdAt, updatedAt;
}
```

#### IncidentEntity
```java
@Entity @Table(name = "incidents",
    uniqueConstraints = @UniqueConstraint(name="uq_open_incident_per_rule",
        columnNames={"alertRuleId","status"}, condition="status='OPEN'"))
public class IncidentEntity {
    @Id private String id;
    private String alertRuleId;
    private String tenantId;
    private String title;
    @Column(columnDefinition = "TEXT") private String description;
    private String severity, status; // OPEN, ACKNOWLEDGED, RESOLVED
    private Double currentValue, threshold;
    private Instant startedAt, acknowledgedAt, resolvedAt;
}
```

#### IncidentTimelineEntity
```java
@Entity @Table(name = "incident_timeline")
public class IncidentTimelineEntity {
    @Id private String id;
    private String incidentId;
    private String eventType;   // CREATED, ACKNOWLEDGED, RESOLVED, COMMENT
    @Column(columnDefinition = "TEXT") private String description;
    private String createdBy;
    private Instant createdAt;
}
```

#### NotificationChannelEntity
```java
@Entity @Table(name = "notification_channels")
public class NotificationChannelEntity {
    @Id private String id;
    private String tenantId, name;
    private String type;          // EMAIL, SLACK, WEBHOOK, PAGERDUTY
    @Column(columnDefinition = "TEXT") private String config; // JSON
    private boolean enabled;
}
```

#### SloDefinitionEntity + SloSnapshotEntity
Map to slo_definitions and sli_snapshots tables respectively.

### 2.3 Services

#### AlertEvaluationService
```java
@Service
public class AlertEvaluationService {
    @Scheduled(fixedRate = 30_000) // every 30s
    public void evaluateAllRules() {
        // 1. Load enabled alert rules
        // 2. For each rule, query current metric from metrics_ts
        // 3. Compare value vs threshold
        // 4. If breached AND no OPEN incident:
        //    a. Create Incident (OPEN)
        //    b. Add timeline entry (CREATED)
        //    c. AuditEvent (INCIDENT_CREATED)
        //    d. If notifyChannels set, trigger NotificationService
        // 5. Record evaluation in alert_rule_evaluations
    }
}
```

#### IncidentService
- `acknowledge(id)` → status=ACKNOWLEDGED, timeline entry
- `resolve(id)` → status=RESOLVED, timeline entry
- `getTimeline(incidentId)` → ordered list
- `getActive(tenantId)` → OPEN/ACKNOWLEDGED
- `getHistory(tenantId, page, size)` → paginated resolved

#### SloService
```java
@Service
public class SloService {
    @Scheduled(cron = "0 0 * * * ?") // hourly
    public void computeSliSnapshots() {
        // For each enabled SLO definition:
        // 1. Query metrics_ts for good/total count in window
        // 2. Calculate SLI %, error budget
        // 3. Save SliSnapshotEntity
    }
    public List<SloStatusDTO> getSloStatus(String tenantId) {
        // Latest snapshot per SLO with BREACHED/WITHIN status
    }
}
```

#### NotificationService
```java
@Service
public class NotificationService {
    public void send(IncidentEntity incident, List<NotificationChannelEntity> channels) {
        // For each channel:
        // - EMAIL: JavaMailSender
        // - SLACK: POST webhook
        // - WEBHOOK: POST JSON payload
        // - PAGERDUTY: Events API v2
        // Log notification attempt
    }
}
```

### 2.4 Controllers

| Controller | Base Path | Endpoints |
|-----------|-----------|-----------|
| AlertRuleController | /api/v1/observability/alert-rules | GET, POST, PUT, DELETE |
| IncidentController | /api/v1/observability/incidents | GET, POST acknowledge, POST resolve, GET timeline |
| SloController | /api/v1/observability/slo | GET status, GET/POST/DELETE definitions, GET history |
| NotificationChannelController | /api/v1/observability/notification-channels | GET, POST, PUT, DELETE |
| DashboardController | /api/v1/observability/dashboards | GET, POST, PUT, DELETE |

### 2.5 Frontend Changes
- Update observabilityApi.ts base URL from /observability to /api/v1/observability
- Add timeline panel to IncidentsView.tsx (expandable per incident)
- Add NotificationChannelsView.tsx (new tab in ObserveModule)
- SLO dashboard: integrate recharts for actual line charts

### 2.6 Test Plan
- AlertEvaluationServiceTest: mock metric values, verify incident creation per threshold breach
- IncidentServiceTest: acknowledge, resolve, timeline ordering
- SloServiceTest: snapshot computation with known good/total counts
- NotificationServiceTest: verify channel dispatch (mock HTTP/email)
- E2E: Alert rule → metric breach → incident → acknowledge → resolve
