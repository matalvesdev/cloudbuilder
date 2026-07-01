# ADR-036: Comprehensive Test Pyramid

**Status:** Accepted
**Date:** 2026-06-28
**Decision Makers:** Sisyphus (AI Agent), FAANg QA Engineer
**Relates to:** ADR-008 (Observability), ADR-035 (Production EDA)

## Context

CloudBuilder has grown to 27 backend services, 17 controllers, 15+ frontend modules, and a Go provision engine. Current test coverage is fragmented:

- **Backend**: 65 JUnit test files (~530 tests), all pure Mockito unit tests
- **Frontend**: 5 Vitest unit test files (~60 tests) + 12 Playwright E2E specs
- **Go**: 9 test files (~29 tests)
- **Missing entirely**: Property-based testing, mutation testing, BDD, load/stress, chaos, penetration, Snyk, integration, benchmarks, visual regression

The Lemon.dev 2026 test automation article identifies critical gaps in modern test pyramids, particularly the prevalence of **tautological tests** (tests that mirror implementation details rather than behavior) and the lack of resilience/security testing.

## Decision

Implement a comprehensive 12-layer test pyramid following the FAANg Harness Engineering Pipeline, grounded in the Lemon.dev methodology:

### Anti-Tautology Principles (from Article)

1. **Tests must verify BEHAVIOR, not implementation** — no asserting internal state machines or specific call sequences
2. **Property-based > example-based** for domain logic — use `fast-check` to generate 100+ random inputs
3. **Mutation testing validates test quality** — Stryker with ≥80% mutation score threshold
4. **Contract testing for API boundaries** — verify frontend/backend API shape compatibility
5. **Chaos engineering proves resilience** — kill dependencies, inject latency, verify graceful degradation

### 12-Layer Test Pyramid

| Layer | Tool | Scope | Target |
|-------|------|-------|--------|
| 1. Unit (Backend) | JUnit 5 + Mockito | Service/Controller logic | 100% services |
| 2. Unit (Frontend) | Vitest | Stores, utils, hooks | 100% stores + utils |
| 3. Unit (Go) | go test | Package-level logic | All packages |
| 4. Property-Based | Vitest + fast-check | Domain invariants | Cost calc, flag resolution, canvas state |
| 5. Mutation Testing | Stryker | Test quality gate | Frontend TS/TSX |
| 6. BDD | Vitest + Gherkin-style | User journeys | Critical flows (design→deploy) |
| 7. Integration | Testcontainers + @EmbeddedKafka | Backend modules + DB + Kafka | All module boundaries |
| 8. E2E | Playwright | Full user flows | All modules |
| 9. Load/Stress | k6 | API performance baselines | All REST endpoints |
| 10. Chaos | Docker + shell scripts | Dependency failure | Kafka, DB, OPA failures |
| 11. Security | OWASP ZAP + npm audit | Vulnerability scanning | All dependencies + endpoints |
| 12. Visual Regression | Playwright screenshots | UI consistency | All module pages |

### Quality Gates

| Gate | Threshold | Enforced |
|------|-----------|----------|
| Unit test coverage (Backend) | ≥70% line | CI (JaCoCo) |
| Unit test coverage (Frontend) | ≥70% line | CI (Vitest) |
| Mutation score (Frontend) | ≥80% | CI (Stryker) |
| Property test passes | 1000 iterations | CI (fast-check) |
| E2E pass rate | 100% | CI (Playwright) |
| k6 p95 latency | <500ms | CI (k6) |
| Critical path coverage | 100% | Manual gate |
| Zero critical vulns | 0 | CI (ZAP + audit) |

### Key Files Created

```
frontend/
├── src/test/
│   ├── setup.ts                          (existing — enhanced)
│   ├── arbitraries.ts                    NEW — fast-check domain generators
│   └── mockFetch.ts                      (existing)
├── src/**/*.property.test.ts             NEW — property-based tests
├── src/**/*.spec.ts                      NEW — BDD-style behavior specs
├── stryker.conf.json                     NEW — mutation testing config
├── benchmarks/
│   ├── canvasStore.bench.ts              NEW — store performance
│   └── utils.bench.ts                    NEW — utility functions

tests/
├── load/
│   ├── smoke.js                          NEW — k6 smoke test
│   ├── load.js                           NEW — k6 load test
│   ├── stress.js                         NEW — k6 stress test
│   └── thresholds.js                     NEW — shared thresholds
├── chaos/
│   ├── kafka-kill.sh                     NEW — kill Kafka container
│   ├── db-latency.sh                     NEW — inject DB latency
│   ├── opa-kill.sh                       NEW — kill OPA container
│   └── chaos-run.sh                      NEW — orchestrated chaos
├── security/
│   ├── zap-baseline.yaml                 NEW — ZAP scan config
│   └── snyk-policy                       NEW — Snyk ignore rules
├── visual/
│   ├── screenshots.spec.ts               NEW — Playwright visual regression
│   └── __snapshots__/                    NEW — baseline screenshots

.github/workflows/
├── test-pyramid.yml                      NEW — comprehensive test CI
```

## Consequences

### Positive
- **Test quality validated** by mutation testing (not just coverage numbers)
- **Domain correctness proven** via property-based testing (1000+ random inputs)
- **Resilience verified** via chaos experiments (not just happy-path E2E)
- **Security baseline** established with automated scanning
- **Performance regression prevention** with k6 baselines
- **No tautological tests** — every test verifies observable behavior

### Negative
- **CI pipeline longer** (~15min → ~25min with full pyramid)
- **Maintenance overhead** — 12 layers need ongoing attention
- **Learning curve** — team needs fast-check, Stryker, k6 knowledge
- **Chaos tests flaky in CI** — run only on main branch

### Mitigations
- Parallelize test layers in CI (reduce wall-clock impact)
- Chaos tests: scheduled runs (nightly), not PR-gated
- Document all test patterns in `docs/testing/README.md`
- FAANg QA Agent maintains test infrastructure
