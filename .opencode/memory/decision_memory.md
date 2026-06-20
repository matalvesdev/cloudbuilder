# Decision Memory

## Histórico de Decisões

### 2026-06-15 — FAANg Framework Adoption
**Decisão**: Adotar FAANg (Future Autonomous AI Network for Engineering) como framework único de agentes de engenharia.
**Razão**: Unificar todos os agentes sob uma metodologia consistente com knowledge hierarchy, harness engineering pipeline, memória persistente e ADRs.
**Alternativas**: Manter agentes independentes sem framework unificado.
**Impacto**: Todos os agentes seguem o mesmo pipeline de pesquisa → planejamento → arquitetura → implementação → revisão → teste → segurança → performance → deploy → avaliação → memória.

### 2026-06-15 — Rate Limiting In-Memory
**Decisão**: RateLimitingFilter em ConcurrentHashMap com sliding window.
**Razão**: Zero dependências externas, suficiente para dev/demo.
**Alternativas**: Bucket4j, Redis-based rate limiting.
**Impacto**: Reinicia em cada deploy. Migrar para Redis quando em produção multi-instância.

### 2026-06-15 — Audit no Controller, não no Service
**Decisão**: AuditService injetado no AuthController (não no AuthService).
**Razão**: IP real do HttpServletRequest disponível no controller; domain service não deve depender de HTTP.
**Impacto**: Controllers fazem logging de auditoria, services mantêm-se puramente de negócio.

### 2026-06-15 — Register sem Auto-Auth
**Decisão**: RegisterPage usa authApi.register() + clearTokens() em vez de authStore.register().
**Razão**: Fluxo de verificação de email requer que usuário NÃO esteja autenticado após registro.
**Impacto**: UX: após registro, usuário vê tela "Verifique seu email" e precisa fazer login manual.

### 2026-06-17 — Native Observability: PostgreSQL-native storage
**Decisão**: Métricas, traces, logs e SLOs armazenados em PostgreSQL particionado (time-based) em vez de TSDB externo (TimescaleDB, VictoriaMetrics).
**Razão**: Zero dependências externas; mesmo banco do modulith; particionamento por mês mantém performance de query ranges.
**Alternativas**: TimescaleDB (hiper-tabelas), VictoriaMetrics, ClickHouse.
**Impacto**: Query de agregados pesados (percentis, downsampling) usa @Query nativa SQL. Migrar para TSDB dedicado se >10M metrics/dia.

### 2026-06-17 — Metrics dual-write (PostgreSQL + Micrometer)
**Decisão**: MetricsService escreve no PostgreSQL + Micrometer (para métricas JVM/system) simultaneamente.
**Razão**: Micrometer fornece métricas JVM/system gratuitas; PostgreSQL armazena métricas de negócio persistentes.
**Impacto**: Duas fontes de métricas; futuramente consolidar tudo no PostgreSQL se Micrometer se tornar redundante.

### 2026-06-17 — Alert deduplication via partial unique index
**Decisão**: Um único incidente OPEN por alert rule (partial unique index WHERE status = 'OPEN').
**Razão**: Evitar enxurrada de incidentes duplicados na mesma janela; o @Scheduled de 30s reavalia apenas rules sem incidente OPEN.
**Impacto**: Partial unique index é PostgreSQL-specific; H2 em dev/test não suporta — alertas só funcionam em prod.

### 2026-06-17 — Log ingestion assíncrona via Logback appender
**Decisão**: PostgresLogAppender custom com ArrayBlockingQueue (10K), batch insert a cada 500ms ou 100 entradas.
**Razão**: Não bloquear thread de aplicação para logging; batch insert reduz latência de escrita.
**Impacto**: Se DB cair, logs vão para stdout (fallback). Fila de 10K pode overflow em pico extremo — monitorar.

