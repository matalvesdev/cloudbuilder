# Decision Memory

## Historico de Decisoes

### 2026-06-23 -- ADR-031: Production Deployment Architecture
Decisao: Single-region AWS deployment via Elastic Beanstalk + RDS PostgreSQL + S3/CloudFront + SSM Parameter Store.
Razao: Simplicidade operacional (managed EC2), baixo custo (~0/mes), caminho de migracao para K8s em Q1 2027.
Alternativas: K8s/EKS (muito caro para MVP), Lambda (cold starts incompativeis com Terraform), Fargate (mais caro).
Impacto: gRPC bridge entre Java e Go engine permanece como gap conhecido. Code generation roda in-process no Java.

### 2026-06-23 -- ADR-032: Public Beta Feature Flags (Decisão)
Decisao: Feature flags via JPA entity + uiStore.isEnabled() instead of LaunchDarkly or config files.
Razao: Zero novas dependencias externas; per-tenant targeting via tenant_id column; integrado com RBAC existente (AND logico).
Alternativas: LaunchDarkly (00+/mes), application.yml (sem per-tenant), Unleash (container extra).
Impacto: Nova entidade FeatureFlag, V14 migration, admin UI page, modificacao em uiStore e App.tsx.

### 2026-06-28 -- ADR-032: Feature Flags Implementation
**Decisão**: Implementar 7 arquivos backend (hexagonal) + 4 arquivos frontend para ADR-032, com resolução tenant > global > default via Caffeine @Cacheable, V15 migration com 8 seed flags para beta profile, admin UI FeatureFlagsPage com toggle + inline config, e gating no nav via isEnabled() com fallback module-aware.
**Razão**: ARD-032 especificava arquitetura mas não detalhava (1) estratégia de cache (Caffeine 30s TTL via @Cacheable), (2) fallback para módulos sem flag explícita (module.iam=false, demais módulos conhecidos=true), (3) nomenclatura de flags (module.*, feature.*, config.*), (4) admin UI com grouping/search/toggle/configJson.
**Alternativas**: Flag toggling via application.yml restart (sem per-tenant, sem UI), LaunchDarkly eval (custo $), env vars em runtime (sem versionamento).
**Impacto**: V15 migration criada (V14 já ocupada por event_outbox). FeatureFlag entity com string IDs. FeatureFlagsPage registrado em App.tsx sob navGroups Governança/Flags. fetchFlags() chamado após autenticação. isEnabled() integrado na filtragem de nav items (AND com RBAC). TypeScript 0 erros.

### 2026-06-24 -- ADR Bug Cleanup (H1, C9, M2, M6, M7)
Decisao: All 5 ADR audit findings verified as already resolved in Phase 6B-9 pipeline merge code. Production Readiness Review updated to 🟢 GREEN.
Razao: H1 (JwksVerifier) already wired into SsoAuthService.decodeIdToken(). C9 (refresh endpoint) already exists at POST /oauth2/refresh. M2 (encryption key) uses PBKDF2+env var, only dev fallback hardcoded with warning. M6 (ADR-012 Kafka refs) already clean — document says "removed in Phase 4". M7 (ADR-029 ComplianceService) is a Proposed future ADR, not a code documentation issue.
Alternativas: Would have implemented Spring Cloud Vault for M2, but overkill for current stage — env var + PBKDF2 is production-ready.
Impacto: application.yml updated with encryption-key property for discoverability. PRR upgraded to GREEN. Zero code changes needed — all fixes existed in Phase 6B-9 merged code.

### 2026-06-24 — ADR-033: Go Engine DAG Pipeline Architecture
**Decisão**: Adotar arquitetura DAG pipeline no Go engine, substituindo o gerador monolítico `Generator.Generate()` por 8 componentes conectados em grafo acíclico direcionado: InputAdapter → ValidatePipeline → MapProvider → ResolveDeps → TemplateRenderer → PostProcess → Formatter → OutputAdapter.
**Razão**: Pesquisa competitiva (Datadog, Grafana Alloy, Dynatrace, New Relic, Crossplane) mostra que arquitetura de pipeline com componentes reutilizáveis é padrão da indústria para ferramentas de infraestrutura multi-cloud. Permite suporte a múltiplos formatos de saída (Terraform, Pulumi, Crossplane, CDKTF), validação precoce, e plugin SDK para providers comunitários.
**Alternativas**: Refatoração incremental (não resolve acoplamento), hashicorp/go-plugin (overhead IPC desnecessário), OTel Collector distribution (mismatch de domínio).
**Impacto**: 10 fases de migração (~14 sprints), wrapper de compatibilidade para templates existentes, nenhuma mudança na API gRPC.

### 2026-06-24 — Cloud Infrastructure Patterns Research (Base para ADR-033 e roadmap)
**Decisão**: Documentar análise competitiva de 7 plataformas como base para decisões arquiteturais futuras. Priorizar pipeline DAG como capacidade #1 do roadmap Q3 2026.
**Razão**: Nenhum dos 4 agentes de monitoramento ou 3 plataformas IaC analisados fornece uma combinação de (a) geração de código a partir de design visual + (b) suporte multi-cloud + (c) drift detection contínuo. CloudBuilder tem oportunidade de ser a primeira plataforma a unificar esses 3 aspectos em um pipeline único.
**Alternativas**: Adotar Crossplane como backend (perderia controle sobre geração de código), adotar Pulumi Automation API (dependência externa).
**Impacto**: ADR-033 criado, roadmap de 4 fases documentado, Research References adicionado ao architecture_memory.md.

