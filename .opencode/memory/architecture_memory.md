# Architecture Memory

## ADRs Registrados
Ver `docs/architecture/` para decisões arquiteturais completas.

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
- card.tsx em provision/ deveria estar em components/ui/
- nanoid (frontend) vs UUID (backend) — mismatch de tipos de ID
- XYPosition (objeto) vs positionX/positionY (flat doubles) — mismatch de modelo
- Grafana/Prometheus sem dashboards pré-configurados
- Kafka single-node sem TLS
- Redis sem autenticação
- Containers sem resource limits