### 2026-06-17 — Trace context via ThreadLocal (mesmo padrão do TenantContext)
**Decisão**: TraceContext armazena traceId/spanId/parentSpanId em ThreadLocal, propagado via OncePerRequestFilter e HTTP headers (X-Trace-Id, X-Parent-Span-Id, X-Span-Id).
**Razão**: Mesmo padrão testado do TenantContext; sem dependência de OpenTelemetry; headers HTTP permitem propagação entre serviços.
**Impacto**: ThreadLocal não atravessa boundary de thread pool — operações assíncronas (@Async, Kafka) perdem contexto.

### 2026-06-17 — Native Replacements: Inline over Library
**Decisão**: Substituir 6 dependências npm (dagre, html-to-image, react-resizable-panels, react-hot-toast, cmdk, yjs) por implementações nativas React/TypeScript/Tailwind.
**Razão**: Zero dependências externas de terceiros; latência zero de import dinâmico; bundle menor; controle total sobre comportamento e branding.
**Alternativas**: Manter dependências existentes; substituir por alternativas menores (e.g., cytoscape → dagre).
**Impacto**: 3 implementações concluídas diretamente (dagre, html-to-image, resizable). 3 em background agents (toast, command, yjs). package.json simplificado.

### 2026-06-17 — Full-Page Onboarding Flow (non-modal)
**Decisão**: Onboarding implementado como telas full-page independentes (não modais/overlays) renderizadas condicionalmente em App.tsx entre auth e dashboard.
**Razão**: UX mais imersiva; evita problemas de z-index e scroll em modais; estado gerenciado via Zustand+localStorage (resiliente a refresh/close).
**Alternativas**: Modal/dialog sobre o dashboard; wizard em painel lateral.
**Impacto**: 3 novos componentes (Welcome/Tour/Gateway) + 1 store + routing em App.tsx. Após concluído, usuário vai direto para o dashboard como se onboarding nunca tivesse existido.

### 2026-06-17 — Auto-Documentation Module: Native Markdown Viewer without external renderer
**Decisão**: DocsModule usa renderizador Markdown próprio (regex-based) em vez de react-markdown/marked.
**Razão**: Zero dependências; controle total sobre estilização com brand colors (navy/lime); sem tree-shaking overhead de libs de markdown.
**Alternativas**: react-markdown (12kB gzip), marked (10kB), bundle com sintaxe highlight.
**Impacto**: Suporta headers, code blocks, inline code, bold/italic, links, lists, tables, HR — sem extensões GFM (tables são básicas). Para documentação de projeto é suficiente; se precisar de mermaid render, adicionar depois.

### 2026-06-17 — Documentation File-System Backed (not full DB)
**Decisão**: DocScannerService escaneia diretório de docs no filesystem; metadados em tabela doc_metadata (SHA-256, lastScanned). Conteúdo não armazenado em DB — lido do disco sob demanda.
**Razão**: .md files são source of truth; DB guarda apenas metadados de scan e auto-links; sync bidirecional (scan + watch) mantém consistência.
**Alternativas**: Store full content in PostgreSQL (duplicação), Git-based (mais complexo).
**Impacto**: Importação uploada .md para diretório configurado + metadados. Se deploy for stateless (container), docs persistem em volume montado.

### 2026-06-17 — Auto-Documentation via ADR Draft Generator
**Decisão**: AutoDocService.java gera rascunhos de ADR a partir de template + metadata do canvas (não AI-generated).
**Razão**: ADR template garante qualidade mínima; campos preenchidos com metadados reais (autor, data, contexto do módulo); sem depender de LLM externo.
**Alternativas**: LLM-generated ADRs (requer API key), manual-only (menos produtivo).
**Impacto**: Rascunho precisa revisão humana antes de finalizar — consistente com processo FAANg de ADRs.