### 2026-06-24 — Drift Detection DTO Architecture
**Decisão**: Criar `DriftReportResponseDTO` e `DriftItemDTO` no backend para transformar o campo JSON string `driftDetails` em objetos tipados antes de retornar ao frontend, em vez de fazer o parsing no cliente.
**Razão**: O backend `DriftReport` entity armazena `driftDetails` como JSON string (TEXT column). Retornar diretamente ao frontend exigiria parsing no cliente — violação de separação de responsabilidades. O DTO parseia, agrupa por resourceAddress, computa summary, e define severity baseada no driftType.
**Alternativas**: Parsing no frontend (client-side responsibility leak), criar endpoint separado (overengineering para 4 endpoints).
**Impacto**: StateController atualizado para retornar DTOs. Frontend store simplificado (não precisa parsear JSON). 2 novos arquivos DTO.

### 2026-06-24 — Multi-Provider Template Architecture
**Decisão**: Refatorar `GetTemplate()` de função monolítica em `aws.go` para dispatcher multi-provider em `router.go`, com cada provider registrando seus templates via função separada (`awsTemplates()`, `azureTemplates()`, `gcpTemplates()`, `k8sTemplates()`).
**Razão**: Suporte a Azure, GCP e K8s templates exigia extensão do dispatcher. Manter tudo em `aws.go` violaria coesão. Provider registry pattern permite adicionar novos providers sem modificar código existente (aberto para extensão, fechado para modificação).
**Alternativas**: Switch gigante em `aws.go` (baixa coesão), arquivo `templates.go` único (muito grande), interface `Provider` com método `Templates()` (overengineering para 4 providers).
**Impacto**: 7 novos arquivos Go (3 templates + 3 registries + 1 router). `aws.go` reduzido em 20 linhas.

### 2026-06-24 — driftStore Real API Migration
**Decisão**: Remover `persist` middleware e `simulateDriftDetection()` mock data do driftStore, substituindo por chamadas reais à API via `getDriftReport()` e `resolveDrift()` do `provision.ts`.
**Razão**: PRR N3 explicitamente exige "Stores don't persist API data". Mock data estava gerando relatórios falsos baseados no canvas local em vez de dados reais de infraestrutura.
**Alternativas**: Manter persist com TTL (ainda viola N3), dual-write (mock + API — complexidade desnecessária).
**Impacto**: driftStore reduzido de 295 para 244 linhas. loading/error states adicionados. DriftDetection.tsx atualizado. Componentes dependentes inalterados (mesma interface pública).

## Regras Imutaveis
- SEM Lombok (incompativel com JDK 25)
- SEM as any / @ts-ignore / @ts-expect-error
- UI sempre em PT-BR
- Icones sempre lucide-react
- String (UUID v4) para chaves primarias no backend (crypto.randomUUID().toString())
- @NullMarked em todos os pacotes Java
- Feature flags sao AND com RBAC (nao override)
- API versioning via header strategy (Accept: application/vnd.cloudbuilder.v1+json)
- Encriptacao de secrets via SecretEncryptionConverter (AES-256 + base64)
### 2026-06-25 — Content Strategy: 5 Pillars, Template-Driven SEO, Anti-Drift Positioning
**Decisão**: Adotar estratégia de conteúdo com 5 pillars temáticos, priorizando template-driven SEO (modelo Miro) e posicionamento anti-bill-shock como diferencial competitivo. Criar landing pages de "infrastructure diagram templates" como estratégia de growth orgânico.
**Razão**: Pesquisa de customer sentiment em 6 competidores revelou que (1) bill shock é a maior dor do mercado de observabilidade, (2) diagram drift é um problema universal não resolvido, (3) Miro's template SEO (2.77% páginas → 29% tráfego) é o modelo de growth mais comprovado para plataformas visuais, (4) AI agents estão no pico do hype — CloudBuilder deve evitar AI washing.
**Alternativas**: Estratégia focada em paid ads (custo alto, CAC inviável), strategy focada em enterprise sales (muito cedo, sem time de vendas), strategy focada em community-first (complementar, não substitui conteúdo estruturado).
**Impacto**: 15 conteúdos priorizados em 3 sprints, 5 pillar posts como conteúdo perene, calendário editorial de 3 meses com milestones de tráfego. Template-driven SEO será o motor de growth orgânico de longo prazo.

