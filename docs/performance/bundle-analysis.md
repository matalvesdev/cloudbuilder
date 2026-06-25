# Bundle Analysis — CloudBuilder Frontend

> **Date**: 2026-06-22
> **Tool**: Vite 6.4.3 + rollup
> **Analyzed by**: Performance Agent (FAANg)

---

## 1. Current Bundle Overview

**Build command**: `npx vite build`
**Build time**: 9.3s
**Total modules**: 2,532
**Total JS size**: ~2.1 MB (656 kB gzip)
**Total CSS size**: ~106 kB (17 kB gzip)

### Chunk Size Table (sorted by size)

| # | Chunk | Raw Size | Gzipped | Load Type | % of Total |
|---|-------|---------|---------|-----------|-----------|
| 1 | `vendor-recharts` | 390.73 kB | 112.24 kB | 🟡 Lazy | 18.6% |
| 2 | `index` (main entry) | 315.80 kB | 88.95 kB | 🔴 Initial | 15.0% |
| 3 | `DesignModule` | 304.25 kB | 70.40 kB | 🟢 Lazy | 14.5% |
| 4 | `vendor-reactflow` | 185.36 kB | 60.34 kB | 🟢 Lazy (via Design) | 8.8% |
| 5 | `ProvisionModule` | 176.62 kB | 37.72 kB | 🟢 Lazy | 8.4% |
| 6 | `vendor-radix` | 145.82 kB | 45.92 kB | 🔴 Initial | 6.9% |
| 7 | `ObserveModule` | 107.88 kB | 23.21 kB | 🟢 Lazy | 5.1% |
| 8 | `SettingsModule` | 72.06 kB | 14.18 kB | 🟢 Lazy | 3.4% |
| 9 | `AIOpsModule` | 67.96 kB | 16.51 kB | 🟢 Lazy | 3.2% |
| 10 | `DashboardModule` | 65.74 kB | 15.08 kB | 🟢 Lazy | 3.1% |
| 11 | `PlatformModule` | 62.74 kB | 15.15 kB | 🟢 Lazy | 3.0% |
| 12 | `CostModule` | 50.24 kB | 10.65 kB | 🟢 Lazy | 2.4% |
| 13 | `IAMModule` | 42.73 kB | 8.67 kB | 🟢 Lazy | 2.0% |
| 14 | `AuditModule` | 40.21 kB | 9.80 kB | 🟢 Lazy | 1.9% |
| 15 | `DocsModule` | 20.90 kB | 6.44 kB | 🟢 Lazy | 1.0% |
| 16 | `AnalyticsModule` | 9.29 kB | 2.79 kB | 🟢 Lazy | 0.4% |
| — | CSS `index` | 90.64 kB | 14.67 kB | 🔴 Initial | 4.3% |
| — | CSS `style` | 15.87 kB | 2.67 kB | 🔴 Initial | 0.8% |

**Legend**:
- 🔴 **Initial**: Loaded on every page (blocking)
- 🟡 **Lazy**: Loaded on demand, but heavy
- 🟢 **Lazy**: Loaded on demand, acceptable size

---

## 2. Initial Load Analysis

The **initial load** consists of:
1. `index.html` — 0.84 kB
2. `index.js` — 315.80 kB (gzip 88.95 kB)
3. `vendor-radix.js` — 145.82 kB (gzip 45.92 kB)
4. `index.css` — 90.64 kB (gzip 14.67 kB)
5. `style.css` — 15.87 kB (gzip 2.67 kB)

**Total initial JS**: 461.62 kB (gzip 134.87 kB)
**Total initial CSS**: 106.51 kB (gzip 17.34 kB)

### What's in the main `index.js` (315 kB)?

The main entry chunk contains everything statically imported in `App.tsx`:

1. **lucide-react icons** (~24 icons): `LayoutDashboard`, `Box`, `Eye`, `DollarSign`, `Cpu`, `BrainCircuit`, `Cloud`, `LogOut`, `ScrollText`, `Shield`, `Activity`, `ChevronRight`, `ChevronDown`, `Settings`, `Building2`, `Check`, `BookOpen`, `Search`, `X`, `ArrowRight`, `BarChart3`
2. **Zustand stores** (7 stores): `uiStore`, `authStore`, `tenantStore`, `onboardingStore`, `credentialStore`, `repoStore`
3. **Core components**: `LoginPage`, `RegisterPage`, `ForgotPasswordPage`, `ResetPasswordPage`, `OnboardingWelcome`, `OnboardingTour`, `GatewaySetup`, `ToastProvider`, `TenantSelector`, `ProtectedContent`, `ErrorBoundary`, `OfflineBanner`, `GlobalSearch`
4. **shadcn/ui components**: `button`, plus transitive dependencies
5. **All `lucide-react`** package (tree-shaken but still significant)
6. **`@/lib/utils`** (cn utility)
7. **`@/api/client`** (HttpClient with JWT)

