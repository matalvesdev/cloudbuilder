# Architecture Memory

## ADRs Registrados
Ver `docs/architecture/` para decisões arquiteturais completas.

- ADR-008: Native Observability Subsystem (PostgreSQL-native)
- ADR-009: Auto-Documentation Module
- ADR-010: Backend Quality Gate (test coverage + UUID→String migration)
- ADR-011: What-if Cost + Preview Workflow Backend Persistence

## Stack Decisions
| Decisão | Escolha | Razão |
|---------|---------|-------|
| Frontend | React 19 + Vite | Performance, ecossistema, HMR |
| Backend | Java 21 + Spring Boot 3.4.4 | Maturidade, Modulith, JVM |
| Engine | Go 1.22 | Performance IaC, CLI nativa |
| DB | PostgreSQL 16 | JSONB, performance,成熟 |
| Cache | Redis 7 | Simplicidade, performance |
| Streaming | Kafka 7.9 | Event sourcing, modulith events |
| Observability | OpenTelemetry → Prometheus → Grafana | Padrão CNCF, vendor-agnostic |

## Architectural Principles
1. **Modularidade**: Spring Modulith com domínios isolados, comunicação via eventos
2. **Separação de Concerns**: Frontend (design visual) → Backend (API/regras) → Engine (provisionamento)
3. **Validação Multi-Camada**: Frontend (visual) → Backend (regras negócio) → Engine (HCL syntax)
4. **Event-Driven**: Comunicação cross-module assíncrona via Spring Modulith events + Kafka
5. **Idempotência**: Operações de provisionamento idempotentes
6. **Multi-Tenancy**: Isolamento por tenantId + TenantFilter + @PreAuthorize
7. **API First**: OpenAPI spec, versionamento /api/v1/

## Known Gaps
- ~~nanoid (frontend) vs UUID (backend)~~ ✅ Resolved — both sides use String (crypto.randomUUID()) with Phase 5d migration
- ~~Grafana/Prometheus — removed ($0 infra)~~ ✅ Replaced by native observability (ADR-008)
- XYPosition (objeto) vs positionX/positionY (flat doubles) — mismatch de modelo entre frontend e backend
- card.tsx em provision/ deveria estar em components/ui/
- What-if Cost + Preview Workflow: sem testes JUnit para novos services (CostScenarioService, DeployPlanService)
- Observability schema sem migrations Flyway (schema.sql manual)
- Containers sem resource limits → ✅ Resolvido (configurados no docker-compose.yml)

## Q3 2026 Operations Architecture
- **ADR-012**: Q3 Operations Architecture — 3 sprints (Observabilidade, Cost Management, Audit & Compliance)
- **Partitioning**: PostgreSQL native RANGE partitioning (monthly) for time-series tables
- **Anomaly Detection**: Custom composite (trend-adjusted baseline + Z-score)
- **Compliance**: Strategy pattern (4 initial strategies, extensible)
- **Cross-module**: Modulith ApplicationEventPublisher for budget→observe alerts
- **Projection**: Linear regression on 90-day cost data
- **Audit Query**: Spring Data JPA Specifications for dynamic filtering
- **File count**: ~54 new Java files, 4 new frontend components