### 2026-06-26 — Sprint 20: Frontend Performance Optimization
**Decisão**: Adicionar rollup-plugin-visualizer e vite-plugin-compression (brotli) ao pipeline de build. Separar react/react-dom e lucide-react em manualChunks próprios. Configurar base path variável via CDN_BASE env var para deploy em CDN. Adicionar script `build:analyze` para análise visual de bundle.
**Razão**: Bundle analysis via visualizer permite identificar oportunidades de redução. Brotli compression reduz tamanho de transferência em ~70% (ex: vendor-recharts 382KB → 92KB brotli). CDN_BASE permite servir assets de CDN sem rebuild.
**Alternativas**: `vite-bundle-visualizer` (menos integrado), `nginx gzip_static` (configuração extra), CloudFront Lambda@Edge (mais complexo que env var).
**Impacto**: vendor-react chunk warning (resolvido removendo entry vazio). yjs removido de manualChunks (não instalado). lightningcss removido (não instalado). Build bem-sucedido com 2533 módulos em 5.87s.

### 2026-06-26 — ADR-020 Status Correction
**Decisão**: Marcar ADR-020 (Policy as Code OPA) como ✅ Implementado — code review confirmou que toda a integração existe (OpaClientService, OpaPolicyEvaluator, ComplianceService, ComplianceRuleEvaluator, ComplianceController, 4 Rego policies, OPA sidecar em docker-compose.yml, testes). Status era "Proposed (Not Implemented)" no ADR mas código foi implementado no merge Phase 6B-9.
**Razão**: Manter ADR como "Not Implemented" causa confusão — qualquer leitor do documento assumiria que o recurso não existe. A correção alinha documentação com código real.
**Alternativas**: Deixar como está (desalinhamento documentação↔código).
**Impacto**: Nenhuma mudança de código. Apenas atualização de status no ADR e na tabela de ADRs no README de arquitetura.

### 2026-06-25 — Competitor Profile Structure + Content Operations
**Decisão**: Estruturar competitor profiles em formato padronizado (Overview, Blog/Content Strategy, SEO Analysis, Product Positioning, Pricing, G2/Reddit Sentiment, Gaps for CloudBuilder, Competitive Implications) para garantir comparabilidade cross-competidor. Manter profiles em `competitor-profiles/` na raiz do projeto (não em `docs/`) para acesso rápido.
**Razão**: Perfis não-padronizados dificultam comparação direta. Localização na raiz (vs aninhado em docs/) reduz atrito de consulta durante execução de marketing.
**Alternativas**: Profiles em docs/marketing/ (muito aninhado), profiles em planilha externa (fora do git, perde versionamento), profiles em formato livre (incomparáveis).
**Impacto**: 6 profiles criados em ~130 linhas cada, formato replicável para novos competidores. Summary cross-competitor gerado automaticamente a partir dos profiles individuais.

### 2026-06-27 — Frontend API Backend Mismatch Fixes (7 issues)
**Decisão**: Corrigir 7 mismatches entre chamadas de API do frontend e endpoints reais do backend, identificados durante auditoria de 48 controllers backend (~200 endpoints):
1. `multiRegion.ts`: BASE hardcoded `/api/v1` causava duplo prefixo (client.ts já adiciona `/api/v1`) — corrigido para `/multiregion`
2. `aiops.ts`: `getTemplates()` removido acidentalmente mas restaurado — endpoint `/aiops/templates` não existe no backend, frontend já trata graceful fallback (try/catch → `[]`)
3. `iam.ts`: Paths MFA (`/iam/users/{userId}/mfa` → `/iam/mfa/{action}/{userId}`) e Sessions (`/iam/users/{userId}/sessions` → `/iam/sessions/user/{userId}`) corrigidos para匹配 backend IAMController
4. `design.ts`: `createVersion()` adicionado body obrigatório `{ changeDescription, createdBy }` para匹配 backend VersionController
5. `observability.ts`: `getErrorTraces()` → `GET /observability/traces/errors` — **verificado como correto** (TraceController tem `@GetMapping("/errors")`)
6. `docs.ts`: `createDocLink()` fields alterados de `{ docPath, entityType, entityId }` para `{ sourcePath, linkedPath, relationship }` para匹配 backend DocLinkRequest DTO
7. `provision.ts`: Return types de `syncEnvironment()` (`{status,timestamp}` → `ManagedResourceDTO[]`) e `resolveDrift()` (`{status,resolvedCount}` → `DriftReportDTO`) corrigidos para匹配 backend DTOs
**Razão**: Frontend usava paths/formatos que não correspondiam aos endpoints reais do backend, o que causaria falhas em produção quando as APIs fossem chamadas. Algumas funções (iam.ts, multiregion.ts, docs.ts) não estão sendo consumidas por stores/módulos atualmente, mas foram corrigidas preventivamente.
**Impacto**: 6 arquivos frontend modificados. TypeScript compila com zero erros (exit code 0). Zero mudanças no backend. Backend `/aiops/templates` endpoint continua ausente — frontend já trata gracefulmente com fallback `[]`.