### What's in `vendor-radix` (146 kB)?

All @radix-ui packages used across the app:
- `@radix-ui/react-collapsible`, `@radix-ui/react-context-menu`,
- `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`,
- `@radix-ui/react-hover-card`, `@radix-ui/react-label`,
- `@radix-ui/react-popover`, `@radix-ui/react-progress`,
- `@radix-ui/react-scroll-area`, `@radix-ui/react-select`,
- `@radix-ui/react-separator`, `@radix-ui/react-tabs`,
- `@radix-ui/react-toast`, `@radix-ui/react-toggle`,
- `@radix-ui/react-tooltip`

> **Note**: `vendor-radix` is in the initial load because these components are used by components that are statically imported in `App.tsx` (like `TenantSelector`, header UI elements).

---

## 3. Code Splitting Assessment

### ✅ Already Good

| Strategy | Status | Details |
|----------|--------|---------|
| Module-level lazy loading | ✅ | All 12 modules lazy-loaded via `React.lazy()` in `App.tsx` |
| vendor-reactflow chunk | ✅ | 185 kB separated, only loaded when DesignModule activates |
| vendor-recharts chunk | ✅ | 391 kB separated, only loaded on Dashboard/Cost/Observe |
| vendor-radix chunk | ✅ | 146 kB separated (but loaded initially — see below) |
| Empty chunk cleanup | ✅ | `vendor-yjs` emits 0 kB (yjs removed) |

### 🔴 Issues Found

| Issue | Impact | File |
|-------|--------|------|
| **Main entry too large** (316 kB) | Every user downloads 89 kB gzip on first visit, impacting FCP/LCP | `App.tsx` |
| **vendor-radix in initial load** (146 kB) | All Radix UI primitives are loaded even on login/auth pages that don't use them | `vite.config.ts` manualChunks |
| **lucide-react icons in main chunk** | 24 icons statically imported contribute to main entry size | `App.tsx` lines 2-23 |
| **Zustand stores in main chunk** | 7 stores are always loaded, even when user is not authenticated | `App.tsx` lines 25-30 |

---

## 4. Optimization Opportunities

### 🔴 High Priority

#### 4.1 Code-split `vendor-radix` out of initial load

**Problem**: `vendor-radix` (146 kB / 46 kB gzip) is loaded on every page because `App.tsx` statically imports components that use Radix primitives.

**Solution**: Ensure the few Radix-using components in the header are loaded lazily or use dynamic imports:
- `TenantSelector` — can be lazy-loaded since it's only shown when authenticated
- `GlobalSearch` — already separate (0.21 kB), but its Radix deps land in main

**Estimated savings**: 46 kB gzip from initial load.

#### 4.2 Reduce `lucide-react` icon imports

**Problem**: 24 lucide-react icons are statically imported in `App.tsx` (lines 2-23).

**Solution**: Replace named icon imports with a single dynamic import or use `lucide-react`'s dynamic `createIcon()` pattern:
```typescript
// Before:
import { LayoutDashboard, Box, Eye } from 'lucide-react'

// After — dynamic icon component:
import { icons } from 'lucide-react'
const Icon = ({ name }: { name: keyof typeof icons }) => {
  const LucideIcon = icons[name]
  return <LucideIcon className="..." />
}
```

**Estimated savings**: 10-15 kB from main entry.

#### 4.3 Lazy-load auth pages

**Problem**: `LoginPage`, `RegisterPage`, `ForgotPasswordPage`, `ResetPasswordPage` are all statically imported.

**Solution**: These pages could be lazy-loaded since only one is shown at a time:
```typescript
const LoginPage = lazyImport(() => import('@/modules/auth/LoginPage'), 'LoginPage')
```

**Estimated savings**: 5-10 kB from main entry.

### 🟡 Medium Priority

#### 4.4 Reduce `DesignModule` size (304 kB)

The DesignModule includes canvas logic, node types, validation, AI chat, and code preview. Consider:

- Split the AI Chat panel into a separate lazy chunk
- Split the Code Preview panel into a separate lazy chunk
- Currently at 304 kB — the ReactFlow canvas itself is the primary size contributor

#### 4.5 Vendor chunk tuning

- `vendor-recharts` (391 kB) is large but correctly chunked. Monitor dashboard usage.
- If only basic charts are used, consider `recharts` tree-shaking or a lighter alternative for simple use cases.