### 2026-06-18 — ID Type Consistency: Backend UUID → String Migration (Phase 5d)
**Decisão**: Migrar todo o backend de `java.util.UUID` para `String` ("TEXT") como tipo de ID em entidades JPA, repositórios, serviços, DTOs e controladores.
**Razão**: Frontend já usava `string` nativamente (crypto.randomUUID()). Backend usava `UUID`. Isso exigia um frágil localStorage bridge (id-mapper.ts) e conversões manuais. Migrando para String, ambos os lados usam o mesmo tipo de forma direta.
**Alternativas**: Manter UUID no backend + id-mapper.ts bridge (frágil, localStorage), manter UUID + converter no controller (boilerplate em 20+ controllers).
**Impacto**: ~559 UUID references across 206 Java files changed. Zero regressões — 473/479 tests pass (6 pre-existing failures unrelated). Frontend removed unused id-mapper.ts ID mapping. TypeScript clean 0 errors. Backend compile 0 errors.
**Decisão**: Teste E2E do DocsModule usa fetch interception (addInitScript + mock responses) com localStorage onboarding bypass.
**Razão**: Consistente com demais testes de módulo; não depende de backend rodando; verifica rendering real do componente.
**Alternativas**: testar contra backend real (requer DB + scan), unit test isolado (não verifica rendering).
**Impacto**: 6/6 module E2E tests passando (11.3s).
**Decisão**: Usuários recém-onboarded sem recursos veem 4 cards de ação rápida (Criar Design, Importar Infra, Usar Template, Explorar Observabilidade) integrados ao dashboard, não um novo wizard modal.
**Razão**: Dashboard já tem SetupWizard para credenciais; os cards são leves, não modais, e cada um navega para o módulo correspondente.
**Alternativas**: Novo wizard onboarding no dashboard; modal de boas-vindas pós-onboarding.
**Impacto**: Seção "Primeiros Passos" condicional (some quando usuário cria primeiro recurso).

### 2026-06-19 — Batch Commit Strategy para ~400 arquivos pendentes
**Decisão**: Organizar commits em 4 batches lógicos (Phase 4 → Tests → Migration+Obs → Infra+Config) em vez de um único commit gigante.
**Razão**: Manter histórico legível e permitir bisect granular. Cada batch é autocontido (compila/testa isoladamente).
**Alternativas**: Single commit (mais simples, menos rastreável), 10+ commits (overhead de organização).
**Impacto**: 4 commits limpos, mensagens descritivas com escopo completo.

### 2026-06-19 — PropertyMappingService Fallback: get() sobre getOrDefault()
**Decisão**: Substituir `map.getOrDefault("default", ...)` por `map.get(propertyName)` no fallback de tipos desconhecidos.
**Razão**: `getOrDefault("default", ...)` interpretava o schema literal "default" como chave de fallback, capturando tipos de recurso desconhecidos que batiam com essa string. `get()` retorna null ausente, permitindo o tratamento correto (diretamente as 5 primeiras raw properties).
**Alternativas**: Filter explícito por tipo conhecido antes do fallback (mais complexo).
**Impacto**: 11/11 PropertyMappingServiceTest passam. Testes que usam tipos desconhecidos recebem 5 raw properties em vez de schema fixo.

### 2026-06-19 — GitHubOAuthService: Default Values para @Value Fields
**Decisão**: Inicializar `@Value("${...}") String` fields com `= ""` em vez de deixar null.
**Razão**: Em testes JUnit sem Spring context, campos injetados via `@Value` ficam null, causando NPE em `isBlank()`. Default `""` permite que a lógica de validação funcione em ambos os contextos (teste e produção).
**Alternativas**: Mockar Environment em cada teste; adicionar SpringBootTest (mais lento).
**Impacto**: 6/6 GitHubOAuthServiceTest passam. Produção continua funcionando — application.yml substitui os defaults vazios.

### 2026-06-19 — What-if Cost Persistence: Entidade Separada no Módulo Cost
**Decisão**: Criar `CostScenario` como JPA entity independente em `cost/domain/model/`, com seu próprio repository, service e endpoints no `CostController`.
**Razão**: Custo simulado (scenario) é conceitualmente diferente de custo real (CostRecord). Misturar violaria SRP e confundiria a API. Manter no módulo cost respeita boundaries do Spring Modulith.
**Alternativas**: Adicionar campos de scenario em CostRecord; armazenar como JSONB em tabela genérica (perde type safety).
**Impacto**: 3 arquivos novos (entity, repository, service) + 3 endpoints. Nenhuma alteração em entidades existentes.