### 2026-06-27 — APMController Mock Removal (SDD Cycle)
**Decisão**: Remover `APMController.java` (155 linhas, mock puro via `ThreadLocalRandom`) e seus 4 DTOs associados (AlertDTO, APMSnapshotDTO, SpanDTO, TraceDTO). Rewire `ObservabilityPanel.tsx` no design module para usar `observabilityApi` real com polling.
**Razão**: Era o único mock remanescente entre os 3 módulos MVP (Dashboard, Design/Provision, Observe). Frontend não consumia nenhum endpoint do APMController — o ObservabilityPanel era o único consumidor e estava hardcoded para SSE `/apm/stream`. O módulo Native Observability já tem incidentes e traces reais.
**Alternativas**: Rewire APMController para usar repositórios reais (mais trabalho, controller não é usado por nenhum frontend core), manter SSE mock (viola mandato "sem mocks").
**Impacto**: APMController deletado + 4 DTOs. ObservabilityPanel rewired (SSE → polling 15s com getActiveIncidents + getTraces). TypeScript 0 errors, Vitest 73/73 pass. Diretório `com.cloudbuilder.apm/` removido.

### 2026-06-27 — ADR-034: Event-Driven Architecture for MVP (3 Camadas)
**Decisão**: Adotar arquitetura event-driven de 3 camadas substituindo o padrão síncrono request-response existente. **Layer 1 — Go Engine**: EventPublisher com múltiplos subscribers (antes stdout-only) + gRPC server-streaming WatchEvents endpoint. **Layer 2 — Backend Java**: `shared/event/` infrastructure com PlatformEvent interface + 5 domain events + @EventListener handlers cross-module + ApplicationEventMulticaster assíncrono. **Layer 3 — Frontend**: SSE via EventStreamController que escuta todos os PlatformEvents e faz push para o frontend. useEventStream hook multiplexa eventos para Zustand stores (driftStore, deployStore, incidentStore).
**Razão**: Audit do provision engine confirmou que (1) Go EventPublisher escrevia só stdout — eventos desapareciam, (2) `@EventListener` — zero ocorrências em todo o codebase Java (15 módulos), (3) `CodeGeneratedEvent` publicado mas sem listeners. Mandato explícito do usuário via `/faang`: "os 3 módulos + a go engine devem ser Event Driven, pois estamos lidando com eventos assincronos o tempo todo".
**Alternativas**: Kafka reintroduction ($200/mo, overengineering), RabbitMQ (container extra), WebSocket (full-duplex desnecessário para push unilateral).
**Impacto**: 13 novos arquivos Java (shared/event/), 1 novo go file (stream.go), 1 novo frontend hook (useEventStream.ts), 3 stores atualizadas (driftStore, deployStore, incidentStore), ADR-034 documentation. Zero novas dependências ou containers. TypeScript 0 errors, Go tests 10/10 pass, Vitest 73/73 pass. Provision proto atualizado com WatchEvents RPC + EngineEvent message.

### 2026-06-28 — Companion Architecture Documents (5 Documents, ~159K Total)
**Decisão**: Criar 5 companion documents de arquitetura, cada um em diretório separado sob `docs/architecture/{domain}/`, como extensão do Architecture Manifesto existente (1,588 linhas, 6 partes). Cada documento cobre um domínio específico da plataforma, grounded no código real e nos ADRs existentes.
**Razão**: O Architecture Manifesto estabelece princípios e visão geral, mas não detalha domínios específicos. 5 domínios críticos (Security, Observability, Go Engine, FinOps, AI Platform) merecem documentação dedicada com profundidade técnica, diagramas, API references e roadmaps — sem especulação, apenas grounded no código existente.
**Alternativas**: Documento único de 800+ linhas (ilegível), wiki externo (fora do git, sem versionamento), ADRs avulsos sem coesão (perde visão sistêmica).
**Impacto**: 5 documentos (~159K total, 81 seções), arquivados em `docs/architecture/{security,observability,go-engine,finops,ai-platform}/`. 34 ADRs (008-034) referenciados como fontes primárias. AGENTS.md atualizado.

### 2026-06-28 — Event Bus Production Hardening (Passos 1-4)
**Decisão**: Quatro iniciativas simultâneas para levar o event bus de POC para production-ready:
1. **Cross-module E2E wiring**: Substituir comentários fictícios nos 4 event listeners por chamadas a serviços reais (HealthCheckService, IncidentService, AuditService, MetricsService).
2. **Transactional Outbox**: Persistir PlatformEvent em tabela event_outbox antes do processamento assíncrono, com OutboxSweeper retry a cada 30s. Garante at-least-once delivery mesmo com crash do JVM entre commit e processamento.
3. **Event Bus Observability**: 5 counters Micrometer (published, listener success/failure, outbox swept/cleaned) + micrometer-registry-prometheus para expor /actuator/prometheus.
4. **CI/CD Pipeline**: docker-publish workflow (3 imagens → ghcr.io), cd-deploy workflow (staging/production), Go engine Dockerfile, provision-engine adicionado ao docker-compose.
**Razão**: Event bus foi implementado em sessão anterior (ADR-034) mas (1) listeners estavam comentados, (2) sem garantia de entrega, (3) sem métricas, (4) sem CI/CD para deploy das imagens. Esses 4 passos resolvem os gaps restantes para produção.
**Alternativas**: Kafka (overengineering para MVP), RabbitMQ (container extra), Debezium (outbox via CDC — complexidade desnecessária com JPA simples).
**Impacto**: 12 novos arquivos (EventOutbox, EventOutboxRepository, OutboxEventListener, OutboxSweeper, EventMetrics, V14 migration, provision-engine Dockerfile, 2 GitHub workflows, docker-compose update, pom.xml). TypeScript 0 errors, Go tests 8/8 pass, Go vet clean.

