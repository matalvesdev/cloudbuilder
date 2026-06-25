# ADR-027: Performance Optimization Strategy

**Status**: Proposed
**Date**: 2026-06-22
**Author**: Platform Engineering Team

## Context

CloudBuilder's current performance baseline (measured 2026-06-17):

| Metric | Current Value | Target |
|--------|---------------|--------|
| Bundle principal | 322KB gzip | < 400KB |
| Vite build time | 8.84s | < 15s |
| Frontend tests | 62 pass (5 suites) | 100% pass |
| Backend tests | 40 pass (4 suites) | 100% pass |
| Go tests | 23 pass | 100% pass |
| TypeScript errors | 0 | 0 |

As the platform grows toward Sprints 28-29 (Performance at Scale) in Q1 2027, with 20+ Zustand stores, 54+ module files, and growing backend complexity, a proactive performance strategy is needed:

1. **Frontend**: Bundle size grows with each new module; lazy loading already implemented but needs auditing
2. **Backend**: Query patterns (N+1, missing indexes, unoptimized joins) not systematically reviewed
3. **Infrastructure**: No CDN, no image optimization, no read replicas configured
4. **Database**: No query profiling, no connection pooling tuning, no BRIN index audit
5. **Observability**: No performance regression guardrails in CI

The roadmap explicitly calls for:
- Sprint 20 (Q4 2026): Bundle analysis, lazy loading audit, Core Web Vitals
- Sprint 28-29 (Q1 2027): Read replicas, sharding, connection pooling, virtual scrolling, load testing (k6)

## Problem

How to establish a comprehensive performance optimization strategy that:

1. Defines measurable performance budgets and SLIs for frontend and backend
2. Identifies the highest-leverage optimization opportunities in the current codebase
3. Establishes CI/CD performance regression detection
4. Scales from current baseline (322KB bundle, 8.84s build) to enterprise workload
5. Does not introduce premature optimization or new external dependencies
6. Integrates with the existing Native Observability subsystem (ADR-008)

## Alternatives Considered

| Alternative | Pros | Cons |
|-------------|------|------|
| **Ad-hoc optimization** | No planning overhead | Misses systemic issues; fixes symptoms not root causes |
| **Dedicated performance sprint** | Focused effort | Hard to justify vs. feature work; regressions come back |
| **Continuous performance budget (chosen)** | Automated guardrails; visible to all devs | Requires CI setup; false positives possible |
| **Third-party APM (Datadog/New Relic)** | Rich profiling | External dependency; contradicts $0 infra principle (ADR-008) |
| **k6 load testing only** | Validates scale | Reactive; doesn't prevent regressions |

**Rationale for continuous performance budgets**: Prevention > detection > cleanup. Automated budgets in CI catch regressions before they reach production, without needing a dedicated performance team.

## Decision

### 1. Frontend Performance Budgets

Define explicit budgets checked in CI via `vite build --report`:

```javascript
// vite.config.ts — performance budgets
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: { /* existing lazy chunks */ },
      },
    },
    // Bundle size budgets (enforced via vite-plugin-performance)
    // Plugin will fail build if exceeded
  },
});
```

| Metric | Budget | Measurement |
|--------|--------|-------------|
| Main bundle (gzip) | < 400KB | `vite build --report` |
| Entry chunk (gzip) | < 100KB | `vite build` |
| Lazy chunk (max) | < 80KB | `vite build` |
| Total JS (gzip) | < 600KB | `vite build` |
| Total CSS (gzip) | < 50KB | `vite build` |
| Lighthouse Performance | ≥ 90 | CI Lighthouse run |
| LCP | < 2.5s | Web Vitals monitoring |
| TTI | < 3.5s | Web Vitals monitoring |

### 2. Backend Performance Budgets

| Metric | Budget | Measurement |
|--------|--------|-------------|
| P95 API latency | < 200ms | Native metrics (MetricsService) |
| P99 API latency | < 500ms | Native metrics (MetricsService) |
| API error rate | < 0.1% | Native metrics (MetricsService) |
| DB query P95 | < 50ms | Hibernate statistics |
| DB connection pool | < 20 concurrent | HikariCP metrics |
| Heap usage | < 70% after GC | JVM metrics |

### 3. Optimization Priority Queue

#### P0 — Critical (immediate, no new code)

1. **N+1 query audit**: Scan all JPA repositories for `@EntityGraph` or `JOIN FETCH` opportunities
   - Known hotspots: CanvasService.loadCanvasWithNodes(), IamService.getUserWithRoles()
   - Fix: Add `@EntityGraph(attributePaths = {"nodes", "edges"})` to CanvasRepository
2. **Missing database indexes**: Audit all queries against existing indexes
   - Add BRIN indexes on time-series tables (metrics_ts, traces, logs)
   - Add composite indexes for common query patterns (tenant_id + timestamp DESC)
3. **JSON serialization tuning**: Ensure Jackson uses `@JsonInclude(Include.NON_NULL)` on all DTOs
4. **Static asset caching**: Add `Cache-Control: public, max-age=31536000, immutable` for hashed assets

#### P1 — High (Sprint 20, Q4 2026)

1. **Code splitting audit**: Review all `React.lazy()` imports; split oversized modules
   - Design module (54 files) → potential sub-splits: Palette / Canvas / Properties / AI Chat
   - Provision module (10 files) → Code / Deploy / History
