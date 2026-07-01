# Research Memory

## Pesquisas Realizadas

### 2026-06-15 — FAANg Framework
**Tópico**: Metodologia de agentes autônomos de engenharia
**Fontes**: FAANg specification (prompt engineering), engenharia de plataforma, SotA agent architectures
**Conclusão**: Framework híbrido combinando hierarchical planning (Harness Engineering), context compression (Headroom Engine), persistent memory, e multi-agent orquestração. Cada especialista FAANg opera de forma autônoma dentro de seu domínio, seguindo o pipeline: Research → Planning → Architecture → Implementation → Review → Testing → Security → Performance → Deployment → Evaluation → Memory.

### 2026-06-14 — Rate Limiting Patterns
**Tópico**: Implementação de rate limiting em Spring Boot sem dependências externas
**Fontes**: Spring Security docs, IETF RFC 6585 (HTTP 429), sliding window algorithm
**Conclusão**: ConcurrentHashMap + sliding window (timestamps + count) é suficiente para dev. Bucket4j para prod multi-instância com Redis.

### 2026-06-14 — Password Reset Flow Security
**Tópico**: Fluxo seguro de reset de senha
**Fontes**: OWASP Forgot Password Cheat Sheet, Spring Security docs
**Conclusão**: Token 64 hex, expiry 1h, used flag, BCrypt hashing, sem revelar se email existe

### 2026-06-24 — DevOps Best Practices (Multi-Platform Research)
**Tópico**: CI/CD patterns, deployment tracking, policy-as-code, progressive delivery, GitOps
**Fontes**: Datadog docs, Grafana/k6 docs, Dynatrace docs, New Relic docs, Terraform Cloud docs, GitHub Actions docs, ArgoCD docs, Jenkins X docs, Harness docs
**Conclusão**:
- **Run Workflow State Machine** (TFC-inspired): Plan → Policy Check → Approve → Apply → Verify → Drift Detection
- **Policy-as-Code Dual Engine**: OPA/Rego (primary, CNCF) + Sentinel (optional, HashiCorp) with graduated enforcement (Advisory → Soft → Hard)
- **Deployment Tracking API**: Version-tagged events with type (BASIC/CANARY/BLUE_GREEN/ROLLING/SHADOW), commit SHA, deep links
- **Drift Detection Enhancement**: Scheduled scans, severity levels, auto-remediation option, history trends
- **Progressive Delivery**: Canary with weight steps + metric-based auto-rollback (Argo Rollouts-inspired)
- **CI/CD Provider Abstraction**: Interface-based integration layer (GitHub Actions first, GitLab/Jenkins/ArgoCD future)
- **DORA Metrics**: Deployment frequency, lead time, change failure rate, MTTR as first-class metrics
- **Preview Environments**: Ephemeral K8s per PR (Jenkins X-inspired) with TTL lifecycle

**Output**: `docs/architecture/devops-best-practices-research.md` (390 lines, 13 sections, 7 ADRs proposed)

### 2026-06-24 — Cloud Infrastructure Patterns Competitive Analysis
**Tópico**: Arquitetura de agentes de monitoramento (Datadog, Grafana/Alloy, Dynatrace, New Relic) e plataformas IaC (HCP Terraform, Pulumi Cloud, Crossplane)
**Fontes**: Documentação oficial dos 7 produtos, GitHub repos, engineering blogs
**Conclusão**: 4 padrões arquiteturais dominantes emergem — (1) Component DAG pipeline para coleta/provisionamento, (2) eBPF para visibilidade sistêmica de baixo overhead, (3) Controller reconciliation loop para drift contínuo, (4) OTel como padrão de telemetria cross-vendor. CloudBuilder deve priorizar pipeline programável (DAG) no Go engine, state reconciliation loop, e provider plugin SDK como próximas capacidades.
**Documento**: `docs/architecture/cloud-infrastructure-patterns-compare.md`

## Tópicos Pendentes de Pesquisa
- Kafka multi-node com TLS para prod
- Redis Sentinel/Cluster para rate limiting distribuído
- Flyway migrations vs Hibernate ddl-auto em produção
- OpenTelemetry sampling strategies para alta throughput
- gRPC bridge entre Java backend e Go engine