### 2026-06-28 — ADR-035: Production Event-Driven Architecture (Kafka-based)
**Decisão**: Formalizar a transição de eventos Spring Modulith (ADR-034) para Kafka-based EDA em produção, conforme diagrama de arquitetura fornecido pelo usuário. Criar ADR-035 com 10 producers, 20 topics, 6 integration patterns, 8 consumers, 6 read models. Criar documentação dedicada em `docs/architecture/eda/README.md` (~15K).
**Razão**: O diagrama EDA mostra arquitetura de produção com Kafka como event bus central — uma evolução natural do MVP ADR-034 (Spring Modulith events). Kafka oferece replay, partitioning, durability, exactly-once semantics, e ecossistema maduro. A documentação existente (ADR-034) cobre apenas o MVP; o diagrama mostra a visão de produção completa.
**Alternativas**: Kafkado Pulsar (ecossistema menor), EventBridge (vendor lock-in AWS), mantendo Spring Modulith events (sem replay, sem durability).
**Impacto**: 2 novos arquivos: `docs/architecture/adr-035-production-event-driven-architecture.md` (ADR formal) e `docs/architecture/eda/README.md` (documentação completa). AGENTS.md atualizado com referências. decision_memory.md + progress_memory.md atualizados.

### 2026-06-28 — ADR-035 EDA Implementation (Production Kafka Backend)
**Decisão**: Implementar a infraestrutura Kafka completa para EDA em produção, com dual-mode (Kafka habilitado/desabilitado), Outbox Pattern para publishing, Inbox Pattern para dedup, e DLQ para falhas. 19 novos arquivos Java, 1 Flyway migration, 1 kafka bridge para SSE.
**Razão**: ADR-035 documentava a arquitetura mas não havia código implementado. O código existente (ADR-034) usava apenas Spring Modulith events — in-memory, sem replay, sem durability. A implementação adiciona Kafka como transport layer mantendo backward compatibility com @EventListener quando Kafka está desabilitado.
**Alternativas**: Deixar apenas a documentação (sem implementação), usar Confluent Schema Registry (overengineering MVP), reescrever listeners (quebra backward compat).
**Impacto**: 19 novos arquivos Java (KafkaConfig, TopicRouter, KafkaEventPublisher, KafkaProperties, InboxProcessor, DLQHandler, EventInbox, EventInboxRepository, DlqEvent, DlqEventRepository, 4 Kafka listeners, EventStreamKafkaBridge, PlatformEvent enhancement) + 1 Flyway migration (V16) + 1 modified (OutboxSweeper) + 4 modified (@EventListener conditional) + application.yml + docker-compose.yml. Kafka KRaft single-node no docker-compose.

### 2026-06-28 — ADR-035 Go Engine Kafka Producer
**Decisão**: Adicionar `KafkaProducer` ao Go engine (`provision-engine/internal/messaging/kafka.go`) com `segmentio/kafka-go` (pure Go, CGO-free), roteamento automático de eventos para 4 tópicos Kafka (deployment, observability, provisioning, cost), e integração via `--kafka` / `--kafka-brokers` CLI flags no `main.go`. Producer é opcional: quando `--kafka=false` (default), eventos vão apenas para subscribers locais.
**Razão**: Go engine gera eventos de deploy/drift que precisam chegar ao backend Java para persistência e broadcast via SSE. Producer assíncrono (Async=true) evita bloquear o gRPC server. `segmentio/kafka-go` escolhido sobre `confluent-kafka-go` por ser pure Go (sem CGO, sem librdkafka).
**Alternativas**: confluent-kafka-go (requer CGO + librdkafka), gRPC bridge direto (já existe mas acoplamento demais), HTTP polling (latência alta).
**Impacto**: 3 novos arquivos Go (kafka.go, kafka_test.go), 2 modificados (event.go, server.go, main.go, go.mod). Go build clean, 16/16 tests pass. Flags: `--kafka` (bool) e `--kafka-brokers` (string). go.mod atualizado para go 1.23 (kafka-go v0.4.51 requirement).

### 2026-06-28 — Frontend SSE Reconnect Improvements
**Decisão**: Padronizar os 3 hooks SSE (`useSSE.ts`, `useEventStream.ts`, `useMetricsStream.ts`) com exponential backoff (2s base, 60s max), max 10 retries, connection status exposta, e manual `reconnect()` fn.
**Razão**: `useSSE.ts` usava backoff linear (3s * retryCount, 5 retries). `useMetricsStream.ts` usava fixo 5s sem backoff nem max retries. `useEventStream.ts` não expunha connection status. Padrão inconsistente dificultava debugging de conexões perdidas.
**Alternativas**: Deixar como está (risco de reconnect storms), usar lib externa como `react-sse` (dependência desnecessária).
**Impacto**: 3 arquivos modificados. TypeScript 0 erros. Todas as conexões SSE agora usam exponential backoff com jitter implícito via `Math.min(RETRY_BASE_DELAY * 2^(n-1), RETRY_MAX_DELAY)`.

