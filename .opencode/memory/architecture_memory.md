# Architecture Memory

## ADRs Registrados
Ver docs/architecture/ para decisoes arquiteturais completas.

- ADR-008: Native Observability Subsystem (PostgreSQL-native)
- ADR-009: Auto-Documentation Module
- ADR-010: Backend Quality Gate (test coverage + UUID->String migration)
- ADR-011: What-if Cost + Preview Workflow Backend Persistence
- ADR-012: Q3 Operations Architecture
- ADR-013: LLM Provider Abstraction
- ADR-014: Catalog Version History
- ADR-015: Marketplace Browser Architecture
- ADR-016: GitOps Webhook Event-Driven
- ADR-017: Hybrid Auto-Remediation
- ADR-018: TOTP MFA + JWT Refresh Rotation
- ADR-019: Multi-Region Logical Replication
- ADR-020: Policy-as-Code OPA (Nao Implementado)
- ADR-021: Search Hexagonal Architecture (Proposto)
- ADR-022: API Versioning Strategy (Proposto)
- ADR-023: Circuit Breaker External Clients (Proposto)
- ADR-024: Analytics Aggregation Strategy (Implementado com bugs)
- ADR-025: SSO Authentication Flow (Implementado com bugs)
- ADR-026: Enterprise Identity SCIM Provisioning (Proposto)
- ADR-027: Performance Optimization Strategy (Proposto)
- ADR-028: Security Hardening & Secrets (Proposto)
- ADR-029: Compliance & Governance Framework (Proposto)
- ADR-030: Production Readiness & Stabilization (Proposto)
- ADR-031: Production Deployment Architecture (Proposto)
- ADR-032: Public Beta Feature Flags (Proposto)
- ADR-033: Go Engine DAG Pipeline Architecture (Proposto)

## Stack Decisions
| Decisao | Escolha | Razao |
|---------|---------|-------|
| Frontend | React 19 + Vite | Performance, ecossistema, HMR |
| Backend | Java 21 + Spring Boot 3.4.4 | Maturidade, Modulith, JVM |
| Engine | Go 1.22 | Performance IaC, CLI nativa |
| DB | PostgreSQL 16 | JSONB, performance, maduro |
| Cache | Caffeine (in-process) | Substituiu Redis, zero custo |
| Observability | Nativa PostgreSQL | Substituiu OTEL/Prometheus/Grafana |

## Architectural Principles
1. Modularidade: Spring Modulith com dominios isolados
2. Separacao de Concerns: Frontend -> Backend -> Engine
3. Validacao Multi-Camada: Frontend -> Backend -> Engine
4. Event-Driven: Comunicacao cross-module assincrona via Domain Events + ApplicationEventPublisher
5. Idempotencia: Operacoes de provisionamento idempotentes
6. Multi-Tenancy: Isolamento por tenantId + TenantFilter + @PreAuthorize
7. API First: /api/v1/ prefix, REST conventions

## Research References
- `docs/architecture/cloud-infrastructure-patterns-compare.md` — Análise competitiva de 7 plataformas (Datadog, Grafana, Dynatrace, New Relic, HCP Terraform, Pulumi, Crossplane). Base para ADRs futuros de pipeline DAG, provider plugin SDK, e auto-discovery.

## Known Gaps (2026-06-24)
- gRPC bridge nao implementado: Go engine tem servidor gRPC mas backend Java nao tem cliente
- Flyway migrations (V1-V12) usam id UUID, mas entidades JPA usam String -- V13 corrigiu para VARCHAR(36)
- ADR-020 OPA: Marcado Nao-Implementado mas container OPA ja existe no docker-compose.yml
- CodeGeneratorService gera templates in-memory sem chamar Go engine
- JWT nao propagado para Go engine (gRPC nao implementado)
- ADR-022/023/026/027/028/029: Propostos mas nao implementados
- 6 pre-existing test failures nao corrigidos
- Backend Maven compile nao verificado (sem mvn neste ambiente)
- **(RESOLVIDO)** 5 ADR bugs (H1, C9, M2, M6, M7) — verificados como já resolvidos no código Phase 6B-9 em 2026-06-24

## ADRs 031-033 (2026-06-23/24)
- ADR-031: Production Deployment -- EC2 + RDS + S3/CloudFront + Elastic Beanstalk (Proposto)
- ADR-032: Feature Flags -- JPA FeatureFlag entity + uiStore.isEnabled() (Proposto)
- ADR-033: Go Engine DAG Pipeline Architecture -- 8-stage component pipeline, inspirado em Grafana Alloy + Crossplane Functions (Proposto)

## Cross-Cutting Modules (2026-06-24, Phase 6B-9 FAANg)
- **shared/api**: ApiVersion enum + interceptor + resolver + advice (header-based versioning)
- **shared/monitoring**: MetricsConfig + ControllerMicrometerAspect + MdcFilter + CustomHealthIndicator
- **shared/security**: JwksVerifier (JWKS signature), SecretEncryptionConverter (AES-256)
- **shared/web**: WebConfig (CORS)
- **Flyway V9-V13**: 5 migrations covering observability, analytics, docs, brin indexes, credentials/env/approvals/deployments
- **infra/**: Prometheus alerts (alerts.yml), Grafana golden signals (cloudbuilder-golden-signals.json), k6 load tests
- **opa/**: 4 Rego policies (cost, custom, governance, security)
- **11 Playwright E2E specs**: covering all modules across frontend