### 2026-06-24 -- Cross-Cutting Tech Stack Analysis (6 Competitors)
**Topic**: Comprehensive technology architecture research on Datadog, Grafana Labs, Dynatrace, New Relic, Miro, and Excalidraw
**Scope**: Tech stacks, storage architectures (Mimir/Loki/Tempo, Husky/RTDB, NRDB, Grail), integration patterns (webhooks/plugins/Terraform), licensing models (open-core vs proprietary), operational costs, known outages (Datadog March 2023), migration stories (New Relic cell architecture)
**Output**: docs/research/cross-cutting-tech-stack-analysis.md (370 lines, 6 parts)
**Key findings**:
1. ALL observability platforms use object storage (S3) + Kafka as ingestion buffer
2. Rust is winning for performance-critical paths (Datadog RTDB rewrite: 60x ingest, 5x query)
3. Cell-based architecture is the new standard (New Relic cells, Datadog shuffle sharding)
4. Grafana open-core works at 00M+ ARR -- 90% of users never pay
5. Mimir 3.0 decoupled read/write with Kafka + WarpStream on S3
6. Excalidraw proves you don't need CRDT library: simple relay + E2E encryption works
7. Miro uses custom stateful server architecture (Java + Hazelcast) -- NOT Yjs
8. Dynatrace Grail uses patented Datawarping indexless technology
9. Datadog March 2023: all regions shared OS image -> systemd patch took down 50-60%
10. CloudBuilder validated: React 19 + Go engine + Modulith confirmed by competitors

### 2026-06-24 -- Comprehensive Competitor Market Analysis (6 Products)
**Topic**: Competitive analysis of Grafana, Dynatrace, New Relic, Datadog, Miro, and Excalidraw -- 10+ features each, ranked top 30 by implementation priority for CloudBuilder roadmap
**Sources**: Official documentation (grafana.com/docs, docs.dynatrace.com, docs.newrelic.com, docs.datadoghq.com, miro.com/docs, excalidraw.com/docs), pricing pages, engineering blogs, GitHub repos, and third-party pricing analysis (CloudZero, Vendr, CostBench, OpsLyft)
**Output**: docs/research/competitor-market-analysis-comprehensive.md (436 lines, 28,813 chars)
**Key Findings by Competitor**:
1. **Grafana**: Ambassador pattern, living dashboards, 9-microservice stack, 2FA pricing gap, Grafana Alloy single binary OTel → CloudBuilder Agent concept
2. **Dynatrace**: DAVIS causal AI (3rd gen), PurePath tracing, Smartscape topology, Grail lakehouse, OneAgent philosophy → AI must determine causality, not just correlation
3. **New Relic**: Entity-centric data model, NRQL cross-platform query language, Scorecards, CCU compute-based pricing → CBQL and unified entity model for CloudBuilder
4. **Datadog**: Unified agent, cross-product signal correlation, unified service tagging, host map hexbin, cloud cost management → pivot any signal to any context
5. **Miro**: Visual context processing, Sidekicks (AI agents), Flows (AI workflows), MCP integration, template ecosystem → canvas semantically understands resources
6. **Excalidraw**: Local-first + offline PWA, embeddable npm component, two-canvas rendering, E2E encryption, open-source core + SaaS monetization
**Top 3 Immediate Actions**:
- Refactor Canvas to semantic-aware rendering (resource containment understanding)
- Define entity schema for ALL resource types (unified data model)
- Design CBQL (CloudBuilder Query Language) for cross-platform queries

### 2026-06-24 — Competitive Architecture Analysis (6 Platforms)
**Tópico**: System design patterns from Grafana Stack, Datadog, Dynatrace, New Relic, Miro, Excalidraw
**Fontes**: Grafana Mimir/Tempo docs (grafana.com), Datadog Engineering Blog (datadoghq.com/blog), Dynatrace Grail/Davis AI docs, New Relic NRDB/Iceberg blog, Miro Engineering Blog (CRDT vs OT), Excalidraw GitHub + collaboration server docs
**Conclusão**:
- **Convergência universal**: All 4 observability platforms use Kafka + object storage + read/write path separation
- **Top 3 recomendações**: Kafka between write/read paths (Q3 2026), CRDT-based canvas collaboration via Yjs + WebSocket + Redis Pub/Sub (Q3 2026), exhaustive indexing for cost/deployment records (Q3 2026)
- **Miro validated CRDT over OT**: No central server needed, automatic merge, offline support, simpler semantics
- **Excalidraw pattern**: Volatile (cursor/selection) vs guaranteed (node/edge) message channels
- **New Relic cellular**: 10 cells, 90-day lifespan, 50ms median query — target for CloudBuilder Phase 2
- **Datadog Husky**: Kafka for ordering/durability only — short retention (24h), S3 for long-term storage
- **Documento**: `docs/competitive-analysis/competitor-architecture-analysis.md` (358 lines, 13 sections)