### 2026-06-28 — ADR-036: Comprehensive Test Pyramid
**Decisão**: Implementar test pyramid de 11 camadas (unit, component, property-based, mutation, BDD, integration, E2E, load/stress, chaos, security, visual regression) com fast-check (property-based), Stryker (mutation), k6 (load/stress), Playwright (E2E + visual), OWASP ZAP + Snyk (security), e GitHub Actions CI pipeline com 4 jobs.
**Razão**: Cobertura de testes existente era 100% unitária — sem property-based, sem BDD, sem load testing, sem chaos engineering. O teste de propriedade descobriu 4 bugs reais de produção (isEnabled prototype pollution, state leak em BDD, nanoId(0) edge case, cn() idempotent assertion incorreta). ADR formaliza a estratégia de teste para guiar contribuições futuras.
**Alternativas**: Manter apenas unit tests (sem descoberta de bugs cross-module), usar propietary tools (Datadog Synthetics $), framework único (Cypress para tudo — perde coverage de property-based/chaos).
**Impacto**: 13 novos test files, 132/132 tests passando. 4 bugs de produção corrigidos (uiStore.isEnabled prototype, design.behavior state leak, utils.nanoId(0), utils.property cn idempotency). ADR-036 em `docs/architecture/adr-036-comprehensive-test-pyramid.md`. CI pipeline em `.github/workflows/test-pyramid.yml`.

### 2026-06-28 — Production Bug: isEnabled Prototype Pollution
**Decisão**: Corrigir `isEnabled` em `uiStore.ts` usando `Object.prototype.hasOwnProperty.call()` em vez de acesso direto a propriedades do objeto, para evitar prototype pollution (e.g., `"constructor"`, `"toString"` retornando valores nativos do Object.prototype).
**Razão**: Testes property-based com fast-check geraram a string `"constructor"` como counterexample — `{}["constructor"]` retorna a função `Object()` em vez de `undefined`, causando `isEnabled("constructor")` retornar `undefined` em vez de `false`.
**Alternativas**: Usar `Object.hasOwn()` (requer ES2022, tsconfig é ES2020), filtrar strings problemáticas no teste (masking, não fix), usar `Map<string, FeatureFlagDTO>` em vez de objeto plain (quebra persist middleware).
**Impacto**: 2 linhas modificadas em `uiStore.ts`. `Object.prototype.hasOwnProperty.call()` compatível com ES2020. Teste property-based agora passa com 200 runs aleatórios.

### 2026-06-28 — Production Bug: nanoId(0) Edge Case
**Decisão**: Corrigir `nanoId()` em `utils.ts` para tratar `length === 0` corretamente, retornando string vazia em vez de UUID.
**Razão**: `if (length)` em JavaScript trata `0` como falsy — `nanoId(0)` retornava `crypto.randomUUID()` (36 chars) em vez de `""` (0 chars).
**Alternativas**: Adicionar explicitamente `if (length === 0) return ""` (mais legível mas duplica branch), manter comportamento atual (UUID para 0 — documentar como feature).
**Impacto**: 1 linha modificada: `if (length)` → `if (length != null)`. `nanoId()` sem argumentos continua retornando UUID. `nanoId(0)` agora retorna `""`.

### 2026-06-28 — Phase 1: Organization + Team + Membership Backend Scaffolding
**Decisão**: Implementar 3 entidades backend (Organization, Team, Membership) no módulo IAM seguindo padrões hexagonais existentes (Tenant, TenantUser), com 3 repositórios Spring Data, 3 serviços, 3 DTOs records, 3 controllers REST, e 3 migrações Flyway (V18-V20).
**Razão**: Identity Platform requer hierarquia Organization → Team → Membership para suportar multi-tenant, RBAC por organização, e onboarding fluxo (criar organização → criar squad → convidar). Entidades existentes (Tenant, TenantUser) são insuficientes — não suportam owner, slug, team assignment, ou role hierarchy (OWNER > ADMIN > MEMBER > GUEST).
**Alternativas**: Estender Tenant/TenantUser existentes (acoplamento indevido, não suporta teams), criar módulo separado "organization" (overengineering para fase inicial — melhor manter no IAM), usar Keycloak (dependência externa desnecessária para MVP).
**Impacto**: 16 arquivos Java + 3 SQL migrations. SecurityConfig inalterado (endpoints cobertos por @PreAuthorize existente). Conhecida limitação: `hasAnyRole('ADMIN', 'OWNER')` — OWNER não é role Spring Security existente, será refinado na fase de RBAC wiring.

### 2026-06-28 — Phase 2: Project Entity + Environment/Credential Refactoring
**Decisão**: Criar entidade Project (hexagonal) no módulo IAM + adicionar colunas `projectId` (nullable) em Environment e `organizationId` (nullable) em Credential para preparar hierarquia Organization → Project → Environment.
**Razão**: Ambientes precisam pertencer a projetos (não diretamente a tenants). Credentials precisam de vinculação organizacional para compartilhamento seguro entre squads. Adicionar colunas nullable preserva backward compatibility sem quebra de dados existentes.
**Alternativas**: Criar tabelas ponte (complexidade desnecessária para MVP), restringir tudo a tenantId (não suporta multi-org), usar herança JPA (overengineering).
**Impacto**: 11 arquivos (5 novos + 4 modificados + 2 migrations). Environment.java e Credential.java mantêm tenantId existente + novas colunas nullable.