#### 4.6 CSS bundle size (106 kB)

- 90 kB CSS is larger than expected for a Tailwind project
- Check for unused Tailwind classes with `purge` config
- Tailwind CSS v4 with Vite should auto-purge, but verify

### 🟢 Nice to Have

- Preload `<link rel="modulepreload">` for the most common navigation target (Dashboard or Design)
- Use `IntersectionObserver` for below-the-fold component lazy loading
- Add `fetchpriority="high"` on LCP candidate images

---

## 5. Recommendations Summary

| # | Action | Priority | Effort | Impact |
|---|--------|----------|--------|--------|
| 1 | Reduce main entry by code-splitting auth pages | 🔴 High | Low | 5-10% TTFB/FCP |
| 2 | Remove vendor-radix from initial load | 🔴 High | Medium | 15-20% initial JS |
| 3 | Optimize lucide-react icon imports | 🔴 High | Low | 3-5% initial JS |
| 4 | Split DesignModule sub-components | 🟡 Medium | Medium | 2-3% on Design load |
| 5 | Audit Tailwind CSS output | 🟡

| 5 | Audit Tailwind CSS output | 🟡 Medium | Low | 2-5% CSS size |
| 6 | Add module preload hints | 🟢 Low | Low | 1-2% nav time |

### Web Vitals Impact

| Metric | Current (estimated) | Target | Gap |
|--------|--------------------|--------|-----|
| **FCP** | ~1.2-1.8s | < 1.5s | 🟡 Near target |
| **LCP** | ~1.8-3.0s | < 2.5s | 🟡 Depends on Design module |
| **TBT** | ~100-250ms | < 200ms | 🟡 Near target |
| **TTFB** | ~300-800ms | < 600ms | 🟡 Backend dependent |
| **CLS** | ~0.05-0.15 | < 0.1 | 🟢 Generally stable |

### Target for 50 Concurrent Users

The current bundle is **adequate for 50 concurrent users** in a public beta. The main risk is **initial load time** for users on slow connections (3G). Focus optimizations on reducing the initial 135 kB gzip JS/CSS payload.

---

## 6. ManualChunks Configuration

Current config (`vite.config.ts` lines 25-46):

```typescript
manualChunks: {
  "vendor-reactflow": ["@xyflow/react"],
  "vendor-recharts": ["recharts"],
  "vendor-yjs": ["yjs", "y-websocket"],  // Empty - safe to remove
  "vendor-radix": [
    "@radix-ui/react-collapsible",
    "@radix-ui/react-context-menu",
    // ... 13 more @radix-ui packages
  ],
}
```

**Recommendation**: Remove `vendor-yjs` entry (already emits 0 kB). Keep the rest as-is.

---

## 7. Backend Performance Analysis

### 7.1 Caffeine Cache Configuration

**Current config** (`CacheConfig.java`):
- `maximumSize(10_000)` — 10k entries in cache
- `expireAfterWrite(5, TimeUnit.MINUTES)` — 5 min TTL
- `recordStats()` — metrics enabled

| Setting | Current | Recommendation for 50 users |
|---------|---------|---------------------------|
| Maximum size | 10,000 | ✅ Adequate (10k entries covers ~200 entries per user) |
| Expire after write | 5 min | ✅ Good for moderate load; reduce to 2 min for cost/observe data |
| Record stats | Enabled | ✅ Keep — enables cache hit/miss monitoring via `/actuator/metrics` |

**Recommendation**: Add cache names for selective per-cache tuning:
```java
@Bean
public CacheManager cacheManager() {
    CaffeineCacheManager manager = new CaffeineCacheManager();
    manager.setCaffeine(Caffeine.newBuilder()
            .maximumSize(10_000)
            .expireAfterWrite(5, TimeUnit.MINUTES)
            .recordStats());
    // Pre-declare cache names for custom TTLs
    manager.setCacheNames(Arrays.asList(
        "canvasCache",
        "costCache",
        "observeCache",
        "componentCache"
    ));
    return manager;
}
```

### 7.2 HikariCP Connection Pool

**Current config** (application-prod.yml):
- `maximum-pool-size: 20`
- `minimum-idle: 5`
- `connection-timeout: 5000`
- `max-lifetime: 1800000`

**Assessment**: For 50 concurrent users, 20 connections is **over-provisioned**. PostgreSQL handles ~100-200 simultaneous connections, but each connection consumes ~10 MB RAM and context-switching overhead.