2. **Image optimization**: Convert all images to WebP with responsive srcset
   - CloudBuilder logo, provider icons (AWS/Azure/GCP/K8s), empty state illustrations
3. **Virtual scrolling for large lists**: Canvas node palette, audit log, incident list
   - Use `react-window` or native virtualization added
   - Target: 10,000+ items without DOM overhead
4. **Bundle analysis workflow**: Add `vite-plugin-visualizer` for build reports

#### P2 — Medium (Sprints 28-29, Q1 2027)

1. **Database connection pooling**: Tune HikariCP for multi-tenant workload
   ```yaml
   spring:
     datasource:
       hikari:
         maximum-pool-size: 20
         minimum-idle: 5
         idle-timeout: 300000
         connection-timeout: 2000
   ```
2. **Read replicas**: Configure read-only traffic to replica
   - All `GET` endpoints → replica datasource
   - All `POST/PUT/DELETE` → primary datasource
   - `@Transactional(readOnly = true)` routing
3. **Query caching**: Add Caffeine cache for low-churn data
   - `ComponentDefinition` — cache TTL 5min
   - `Role` permissions — cache TTL 10min
   - `Tenant` configuration — cache TTL 1min
4. **Frontend data caching**: Zustand store persistence selectors
   - Avoid re-renders with `useShallow` selectors
   - Memoize expensive computations with `useMemo`

### 4. CI Performance Regression Detection

```yaml
# .github/workflows/ci.yml — additional performance job
performance-check:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - name: Build frontend
      run: npm run build
    - name: Check bundle size
      run: |
        # Compare main bundle size against threshold
        MAIN_BUNDLE=$(du -sb dist/assets/index-*.js | cut -f1)
        if [ $MAIN_BUNDLE -gt 400000 ]; then
          echo "❌ Main bundle exceeds 400KB budget"
          exit 1
        fi
    - name: Lighthouse CI
      uses: treosh/lighthouse-ci-action@v11
      with:
        urls: |
          http://localhost:3000/
          http://localhost:3000/design
        budgetPath: ./lighthouse-budget.json
```

### 5. Observability Integration

Performance metrics feed into the Native Observability subsystem (ADR-008):

```java
// MetricsService.record() captures performance SLIs
@Component
public class PerformanceMetrics {
    private final MetricsService metricsService;
    
    @EventListener
    public void onApiRequest(ApiRequestEvent event) {
        metricsService.record("api.latency", event.getDurationMs(),
            Tags.of("endpoint", event.getPath(), "method", event.getMethod()));
    }
}
```

Frontend Web Vitals collected via `web-vitals` library (or custom PerformanceObserver):

```typescript
// Performance monitoring hook
function usePerformanceMetrics() {
    useEffect(() => {
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                // Send to backend MetricsService
                api.recordMetric({
                    name: `web-vitals.${entry.name}`,
                    value: entry.value,
                    tags: { page: window.location.pathname }
                });
            }
        });
        observer.observe({ type: 'largest-contentful-paint', buffered: true });
        return () => observer.disconnect();
    }, []);
}
```

## Trade-offs

- **Static budgets vs. dynamic baselines**: Static budgets (e.g., < 400KB) are simple but may become obsolete. Dynamic baselines (compare against last commit) are more accurate but require baseline storage. Start with static budgets, add dynamic baselines in Sprint 28.

- **Read replicas vs. complexity**: Read replicas add deployment complexity (connection routing, replication lag). For the current scale (single team, dev/staging only), optimize queries first. Add replicas when P95 latency exceeds 200ms consistently.

- **Virtual scrolling vs. simplicity**: Virtual scrolling adds complexity (variable row heights, scroll position restoration). Only apply to known large lists (audit log, incidents). Skip for small lists (< 100 items).

- **Caching vs. freshness**: Caffeine cache improves latency but risks stale data. Use short TTLs (1-5min) for mutable data, infinite cache for immutable (component definitions, provider templates).

## Consequences

1. **New**: Performance budget configuration in `vite.config.ts`
2. **New**: CI performance check job in `.github/workflows/ci.yml`
3. **Modified**: Database migration scripts — add BRIN indexes, composite indexes
4. **Modified**: JPA repositories — add `@EntityGraph` for N+1 prevention
5. **Modified**: DTO classes — add `@JsonInclude(Include.NON_NULL)`
6. **New**: Performance SLI dashboards in Observe module (Web Vitals + API latency)
7. **Modified**: `application.yml` — HikariCP tuning, cache TTLs
8. **New**: Component caching in `ComponentDefinitionService` (Caffeine, 5min TTL)
9. **Modified**: Large list frontend components — virtual scrolling via `react-window`
10. **Testing**: Performance regression tests with k6 (Sprint 28-29)
11. **Documentation**: Performance optimization runbook for developers

## References

- ADR-008: Native Observability Subsystem (metrics foundation)
- Vite performance guide: https://vitejs.dev/guide/performance.html
- Web Vitals: https://web.dev/vitals/
- Lighthouse CI: https://github.com/GoogleChrome/lighthouse-ci
- HikariCP configuration: https://github.com/brettwooldridge/HikariCP
- CloudBuilder Roadmap — Sprint 20 (Performance Optimization), Sprints 28-29 (Performance at Scale)