### 2026-06-28 — Phase 3: Invitation + Email Flow
**Decisão**: Implementar fluxo de convite com entity Invitation (token UUID, 7 dias expiry), interface EmailService + stub console, e controller REST com accept/cancel workflow.
**Razão**: Onboarding requer convite por email para novos membros. Token-based flow é padrão da indústria (Slack, GitHub). EmailServiceStub permite desenvolvimento sem SMTP real — swap trivial em produção.
**Alternativas**: Envio direto sem token (inseguro), usar serviço externo como SendGrid desde o início (custo innecessário para MVP), convite via link compartilhado (sem controle de quem aceita).
**Impacto**: 9 arquivos (5 novos + 1 migration). Invitation entity com unique constraint (email, org_id) WHERE status = 'PENDING'.

### 2026-06-28 — Phase 4: Frontend UI (Organizations/Teams/Projects/Invitations)
**Decisão**: Criar API client class-based (`OrganizationApiService`) + 4 Zustand stores (organization, team, project, workspace) + 4 UI components (OrganizationSelector, TeamManagement, ProjectSelector, InvitationModal) seguindo padrões existentes do frontend.
**Razão**: Backend implementado nas fases 1-3 precisa de UI para ser utilizável. Padrão class-based API client mantém consistência com módulos existentes (costStore, platformStore). Componentes seguem design system shadcn/ui + Tailwind existente.
**Alternativas**: Criar tudo em um mega-componente (ilegível), usar React Query em vez de Zustand (inconsistente com stores existentes), lazy-load tudo (overengineering para 8 arquivos).
**Impacto**: 8 arquivos frontend. `npx tsc --noEmit` 0 erros após fixes (Workspace type export + missing `}` em InvitationModal.tsx:190).

### 2026-06-28 — Phase 5: Workspace + Billing Stub
**Decisão**: Implementar Workspace (pertence a Organization, contém Projects) + BillingStub (placeholder para Stripe) com entidades, repos, services, DTOs, controllers, migration V24, e frontend (workspaceStore + WorkspaceSelector).
**Razão**: Workspace é necessário para multi-team environments onde diferentes squads trabalham em subsets de projects. BillingStub placeholder permite UI de planos sem dependência de Stripe — integração real é fase futura.
**Alternativas**: Unir Workspace com Organization (não suporta multi-workspace por org), pular billing (UI não mostra plano), usar Stripe desde o início (custo + complexidade MVP).
**Impacto**: 14 arquivos (12 backend + 2 frontend). Hierarquia final: ORGANIZATION → WORKSPACE → PROJECT → ENVIRONMENT. BillingPlan enum com 4 tiers (FREE/STARTER/PROFESSIONAL/ENTERPRISE).

### 2026-06-29 — Platform & User Settings Diagrams (10 Mermaid diagrams)
**Decisão**: Criar documentação completa de configurações da plataforma e do usuário com 10 diagramas Mermaid, cobrindo: Platform Administration, Platform Modules, User Settings, Organization Settings, Organization Teams, RBAC Roles, Cloud Accounts, Integrations, User Journey Flow, e Platform Foundation Overview.
**Razão**: A plataforma precisa de documentação clara da hierarquia de configurações (User → Organization → Platform) e dos fluxos de acesso (RBAC, Cloud Accounts, Integrations). Diagramas Mermaid facilitam visualização e manutenção.
**Alternativas**: Documentação apenas em texto (difícil visualização), apenas no README (muito grande), usar ferramentas externas (fora do git).
**Impacto**: 2 novos arquivos: `docs/architecture/platform-settings/DIAGRAMS.md` (10 diagramas + tabelas + appendices) e atualização do `docs/architecture/README.md` (seção 16 com todos os diagramas inline). Referências cruzadas com ADR-032 (Feature Flags), ADR-035 (EDA), ADR-025 (SSO), ADR-028 (Security).

### 2026-06-29 — Frontend Architecture Diagrams (23 Mermaid diagrams)
**Decisão**: Criar documentação completa da arquitetura frontend com 23 diagramas Mermaid, cobrindo: high-level architecture, authentication flow, module organization, dashboard, workspace, project, canvas, deployments, observability, finops, security, settings, administration, user journey, navigation flow, state management, component hierarchy, auth sequence, design module deep dive, RBAC/feature flag gating, responsive layout, e directory structure.
**Razão**: O frontend é o maior módulo do CloudBuilder (20+ módulos, 20 Zustand stores, 22 shadcn/ui components). Documentação visual clara é essencial para manutenção, onboarding de novos devs, e consistência arquitetural.
**Alternativas**: Documentar apenas no README (muito grande para um único arquivo), usar ferramentas externas (fora do git), não documentar (acumula dívida técnica).
**Impacto**: 1 novo arquivo: `docs/architecture/frontend/DIAGRAMS.md` (23 diagramas + tabelas + estrutura de diretórios) e atualização do `docs/architecture/README.md` (seção 18 com diagramas inline). Referências cruzadas com existing modules (design, provision, observe, cost, platform, aiops, audit, settings).

