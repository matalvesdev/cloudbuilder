## 3. Sprint 10 — Cost Management

### 3.1 Current State
- Budget.java, CostRecord.java, CostScenario.java exist
- CostService: basic CRUD + simple pro-rata monthly forecast
- CostScenarioService: basic CRUD
- CostController: 10 endpoints (overview, records, budgets, scenarios)
- Frontend CostModule.tsx: complete UI but uses mock data in costStore

### 3.2 New Services

#### BudgetAlertService
```java
@Service
public class BudgetAlertService {
    @Scheduled(cron = "0 0 6 * * ?") // daily 6 AM
    public void evaluateAllBudgets() {
        // 1. Load all ACTIVE budgets
        // 2. Query cost_records for current period spend
        // 3. Usage% = spent / limit * 100
        // 4. Thresholds: >=100% CRITICAL, >=80% WARNING, <80% OK
        // 5. If breached: publish BudgetThresholdBreachedEvent
        // 6. AuditEvent (BUDGET_THRESHOLD_BREACHED)
    }
}
```

**Cross-module event**: Spring Modulith ApplicationEventPublisher fires BudgetThresholdBreachedEvent that observe module's NotificationService picks up.
```java
public record BudgetThresholdBreachedEvent(
    String budgetId, String budgetName, String environmentId,
    double limitAmount, double spentAmount, double usagePercent, String severity
) {}
```

#### AnomalyDetectionService
See full algorithm in section 5. Summary:
- Daily analysis of last 90 days of CostRecords, grouped by service
- Custom composite: trend-adjusted baseline + Z-score
- Flags: SPIKE (|Z|>5), ANOMALY (|Z|>3), TREND (consecutive 3+ days |Z|>2.5)
- Creates CostAnomaly records + alerts

#### CostProjectionService
```java
@Service
public class CostProjectionService {
    public CostProjection projectNext30Days(String environmentId) {
        // Linear regression on last 90 days
        // y = mx + b; x=day index, y=daily cost
        // Returns: projected amounts, 95% CI bounds, trend direction
    }
}
```

Linear regression formula:
- slope m = (n*Σ(xy) - Σx*Σy) / (n*Σ(x²) - (Σx)²)
- intercept b = (Σy - m*Σx) / n
- Projected = m * dayIndex + b for next 30 days
- 95% CI: ±1.96 * standard_error

### 3.3 New Entities

#### CostAnomaly
```java
@Entity @Table(name = "cost_anomalies")
public class CostAnomaly {
    @Id private String id;
    private String environmentId, serviceName;
    private LocalDate date;
    private double actualAmount, expectedAmount, zScore;
    private String anomalyType;   // SPIKE, UPWARD_TREND, DOWNWARD_TREND
    private String severity;      // LOW, MEDIUM, HIGH
    @Column(columnDefinition = "TEXT") private String description;
    private boolean resolved;
    private Instant detectedAt;
}
```

#### CostProjection
```java
@Entity @Table(name = "cost_projections")
public class CostProjection {
    @Id private String id;
    private String environmentId;
    private LocalDate projectionDate;
    private double projectedAmount, lowerBound, upperBound, confidenceLevel;
    private String trend;   // RISING, FALLING, STABLE
    private Instant computedAt;
}
```

### 3.4 Controller Endpoints (added to CostController)

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/cost/{envId}/anomalies | List anomalies |
| POST | /api/v1/cost/{envId}/anomalies/{id}/resolve | Resolve anomaly |
| GET | /api/v1/cost/{envId}/projection | 30-day projection |
| GET | /api/v1/cost/{envId}/budgets/alerts | Budget threshold alerts |
| GET | /api/v1/cost/scenarios/{id1}/compare?otherId={id2} | Side-by-side scenario comparison |
| GET | /api/v1/cost/{envId}/budgets/{id}/history | Budget spend history (daily) |

### 3.5 Frontend Changes
1. **Budget vs Actual**: Recharts BarChart — budget limit vs actual spend per budget
2. **Anomaly indicators**: CostAnomaly list with severity badges, resolve action
3. **Projection chart**: Recharts LineChart — actual + projected + CI band
4. **What-if comparison**: Side-by-side scenario diff view (reuse CostScenarioService)

### 3.6 Test Plan
- BudgetAlertServiceTest: mock records at 75%, 85%, 105% of limit
- AnomalyDetectionServiceTest: inject known pattern (steady + spike day)
- CostProjectionServiceTest: inject linear data, verify slope matches
- CostAnomalyRepositoryTest: query perf on 10K records
