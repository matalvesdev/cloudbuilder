# ADR Business Value Assessment — CloudBuilder

**Date**: 2026-06-21  
**Author**: FAANg Product Manager Agent  
**Methodology**: Read-only inspection of all 18 ADR documents (008–025) + 12-month roadmap

---

## Executive Summary

| Priority | Item | Type | Effort | Business Value | Roadmap Phase |
|----------|------|------|--------|----------------|---------------|
| 🔴 P0 | **ADR-008 GAP-006** — Fix IncidentEntity table name | Bug | 5 min | Critical (runtime error) | Q3 Ops |
| 🔴 P0 | **ADR-008 GAP-001** — CustomMetrics PostgreSQL dual-write | Gap | 30 min | High (domain metrics missing) | Q3 Ops |
| 🔴 P0 | **ADR-023** — Circuit Breaker (Resilience4j) | New | Medium | High (prevents cascade failure) | Q4 Intel |
| 🟠 P1 | **ADR-008 GAP-003** — Fix traceId truncation (16→32 char) | Bug | 5 min | Medium (collision risk) | Q3 Ops |
| 🟠 P1 | **ADR-024** — Analytics Aggregation (rollups + cache) | New | Medium | Medium-High (dashboard perf at scale) | Q3 Ops |
| 🟠 P1 | **ADR-025** — SSO Auth Flow (OAuth2 + PKCE) | New | Medium | High (enterprise gate) | Q1 Scale |
| 🟡 P2 | **ADR-022** — API Versioning Strategy | New | Medium | Medium (future-proofing) | Q1 Scale |
| 🟡 P2 | **ADR-008 GAP-004/005** — Missing endpoints | Gap | 1.5h | Medium (completeness) | Q3 Ops |
| ⚪ P3 | ADR status corrections (016/018/019/020) | Admin | 10 min | Low | - |

## ADR-008 Native Observability — 5 Gaps

| Gap | Severity | Impact | Effort |
|-----|----------|--------|--------|
| GAP-006 — @Table mismatch | 🔴 Critical | Runtime crash on first incident | 5 min |
| GAP-001 — No PostgreSQL dual-write | 🔴 High | Domain metrics lost | 30 min |
| GAP-003 — traceId truncated | 🟠 Medium | Collision risk | 5 min |
| GAP-004 — No NotificationChannel API | 🟡 Medium | SQL-only management | 1h |
| GAP-005 — Missing evaluations endpoint | 🟡 Low | Reduced debug visibility | 30 min |

**Recommendation**: Fix GAP-006 immediately (prevents runtime crash). GAP-001 and GAP-003 in same session.

## ADR-022 API Versioning — Business Case

- **Roadmap**: Q1 2027 (Scale)
- **Value**: Third-party API consumers need version contracts
- **Risk now**: None (only frontend consumes APIs)
- **Risk at marketplace launch**: Medium
- **Effort**: ~1.5 hours
- **Recommendation**: Implement 1 sprint before marketplace goes public

## ADR-023 Circuit Breaker — Business Case

- **Roadmap**: Q4 2026 (Intelligence)
- **Value**: Prevents cascade failure from LLM/GitHub/OPA outages
- **Risk without**: Thread pool exhaustion → system-wide crash
- **Effort**: ~3.5 hours
- **Recommendation**: **P0** — implement before AI Assistant (Sprint 15) goes to production

## ADR-024 Analytics Aggregation — Business Case

- **Roadmap**: Q3 2026 (Operations)
- **Value**: Dashboard queries stay sub-second at scale
- **Risk without**: At 500 users, queries take 2-3s; at 2000 users, 10-15s+
- **Effort**: ~2.5 hours
- **Recommendation**: Implement pre-500 user milestone (Sprint 9-10)

## ADR-025 SSO Auth Flow — Business Case

- **Roadmap**: Q1 2027 (Enterprise)
- **Value**: Enterprise sales gate ($50K+ contracts require SSO)
- **Risk without**: Blocks enterprise procurement
- **Effort**: ~4 hours
- **Recommendation**: Implement per customer demand; Q1 2027 default

## Complete ADR Portfolio Heatmap

| ADR | Value | Effort | Risk | Window | Action |
|-----|-------|--------|------|--------|--------|
| 008 gaps | 🔴 Critical | Small | Runtime crash | Q3 Ops | Fix NOW |
| 009 | ✅ Done | - | - | Q3 | Verified |
| 010 | ✅ Done | - | - | Q2 | Verified |
| 011 | ✅ Done | - | - | Q3 | Verified |
| 012 | 📄 Doc only | - | - | Q3 | Reference |
| 013-015 | ✅ Done | - | - | Q4 | Verified |
| 016 | 🟡 Medium | Small | No GitOps | Q4 | Status fix |
| 017 | ✅ Done | - | - | Q4 | Verified |
| 018 | 🟡 Medium | Small | MFA limited | Q4 | Status fix |
| 019 | 🟠 Medium | Medium | No failover | Q1 | Q1 2027 |
| 020 | 🟡 Medium | Medium | Policy as Code | Q1 | Proposed |
| 021 | ⚪ Low | Small | Architecture | Q4 | Low urgency |
| 022 | 🟡 Medium | Small | API risk | Q1 | Pre-marketplace |
| 023 | 🔴 **High** | Medium | **Cascade failure** | Q4 | **P0 now** |
| 024 | 🟠 Medium | Medium | Dashboard perf | Q3 | Pre-500 users |
| 025 | 🟠 High | Medium | Enterprise gate | Q1 | Per demand |

## Prioritized Action Plan

### Sprint 8 Cleanup
1. 🔴 GAP-006: Fix @Table name (5 min)
2. 🔴 GAP-001: CustomMetrics dual-write (30 min)
3. 🟡 GAP-003: Fix traceId truncation (5 min)
4. ✅ ADR status corrections (10 min)
5. 🟡 GAP-004/005: Missing endpoints (1.5h)

### Sprint 9 (Observabilidade)
6. 🟠 ADR-024: Analytics rollup (2.5h)
7. 🟡 BRIN indexes + partition maintenance (45 min)

### Sprint 15 (AI Assistant)
8. 🔴 **ADR-023: Circuit Breaker (3.5h)**

### Sprint 24-25 (Enterprise)
9. 🟠 ADR-025: SSO Auth (4h)
10. 🟠 ADR-019: ReplicationService (3h)

### Q1 2027 (Pre-Scale)
11. 🟡 ADR-022: API Versioning (1.5h)
12. 🟡 ADR-020: OPA Policy as Code (3h)