### 2026-06-29 — ADR-037: Frontend Architecture Restructuring (Phase 1 Foundation)
**Decisão**: Implementar Phase 1 (Foundation) da reestruturação do frontend, criando novos diretórios e extraindo componentes monolíticos do App.tsx (654 linhas) para módulos separados: `src/app/` (App shell + Providers), `src/router/` (lazy imports + nav config + module metadata), `src/layouts/` (MainLayout, AuthLayout, OnboardingLayout), `src/design-system/` (shadcn/ui wrappers), `src/shared/` (types, utils).
**Razão**: O App.tsx monolítico continha layout, routing, nav, search, project switcher, setup status, auth flow, e onboarding — tudo em 654 linhas. A reestruturação alinha com a arquitetura target dos diagramas Mermaid (ADR-037) e prepara para Phase 2 (features/ rename) e Phase 3 (missing modules).
**Alternativas**: Refatorar App.tsx sem novos diretórios (não resolve granularidade), migrar tudo de uma vez (risco alto), não refatorar (acumula dívida técnica).
**Impacto**: 12 novos arquivos criados, 1 arquivo modificado (main.tsx). TypeScript 0 erros. App.tsx reduzido de 654 → 135 linhas. Backward-compatible: todos os imports `@/components/ui/*`, `@/lib/utils`, `@/types/*` preservados. ADR criado em `docs/architecture/adr-037-frontend-architecture-restructuring.md`.

### 2026-06-29 — ADR-037 Phase 2: Frontend Restructuring Completion
**Decisão**: Completar Phase 2 (Feature Restructuring) da ADR-037, implementando: (1) Shared services (EventBus, CommandBus, WebSocket, Cache), (2) Module renames (design→canvas, aiops→ai, observe→observability, cost→finops), (3) Provision split (provisioning + deployment + gitops), (4) Merges (analytics→dashboard, flags→settings, docs→settings, iam+audit→security), (5) New stubs (billing, notifications, workspace, projects), (6) Relocations (auth→shared/auth, onboarding→app/onboarding), (7) Store + API barrel exports in each feature module, (8) Bulk module ID rename (103 replacements across 11 files).
**Razão**: O frontend tinha 15 módulos flat sem separação de responsabilidades. A reestruturação alinha com a arquitetura target dos diagramas Mermaid e prepara para CommandBus/EventBus patterns. Module renames refletem terminologia DDD (Canvas em vez de Design, FinOps em vez de Cost).
**Alternativas**: Migrar tudo de uma vez para feature-sliced (muito ambicioso para esta fase), não reestruturar (acumula dívida técnica).
**Impacto**: 15 feature modules em `src/modules/` (ai, billing, canvas, dashboard, deployment, finops, gitops, notifications, observability, platform, projects, provisioning, security, settings, workspace). 7 shared services em `src/shared/`. TypeScript 0 erros. Vite build 2537 modules 11.63s. ADR-037 atualizada para Status: Implemented. Todas as import paths corrigidas. ModuleId type em uiStore.ts atualizado. Feature flag checks em App.tsx e MainLayout.tsx atualizados.

### 2026-06-30 — FAANg Code Quality Audit: Type Safety Cleanup
**Decisão**: Realizar auditoria completa de código frontend seguindo FAANg Harness Engineering Pipeline (Research → Audit → Fix → Verify). Remover todas as 21 violações `as any`, 8 debug `console.log`/`console.group`, e 1 `alert()` nativo. Manter `console.error` (14) e `console.warn` (3) que são error handling legítimo em catch blocks.
**Razão**: `as any` esconde erros de tipo reais e viola type-safety do TypeScript. `alert()` é UX inadequado para SPA. `console.log` em produção é debug noise. O projeto já tinha zero erros de compilação — essas violações eram o único gap de qualidade restante.
**Alternativas**: Não alterar (manter status quo com violações documentadas), substituir `console.error/warn` por toast (perderia visibilidade de erros em catch blocks).
**Impacto**: 11 arquivos modificados (LoginPage.tsx, api/cost.ts, ComponentPalette.tsx, canvasExport.ts, CanvasView.tsx, VersionHistoryPanel.tsx, ServiceMapView.tsx, SettingsModule.tsx, collaborationManager.ts, useEventStream.ts, CursorsOverlay.tsx, DashboardCharts.tsx, command-bus/index.ts, websocket/index.ts). Novo método público `getWsAccessor()` no CollaborationManager. TypeScript 0 erros. Vite build 2548 modules 9.81s. Vitest 122/122 pass. 7 frontend TODOs Phase-3 + 1 backend TODO identificados como dívida técnica legítima (não bugs). 58+61 matches de TODO/FIXME auditados — falsos positivos eram labels PT-BR ("Todos") e nomes de componente (TodoItem/TodoRow).