| Setting | Current | Recommended (50 users) | Rationale |
|---------|---------|----------------------|-----------|
| max-pool-size | 20 | **10-12** | Formula: ((core_count * 2) + effective_spindle_count). With 50 users at ~5 queries per request, 10-12 is sufficient |
| min-idle | 5 | **2-3** | Lower idle saves memory during off-peak |
| connection-timeout | 5000 | ✅ Keep | 5s is reasonable |
| max-lifetime | 1800000 (30 min) | 1800000 (30 min) | ✅ Standard — keep below DB's `wait_timeout` |

**Reference**: [HikariCP Pool Sizing](https://github.com/brettwooldridge/HikariCP/wiki/About-Pool-Sizing) — Formula: `connections = ((core_count * 2) + effective_spindle_count)`. For a typical 4-core DB with SSD: 10-12 connections.

### 7.3 Thread Pool Configuration

**Current**: Spring Boot default (Tomcat max-threads = 200).

**Assessment**: The default of 200 worker threads is **sufficient** for 50 concurrent users. Each request from a user typically takes 100-500ms for API calls. With 50 concurrent users, peak concurrency is ~50 in-flight requests — well within 200 threads.

**Recommendation**: No changes needed. The default 200 threads handle the expected 50 concurrent users with ~4x headroom. If thread pool tuning is desired for production:
```yaml
server:
  tomcat:
    threads:
      max: 100   # Reduced from 200 — adequate for 50 users
      min-spare: 10
    accept-count: 50   # Queue size for pending connections
    max-connections: 200  # Max simultaneous connections
```

### 7.4 N+1 Query Detection

**Severity**: 🔴 **High Risk**

**Finding**: Zero `@EntityGraph` annotations across all JPA repositories. All entity relationships use `FetchType.LAZY` (correct), but there are no `JOIN FETCH` or `@EntityGraph` in query methods to eagerly fetch required associations.

**Affected repositories** (65 total — none with @EntityGraph):
- `CanvasRepository`, `CanvasNodeRepository`, `CanvasEdgeRepository`, `CanvasVersionRepository`
- `EnvironmentRepository`, `ManagedResourceRepository`
- All IAM, Cost, Observe, AIOps, Platform repositories

**Known pattern** — Design module entities:
- `CanvasNode`: `@ManyToOne(fetch = FetchType.LAZY)` to Canvas
- `CanvasEdge`: `@ManyToOne(fetch = FetchType.LAZY)` to Canvas
- `CanvasVersion`: `@ManyToOne(fetch = FetchType.LAZY)` to Canvas
- `DisasterRecoveryPlan`: Two `@ManyToOne(fetch = FetchType.LAZY)` fields

When a Canvas is loaded without JOIN FETCH, accessing its nodes or edges will trigger individual SELECT queries (classic N+1).

**Recommendation**:

1. **Critical**: Add `@EntityGraph` to CanvasRepository methods:
```java
public interface CanvasRepository extends JpaRepository<Canvas, String> {
    @EntityGraph(attributePaths = {"nodes"})
    Optional<Canvas> findWithNodesById(String id);

    @EntityGraph(attributePaths = {"nodes", "edges"})
    Optional<Canvas> findWithNodesAndEdgesById(String id);
}
```

2. **Critical**: Add `@Query` with JOIN FETCH for read-heavy operations:
```java
@Query("SELECT c FROM Canvas c LEFT JOIN FETCH c.nodes WHERE c.id = :id")
Optional<Canvas> findByIdWithNodes(@Param("id") String id);
```

3. **Monitor**: Enable Hibernate query logging in production with slow-query threshold:
```yaml
spring.jpa.properties.hibernate.session.events.log.LOG_QUERIES_SLOWER_THAN_MS: 200
```

### 7.5 Recommended @Cacheable Usage

Add caching to frequently accessed, rarely changed data:

| Endpoint | Cache Strategy | TTL | Priority |
|----------|---------------|-----|----------|
| `GET /api/v1/component-definitions` | @Cacheable("componentCache") | 10 min | 🔴 High |
| `GET /api/v1/canvases` | @Cacheable("canvasCache") | 2 min | 🟡 Medium |
| `GET /api/v1/cost/overview/{envId}` | @Cacheable("costCache") | 1 min | 🟡 Medium |
| `GET /api/v1/platform/catalog` | @Cacheable("catalogCache") | 15 min | 🟢 Low |

### 7.6 Conclusion for 50 Users

The backend is **production-ready for 50 concurrent users** with the current configuration. The two areas requiring immediate attention:

1. **🔴 N+1 queries**: Add `@EntityGraph` to prevent query explosion under load
2. **🟡 Connection pool**: Reduce from 20 to 10-12 to avoid over-provisioning

All other configurations (Caffeine cache, thread pool, JPA settings) are adequate for the expected load.