### 2026-06-19 — Preview Workflow Persistence: DeployPlan + CodeGeneratorController
**Decisão**: `DeployPlan` entity no módulo provision, com endpoints no `CodeGeneratorController` existente (rota `/api/v1/canvases/{id}/generate/plan/**`).
**Razão**: DeployPlan é semanticamente parte do fluxo generate (gerar código → preview → aplicar). Reutilizar CodeGeneratorController evita novo controller com routing duplicado.
**Alternativas**: Novo `DeployPlanController` (mais isolado, mas mais arquivos), endpoints no `ProvisionController` (mistura deploy com provision).
**Impacto**: 3 arquivos novos + 5 endpoints no CodeGeneratorController. Se crescer além de 5 endpoints, extrair controller dedicado.

### 2026-06-19 — ServiceMap + Scorecards: 17 Testes JUnit sem Mockito Complexity
**Decisão**: Testar ServiceMapController e ScorecardController com Mockito stubbings mínimos, focando em comportamento real (bridge de dados, aggregated scores).
**Razão**: Cobertura funcional é mais valiosa que testar boilerplate do controller. Stubbings mínimos = testes mais resilientes a refactors.
**Alternativas**: Testes de integração com WebMvcTest (mais lentos), testes E2E com backend real (mais frágeis).
**Impacto**: 17 testes passando, 0 regressões. Testes capturam edge cases (canvas vazio, erros de busca, null checks).

### 2026-06-19 — MVP Report como Documento Autocontido
**Decisão**: MVP Report em `docs/mvp-readiness-report.md` com todas as 17 seções — não gerar checklist separado.
**Razão**: FAANg prefere documentação consolidada. Um único documento serve como fonte de verdade para decisão de go-live.
**Alternativas**: README editado, GitHub Project board, wiki separado.
**Impacto**: Relatório autocontido pode ser compartilhado com stakeholders externos sem depender de ferramentas.

## Regras Imutáveis
- SEM Lombok (incompatível com JDK 25)
- SEM as any / @ts-ignore / @ts-expect-error
- UI sempre em PT-BR
- Ícones sempre lucide-react
- String (UUID v4) para chaves primárias no backend (crypto.randomUUID().toString())
- @NullMarked em todos os pacotes Java

### 2026-06-19 — Q3 2026 Operations Architecture (ADR-012)
**Decisão**: Design completo para Sprints 9-11 com PostgreSQL native partitioning, custom composite anomaly detection, strategy pattern para compliance, Modulith domain events, linear regression para cost projection, scheduled services para avaliação periódica, e Spring Data Specifications para audit queries.
**Razão**: Maximizar reuso de padrões existentes (tenantId isolation, @Scheduled, hexagonal architecture), zero novas dependências externas, consistência com ADR-008 (observabilidade nativa PostgreSQL).
**Alternativas**: TimescaleDB (nova dependência), Isolation Forest (overkill), Kafka cross-module (overkill no mesmo JVM), QueryDSL (mais verboso).
**Impacto**: ~54 novos arquivos Java, 4 novos componentes frontend, 3 sprints, ADR-012 documentado em docs/architecture/.

### 2026-06-20 — Anomaly Detection: Moving Average + StdDev (1.5σ) sobre Isolation Forest
**Decisão**: Implementar detecção de anomalias via moving average de 7 dias + threshold de 1.5 desvios padrão, em vez de Isolation Forest (ML), Z-Score simples ou Twitter's AnomalyDetection.
**Razão**: Moving average é computacionalmente leve (O(n)), não requer dependências de ML, funciona bem para padrões de custo (sazonais mas não cíclicos complexos), e tem interpretabilidade direta para auditoria (revisores entendem "desvio de 2.5σ").
**Alternativas**: Isolation Forest (scikit-learn, dependência Python/ML), Z-Score puro (média ± σ, não detecta tendências), Twitter's AnomalyDetection (R, dependência externa).
**Impacto**: 3 severidades baseadas em % de desvio (MODERATE 20%, HIGH 50%, CRITICAL 200%). Flag de alerta se desvio >30%. ~80 linhas de código, sem dependências externas.