### 2026-06-25 — Customer Research: Competitor Sentiment & Platform Engineering Pain Points
**Tópico**: Análise de sentimentos de usuários reais sobre 6 competidores (Grafana, Datadog, Dynatrace, New Relic, Miro, Excalidraw) + dores latentes de platform engineering em 2026
**Fontes**: Reddit (r/devops, r/grafana, r/datadog, r/projectmanagement, r/excalidraw, r/aws), G2 reviews, TrustRadius, Hacker News discussions, Gartner Hype Cycle for Platform Engineering 2025
**Conclusão**:
1. **Bill shock é a maior dor do mercado observabilidade**: Datadog pricing é citado em ~50% das reviews negativas no G2. Dynatrace DDU model chamado de "spreadsheet from hell". New Relic fez 3+ migrações de pricing (por host → por data → CCU) gerando desconfiança. CloudBuilder deve posicionar custo previsível como vantagem #1 contra os 3 grandes.
2. **Diagram drift é epidêmico e não resolvido**: DEV.to posts, Riftmap analysis, Reddit r/aws — múltiplas fontes independentes confirmam que diagramas de infraestrutura divergem da realidade em dias ou semanas. Nenhum competidor resolve isso. CloudBuilder resolve por design (canvas gera código real, não o contrário).
3. **AI agents estão em pico de hype, não de valor**: Grafana Assistant, Datadog Bits AI, Dynatrace Davis AI, New Relic Agentic Platform — todos prometem AI, mas nenhum resolve o problema fundamental de diagram drift. Gartner coloca AI agents no "Peak of Inflated Expectations". CloudBuilder deve evitar AI washing e focar em AI que realmente resolve um problema.
4. **OSS vende confiança, não features**: HN discussions mostram migrações em massa de New Relic → Grafana por questões de trust, não de features. Grafana é "good enough" para 90% dos usuários. CloudBuilder open-core pode seguir mesmo caminho com narrative de transparência.
5. **Miro cresce via SEO de templates**: 2.77% das páginas de template geram 29% do tráfego orgânico. CloudBuilder deve replicar estratégia com "infrastructure diagram templates" e "Terraform architecture blueprints" como conteúdo perene.
6. **Platform engineers em 2026 buscam "show me the code"**: Posts de alto engajamento em r/devops e HN mostram que o mercado está cansado de promises e quer soluções que gerem código real. CloudBuilder's visual→Terraform é o único produto que entrega isso.
**Output**: Findings incorporados diretamente na content strategy (`docs/marketing/content-strategy-2026.md`), perfis individuais em `competitor-profiles/`, e cross-competitor summary em `competitor-profiles/_summary.md`

### 2026-06-25 — Content Strategy for CloudBuilder
**Tópico**: Estratégia de conteúdo completa para CloudBuilder baseada em competitor profiling e customer research
**Fontes**: 6 competitor profiles, 5 customer research searches, SEO data, G2/TrustRadius/Reddit/HN sentiment analysis, Miro template-driven SEO case study
**Conclusão**:
- **5 Content Pillars definidos**: Platform Engineering na Prática, Diagrama Vivo, Observabilidade sem Susto, AI Agents com Pé no Chão, OSS que Gera Receita
- **15 content ideas priorizadas** por scoring impact x effort — top 3: video essay "Diagrama Vivo vs Documentação Morta" (98pts), comparison calculator "Observabilidade que não quebra o banco" (85pts), technical tutorial "Platform Engineering na Prática: do diagrama ao deploy" (82pts)
- **Calendário editorial de 3 meses** com milestones de tráfego e conversão
- **Topic cluster map** com 5 clusters interligados para SEO de longo prazo
- **Modelo Miro validado**: template-driven SEO é a estratégia de growth mais comprovada no mercado de plataformas visuais
- **Distribuição multicanal**: DEV.to (cross-post), Medium (SEO), LinkedIn (CTO audience), YouTube (video essay pillar), Reddit r/devops (community engagement)
- **Pipeline de conversão**: 3 estágios (Top of Funnel → Middle → Bottom) com CTAs específicos por persona
**Documento**: `docs/marketing/content-strategy-2026.md` (366 linhas, 8 seções)