### 2026-06-20 — Cost Projection: Linear Regression sobre 90 dias
**Decisão**: Implementar projeção via regressão linear simples (least squares) sobre totais diários dos últimos 90 dias.
**Razão**: Linear regression é o modelo mais simples com interpretabilidade direta (custo tende a ser linear em escala de semanas). Intervalo de confiança de 95% (1.96 × std error) comunica incerteza honestamente. Flag R² < 0.5 alerta quando projeção não é confiável.
**Alternativas**: Exponential smoothing (Holt-Winters, requer sazonalidade), ARIMA (overkill para 90 dias), Prophet (dependência Python), flat average (ignora tendência).
**Impacto**: ~90 linhas de código, CI bounds nativos, R² como métrica de confiança. Sem dependências externas.

### 2026-06-20 — Budget Alerts: Threshold-based (WARNING 80%, CRITICAL 90%, EXCEEDED 100%)
**Decisão**: Usar thresholds fixos para orçamentos em vez de forecasting ou ML-based.
**Razão**: Orçamento é contrato financeiro — thresholds fixos são auditáveis e previsíveis. Forecasting adicionaria complexidade sem valor para o caso de uso (budget holder quer saber se gasto atual % do limite, não se vai estourar mês que vem).
**Alternativas**: Projeção de burnout date (quando vai estourar), ML-based anomaly prediction, dynamic thresholds.
**Impacto**: Avaliação por budget via scheduled service. Alertas ordenados por severidade descrescente. 3 thresholds fixos documentados.

### 2026-06-20 — Audit Export: CSV + JSON nativos (sem libs externas)
**Decisão**: Implementar exportação CSV e JSON manualmente (StringBuilder, Jackson ObjectMapper) em vez de usar libs como OpenCSV ou Apache Commons CSV.
**Razão**: Jackson já está no classpath (Spring Boot). CSV é formato simples — StringBuilder com escape de vírgulas/aspas é suficiente. Evitar dependência extra (OpenCSV) para ~30 linhas de lógica de serialização.
**Alternativas**: OpenCSV (dependência extra), Apache Commons CSV (dependência extra), Spring's StreamingResponseBody (para streaming real).
**Impacto**: 2 métodos — exportCsv (~40 linhas) e exportJson (~15 linhas). JSON usa ObjectMapper.writeValueAsString() nativo. Sem dependências externas.

### 2026-06-20 — Compliance Rules: Strategy Pattern com RuleType Enum
**Decisão**: Implementar engine de conformidade via strategy pattern com enum RuleType (AUDIT_PATTERN, COST_THRESHOLD, RESOURCE_CONSTRAINT) e interface ValidationStrategy.
**Razão**: Strategy pattern permite adicionar novos tipos de regra sem modificar código existente (OCP). Enum como descriminador mantém a API REST simples (string literal para ruleType).
**Alternativas**: Chain of Responsibility (mais complexo para 3 tipos), Decision Table (menos flexível), SpEL expressions (overkill, risco de segurança).
**Impacto**: 3 strategies concretas, 1 factory (switch), CRUD completo via ComplianceService. Cada strategy recebe ComplianceRule + contexto e retorna ValidationResult.

### 2026-06-20 — AuditQueryService: Spring Data Specifications para Filtragem Dinâmica
**Decisão**: Usar JPA Specifications (Spring Data JPA) para construir queries de auditoria com filtros opcionais combináveis.
**Razão**: Specifications são type-safe, composáveis (AND/OR), e evitam escrever @Query nativa para cada combinação de filtro. O número de combinações possíveis (tenant + ação + tipo + data + search + userId + IP) é grande demais para @Query explícitas.
**Alternativas**: @Query nativa para cada combinação (explosão combinatorial), QueryDSL (outra dependência), Criteria API raw (mais verboso).
**Impacto**: 1 service method com construção dinâmica de Specification. Suporta: tenantId obrigatório + userId, action, resourceType, date range, ipAddress, search em details — todos opcionais e combináveis.
