# ADR-008: Native Observability Subsystem

## Status
Proposto — 2026-06-17

## Context
O CloudBuilder atualmente depende (ou dependeu) de ferramentas externas de observabilidade:
- **Prometheus** para métricas (exportado via Micrometer `/actuator/prometheus`)
- **Grafana** para dashboards
- **OpenTelemetry** para tracing distribuído
- **Datadog/ELK** como alternativas consideradas para logs

Na sessão de 2026-06-16 ("$0 infra cleanup"), essas dependências foram removidas do docker-compose.yml e do pom.xml. No entanto, os módulos `apm` e `metrics` continuam gerando **dados mock** sem persistência real.

O usuário explicitamente quer: **"não quero usar grafana, opentelemetry, datadog e etc por debaixo dos panos, quero que eles sejam nativos do sistema"**.

Isso significa construir um subsistema de observabilidade NATIVO onde:
- Métricas, traces e logs são coletados, armazenados e consultados dentro do próprio CloudBuilder
- Dashboards são renderizados nativamente no frontend React
- Alertas são avaliados in-process
- Tudo roda sobre PostgreSQL + Spring Boot + React — sem dependências externas de observabilidade

## Stack Atual Relevante
- **Backend**: Java 21 + Spring Boot 3.4.4 + Spring Modulith + Micrometer (via Actuator)
- **Frontend**: React 19 + Recharts ^3.8.1 (já no package.json, nunca usado) + Tailwind + lucide-react
- **Banco**: PostgreSQL 16
- **Cache**: Caffeine (substituiu Redis)
- **Streaming**: Nenhum (Kafka removido no cleanup)
- **Multitenancy**: TenantContext (ThreadLocal) + TenantFilter + X-Tenant-Id header

## Problema
Construir um subsistema de observabilidade completo que substitua Prometheus, Grafana, OpenTelemetry, Datadog e ELK por componentes nativos do CloudBuilder, usando apenas PostgreSQL como backend de armazenamento.

### Requisitos Funcionais
1. **Métricas**: Coletar métricas de domínio (canvases criados, deploys, drift) e de recursos (CPU, memória, latência) em tempo real, com armazenamento e consulta agregada
2. **Tracing**: Capturar traces distribuídos de requisições HTTP entre serviços, com suporte a spans e propagação de contexto
3. **Logs**: Armazenar logs estruturados com busca textual e filtros
4. **Alertas**: Avaliar regras de alerta contra métricas com notificações (webhook, email)
5. **SLO/SLI**: Calcular indicadores de nível de serviço com error budget
6. **Dashboards**: Exibir métricas em tempo real com gráficos (Recharts) no frontend
7. **Service Map**: Mapear dependências entre serviços com status de saúde
8. **Scorecards**: Avaliar maturidade da arquitetura (já implementado)
9. **Multi-tenant**: Isolamento completo por tenantId

### Restrições
- Sem OpenTelemetry SDK, Prometheus, Grafana, Datadog, ELK
- PostgreSQL como único backend de observabilidade (sem TSDB separado)
- Zero novas dependências externas — apenas Spring Boot + React + Recharts
- Multi-tenant com tenantId em todas as tabelas
- UI em PT-BR

## Alternativas Consideradas

### Alternativa A — OpenTelemetry + Prometheus + Grafana (Status Quo Ante)
**Descrição**: Manter a stack CNCF tradicional com OTel Collector, Prometheus e Grafana.
**Prós**: Padrão da indústria, vasto ecossistema, dashboards prontos, baixo esforço de implementação.
**Contras**: 
- 3 serviços adicionais para operar (OTel Collector, Prometheus, Grafana)
- Complexidade operacional (retention, scaling, backup)
- Dados saem do contexto do CloudBuilder (URL externa do Grafana)
- UX quebrada — usuário precisa alternar entre CloudBuilder e Grafana
- Custo de infraestrutura
- Contradiz a proposta do sistema ("platform engineering tudo-em-um")

### Alternativa B — TimescaleDB + Grafana Embed
**Descrição**: Usar TimescaleDB (PostgreSQL + extensão time-series) como backend e embed Grafana via iframe.
**Prós**: PostgreSQL compatível, time-series otimizado, Grafana ainda viável.
**Contras**:
- TimescaleDB é extensão paga para recursos avançados
- Grafana embed ainda é UX bifurcada
- Complexidade operacional do Grafana persiste
- Dependência externa (TimescaleDB)

### Alternativa C — Native Observability (ESCOLHIDA)
**Descrição**: Construir tudo nativamente no CloudBuilder usando PostgreSQL para armazenamento time-series, Spring AOP para instrumentação, React + Recharts para dashboards.
**Prós**:
- Zero dependências externas de observabilidade
- UX unificada — tudo dentro do CloudBuilder
- Controle total sobre esquemas, retenção, alertas
- Alinhado com a proposta do produto
- Conhecimento do time (Java + React) sem novas curvas de aprendizado
**Contras**:
- Maior esforço de implementação inicial
- PostgreSQL para time-series tem limites de escala (~10M metrics/min antes de precisar de tuning)
- Precisa construir componentes de dashboard do zero
- Funcionalidades avançadas (anomaly detection, flame graphs) são mais trabalhosas

## Decisão
**Adotar Alternativa C — Native Observability Subsystem**, construído em 4 fases incrementais, cada uma entregando valor independente.

## Arquitetura Detalhada

### Visão Geral do Subsistema

```
┌──────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React 19)                          │
│  ┌─────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐│
│  │ Observe      │ │ Metrics  │ │ Traces   │ │ Logs             ││
│  │ Module       │ │ Dashboard│ │ Explorer │ │ Viewer           ││
│  │ (Tabs)       │ │ (Rechart)│ │ (Rechart)│ │ (Search + Filter)││
│  └──────┬───────┘ └────┬─────┘ └────┬─────┘ └───────┬──────────┘│
│         └──────────────┴────────────┴───────────────┘            │
│                           │ SSE Stream                           │
│                    ┌──────┴──────┐                                │
│                    │  SSE Client │                                │
│                    └─────────────┘                                │
└──────────────────────────┬───────────────────────────────────────┘
                           │ HTTPS + SSE
┌──────────────────────────▼───────────────────────────────────────┐
│                     BACKEND (Spring Boot)                         │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │              observability Modulith Module                │    │
│  │  ┌──────────┐ ┌──────────┐ ┌────────┐ ┌──────────────┐  │    │
│  │  │ Metrics  │ │  Trace   │ │  Log   │ │    Alert     │  │    │
│  │  │ Engine   │ │  Engine  │ │ Engine │ │    Engine    │  │    │
│  │  └────┬─────┘ └────┬─────┘ └───┬────┘ └──────┬───────┘  │    │
│  │       │            │           │              │          │    │
│  │  ┌────▼────────────▼───────────▼──────────────▼───────┐  │    │
│  │  │           PostgreSQL Time-Series Storage           │  │    │
│  │  │  (metrics_ts, traces, spans, logs, alert_rules)    │  │    │
│  │  └────────────────────────────────────────────────────┘  │    │
│  │                                                           │    │
│  │  ┌────────────────────────────────────────────────────┐  │    │
│  │  │  Cross-cutting: MetricsInterceptor (AOP)           │  │    │
│  │  │                  TraceInterceptor (AOP)            │  │    │
│  │  │                  TraceContextFilter (HTTP)         │  │    │
│  │  │                  PostgresLogAppender (async)       │  │    │
│  │  └────────────────────────────────────────────────────┘  │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │              shared/monitoring (CustomMetrics)            │    │
│  │  Micrometer MeterRegistry → MetricsEngine.persist()      │    │
│  └──────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

### 1. Metrics Engine

#### Coleta
- **Micrometer MeterRegistry** (já existente em `CustomMetrics.java`) continua sendo a API de métricas
- **MetricsInterceptor** (Spring AOP `@Around`) captura automaticamente:
  - `@Timed` — timing de métodos (latência P50/P95/P99)
  - `@Counted` — contagem de operações
  - Métricas de negócio via `CustomMetrics.recordXxx()` (já implementado)
- A diferença: em vez de exportar via `/actuator/prometheus`, as métricas são **persistidas no PostgreSQL** via `MetricsService.record()`

#### Armazenamento (PostgreSQL)

```sql
-- Tabela principal de séries temporais (particionada por mês)
CREATE TABLE metrics_ts (
    id          UUID DEFAULT gen_random_uuid(),
    tenant_id   VARCHAR(64) NOT NULL,
    metric_name VARCHAR(128) NOT NULL,  -- e.g. "cloudbuilder.canvas.created"
    tags        JSONB DEFAULT '{}',     -- e.g. {"environment": "prod", "provider": "aws"}
    value       DOUBLE PRECISION NOT NULL,
    timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (timestamp, id)
) PARTITION BY RANGE (timestamp);

-- Partições mensais
CREATE TABLE metrics_ts_2026_06 PARTITION OF metrics_ts
    FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE metrics_ts_2026_07 PARTITION OF metrics_ts
    FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');

-- Índices
CREATE INDEX idx_metrics_tenant_name_ts ON metrics_ts (tenant_id, metric_name, timestamp DESC);
CREATE INDEX idx_metrics_tags ON metrics_ts USING GIN (tags);
```

#### Consulta

```sql
-- Média de latência P95 por serviço na última hora
SELECT metric_name,
       percentile_cont(0.95) WITHIN GROUP (ORDER BY value) AS p95
FROM metrics_ts
WHERE tenant_id = ?
  AND metric_name LIKE 'cloudbuilder.api.%.latency'
  AND timestamp >= NOW() - INTERVAL '1 hour'
GROUP BY metric_name;
```

#### API REST
| Método | Path | Descrição |
|--------|------|-----------|
| `GET` | `/api/v1/metrics/query` | Consulta métricas com agregação |
| `GET` | `/api/v1/metrics/stream` | SSE stream de métricas em tempo real (existente) |
| `POST` | `/api/v1/metrics/record` | Ingestão de métricas (para agentes Go) |

### 2. Tracing Engine

#### Instrumentação
- **TraceInterceptor** (Spring AOP `@Around`): 
  - Gera `traceId` (UUID) e `spanId` para cada requisição HTTP
  - Propaga via `TraceContext` (ThreadLocal + HTTP headers `X-Trace-Id`, `X-Span-Id`, `X-Parent-Span-Id`)
  - Captura: método, duração, status code, erro
- **TraceContextFilter** (`OncePerRequestFilter`):
  - Extrai traceId do header ou gera novo
  - Coloca no `TraceContext` (ThreadLocal similar ao `TenantContext`)
  - Adiciona `X-Trace-Id` no response
  - Limpa no `finally`

#### Armazenamento

```sql
CREATE TABLE traces (
    id           UUID DEFAULT gen_random_uuid(),
    trace_id     VARCHAR(32) NOT NULL,
    tenant_id    VARCHAR(64) NOT NULL,
    service_name VARCHAR(128) NOT NULL,
    operation    VARCHAR(256) NOT NULL,
    start_time   TIMESTAMPTZ NOT NULL,
    duration_ms  INTEGER NOT NULL,
    status_code  INTEGER NOT NULL,
    is_error     BOOLEAN DEFAULT FALSE,
    metadata     JSONB DEFAULT '{}',
    PRIMARY KEY (start_time, id)
) PARTITION BY RANGE (start_time);

CREATE TABLE spans (
    id              UUID DEFAULT gen_random_uuid(),
    trace_id        VARCHAR(32) NOT NULL,
    span_id         VARCHAR(16) NOT NULL,
    parent_span_id  VARCHAR(16),
    tenant_id       VARCHAR(64) NOT NULL,
    service_name    VARCHAR(128) NOT NULL,
    operation       VARCHAR(256) NOT NULL,
    start_time      TIMESTAMPTZ NOT NULL,
    duration_ms     INTEGER NOT NULL,
    status_code     INTEGER,
    status          VARCHAR(16),
    tags            JSONB DEFAULT '{}',
    PRIMARY KEY (start_time, id)
) PARTITION BY RANGE (start_time);

CREATE INDEX idx_traces_tenant_id ON traces (tenant_id, trace_id);
CREATE INDEX idx_spans_trace ON spans (trace_id);
CREATE INDEX idx_traces_error ON traces (tenant_id, is_error, start_time DESC);
```

#### API REST
| Método | Path | Descrição |
|--------|------|-----------|
| `GET` | `/api/v1/traces` | Lista traces com filtros |
| `GET` | `/api/v1/traces/{traceId}` | Detalhe do trace com spans |
| `GET` | `/api/v1/traces/stream` | SSE stream de traces recentes |
| `GET` | `/api/v1/traces/errors` | Traces com erro (filtro rápido) |

### 3. Logging Engine

#### Coleta
- **PostgresLogAppender** (implementa `ch.qos.logback.core.Appender`):
  - Buffer assíncrono (ArrayBlockingQueue de 10.000 entries)
  - Writer thread faz batch inserts a cada 500ms ou 100 entries
  - Fallback para stdout se PostgreSQL estiver indisponível

#### Armazenamento

```sql
CREATE TABLE logs (
    id           UUID DEFAULT gen_random_uuid(),
    tenant_id    VARCHAR(64) NOT NULL,
    timestamp    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    level        VARCHAR(16) NOT NULL,    -- DEBUG, INFO, WARN, ERROR
    logger_name  VARCHAR(256) NOT NULL,
    thread_name  VARCHAR(128),
    message      TEXT NOT NULL,
    trace_id     VARCHAR(32),
    span_id      VARCHAR(16),
    stack_trace  TEXT,
    structured   JSONB DEFAULT '{}',      -- campos estruturados adicionais
    PRIMARY KEY (timestamp, id)
) PARTITION BY RANGE (timestamp);

CREATE INDEX idx_logs_level ON logs (tenant_id, level, timestamp DESC);
CREATE INDEX idx_logs_fts ON logs USING GIN (to_tsvector('portuguese', message));
CREATE INDEX idx_logs_trace ON logs (trace_id);
```

#### API REST
| Método | Path | Descrição |
|--------|------|-----------|
| `GET` | `/api/v1/logs` | Busca logs com filtros |
| `GET` | `/api/v1/logs/stream` | SSE stream de logs em tempo real |

### 4. Alerting Engine

#### Regras de Alerta

```sql
CREATE TABLE alert_rules (
    id              UUID DEFAULT gen_random_uuid(),
    tenant_id       VARCHAR(64) NOT NULL,
    name            VARCHAR(128) NOT NULL,
    description     TEXT,
    metric_name     VARCHAR(128) NOT NULL,  -- qual métrica avaliar
    condition       VARCHAR(16) NOT NULL,    -- "gt", "lt", "gte", "lte", "eq"
    threshold       DOUBLE PRECISION NOT NULL,
    duration_sec    INTEGER NOT NULL,        -- quanto tempo sustentar antes de alertar
    severity        VARCHAR(16) NOT NULL,    -- "info", "warning", "critical"
    enabled         BOOLEAN DEFAULT TRUE,
    notify_channels JSONB DEFAULT '[]',      -- lista de channel IDs
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, name)
);

CREATE TABLE alert_rule_evaluations (
    id              UUID DEFAULT gen_random_uuid(),
    alert_rule_id   UUID NOT NULL REFERENCES alert_rules(id),
    tenant_id       VARCHAR(64) NOT NULL,
    evaluated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_value   DOUBLE PRECISION,
    threshold       DOUBLE PRECISION,
    breached        BOOLEAN NOT NULL,
    PRIMARY KEY (evaluated_at, id)
) PARTITION BY RANGE (evaluated_at);
```

#### Avaliação
- **AlertEvaluationService** com `@Scheduled(fixedRate = 30000)` — a cada 30s
- Para cada regra habilitada: consulta métrica → compara threshold → se breach sustentado por `duration_sec` → cria Incident
- Deduplicação: se incidente já existe com status `OPEN` para mesma regra, não recria
- Escalação: se incidente não for acknowledged em 15min → sobe severidade

#### Incident Lifecycle

```sql
CREATE TABLE incidents (
    id              UUID DEFAULT gen_random_uuid(),
    alert_rule_id   UUID REFERENCES alert_rules(id),
    tenant_id       VARCHAR(64) NOT NULL,
    title           VARCHAR(256) NOT NULL,
    description     TEXT,
    severity        VARCHAR(16) NOT NULL,
    status          VARCHAR(16) NOT NULL DEFAULT 'OPEN',  -- OPEN, ACKNOWLEDGED, RESOLVED
    current_value   DOUBLE PRECISION,
    threshold       DOUBLE PRECISION,
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ,
    resolved_at     TIMESTAMPTZ,
    UNIQUE (alert_rule_id, status) WHERE status = 'OPEN'
);

CREATE TABLE incident_timeline (
    id          UUID DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES incidents(id),
    event_type  VARCHAR(32) NOT NULL,  -- CREATED, ACKNOWLEDGED, NOTE, ESCALATED, RESOLVED
    description TEXT,
    created_by  VARCHAR(128),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notification_channels (
    id        UUID DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(64) NOT NULL,
    name      VARCHAR(128) NOT NULL,
    type      VARCHAR(32) NOT NULL,     -- "email", "webhook", "slack"
    config    JSONB NOT NULL,           -- {"url": "...", "secret": "..."}
    enabled   BOOLEAN DEFAULT TRUE,
    UNIQUE (tenant_id, name)
);
```

#### API REST
| Método | Path | Descrição |
|--------|------|-----------|
| `GET/POST/PUT/DELETE` | `/api/v1/alert-rules` | CRUD de regras |
| `GET` | `/api/v1/alert-rules/{id}/evaluations` | Histórico de avaliações |
| `GET/POST` | `/api/v1/incidents` | Lista/cria incidentes |
| `POST` | `/api/v1/incidents/{id}/acknowledge` | Reconhecer incidente |
| `POST` | `/api/v1/incidents/{id}/resolve` | Resolver incidente |
| `GET/POST` | `/api/v1/notification-channels` | CRUD de canais |

### 5. SLO/SLI Engine

```sql
CREATE TABLE slo_definitions (
    id              UUID DEFAULT gen_random_uuid(),
    tenant_id       VARCHAR(64) NOT NULL,
    name            VARCHAR(128) NOT NULL,
    description     TEXT,
    sli_type        VARCHAR(32) NOT NULL,     -- "latency", "availability", "error_rate", "custom"
    metric_name     VARCHAR(128) NOT NULL,    -- métrica base para o SLI
    target_pct      DOUBLE PRECISION NOT NULL, -- e.g. 99.9
    window_days     INTEGER NOT NULL DEFAULT 30,
    enabled         BOOLEAN DEFAULT TRUE,
    UNIQUE (tenant_id, name)
);

CREATE TABLE sli_snapshots (
    id              UUID DEFAULT gen_random_uuid(),
    slo_id          UUID NOT NULL REFERENCES slo_definitions(id),
    tenant_id       VARCHAR(64) NOT NULL,
    window_start    TIMESTAMPTZ NOT NULL,
    window_end      TIMESTAMPTZ NOT NULL,
    good_count      BIGINT NOT NULL,
    total_count     BIGINT NOT NULL,
    sli_pct         DOUBLE PRECISION NOT NULL, -- good_count / total_count * 100
    error_budget_pct DOUBLE PRECISION,         -- quanto do budget foi consumido
    computed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 6. Dashboard Engine (Frontend)

#### Component Tree

```
ObserveModule (Tabs container)
├── HealthView          → Métricas em tempo real (Recharts LineChart)
├── ServiceMapView      → ReactFlow service map (existente)
├── MetricsDashboard    → Grid de gráficos Recharts (NOVO)
│   ├── TimeRangeSelector
│   ├── Chart (LineChart, AreaChart, BarChart)
│   ├── MetricsGrid (CPU, Memory, Network, Disk)
│   └── Auto-refresh via SSE
├── TraceExplorer       → Lista de traces + detalhes (NOVO)
├── LogViewer            → Busca textual + filtros (NOVO)
├── AlertRulesView      → CRUD de regras (NOVO)
├── IncidentsView       → Incidentes ativos/histórico (NOVO)
├── SloDashboard        → SLO status + error budget (NOVO)
├── DriftDetection      → Existente
├── ScorecardView       → Existente
└── DisasterRecovery    → Existente
```

#### SSE Client Hook
```typescript
// hooks/useSSE.ts — novo hook genérico
function useSSE<T>(url: string, eventName: string): {
  data: T | null;
  connected: boolean;
  error: string | null;
}
```

#### Chart Component (Recharts)
```typescript
// components/ui/chart.tsx — novo (shadcn/ui style)
<ChartContainer config={metricConfig}>
  <LineChart data={metrics}>
    <XAxis dataKey="timestamp" />
    <YAxis />
    <Tooltip />
    <Line type="monotone" dataKey="value" stroke="#ccff00" />
  </LineChart>
</ChartContainer>
```

### 7. Integração com Módulos Existentes

#### CustomMetrics → MetricsEngine
O `CustomMetrics.java` atual usa Micrometer `MeterRegistry` e expõe em `/actuator/prometheus`. A migração:

```java
// Novo: CustomMetrics persiste no PostgreSQL via MetricsService
@Component
public class CustomMetrics {
    private final MetricsService metricsService;
    
    public void recordCanvasCreated() {
        metricsService.record("cloudbuilder.canvas.created", 1,
            Tags.of("tenant", TenantContext.getTenantId()));
    }
}
```

O Micrometer ainda pode ser usado em paralelo durante a migração (dual-write), mas o Prometheus exporter será desabilitado.

#### ObserveModule → Unificado
O módulo `observe` atual (Alert, ServiceHealth, HealthCheckService) continua existindo como subdomínio do `observability` — health checks manuais ainda são válidos. A diferença é que agora eles alimentam as mesmas tabelas de métricas.

## Schema PostgreSQL Completo

```sql
-- ============================================================
-- Native Observability Schema for CloudBuilder
-- ============================================================

-- Extension for UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── 1. Metrics ─────────────────────────────────────────────

CREATE TABLE metrics_ts (
    id          UUID DEFAULT gen_random_uuid(),
    tenant_id   VARCHAR(64) NOT NULL,
    metric_name VARCHAR(128) NOT NULL,
    tags        JSONB DEFAULT '{}',
    value       DOUBLE PRECISION NOT NULL,
    timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (timestamp, id)
) PARTITION BY RANGE (timestamp);

CREATE INDEX idx_metrics_lookup ON metrics_ts (tenant_id, metric_name, timestamp DESC);
CREATE INDEX idx_metrics_tags ON metrics_ts USING GIN (tags);

-- ── 2. Traces & Spans ──────────────────────────────────────

CREATE TABLE traces (
    id           UUID DEFAULT gen_random_uuid(),
    trace_id     VARCHAR(32) NOT NULL,
    tenant_id    VARCHAR(64) NOT NULL,
    service_name VARCHAR(128) NOT NULL,
    operation    VARCHAR(256) NOT NULL,
    start_time   TIMESTAMPTZ NOT NULL,
    duration_ms  INTEGER NOT NULL,
    status_code  INTEGER NOT NULL,
    is_error     BOOLEAN DEFAULT FALSE,
    metadata     JSONB DEFAULT '{}',
    PRIMARY KEY (start_time, id)
) PARTITION BY RANGE (start_time);

CREATE TABLE spans (
    id              UUID DEFAULT gen_random_uuid(),
    trace_id        VARCHAR(32) NOT NULL,
    span_id         VARCHAR(16) NOT NULL,
    parent_span_id  VARCHAR(16),
    tenant_id       VARCHAR(64) NOT NULL,
    service_name    VARCHAR(128) NOT NULL,
    operation       VARCHAR(256) NOT NULL,
    start_time      TIMESTAMPTZ NOT NULL,
    duration_ms     INTEGER NOT NULL,
    status_code     INTEGER,
    status          VARCHAR(16),
    tags            JSONB DEFAULT '{}',
    PRIMARY KEY (start_time, id)
) PARTITION BY RANGE (start_time);

CREATE INDEX idx_traces_tenant ON traces (tenant_id, trace_id);
CREATE INDEX idx_traces_error ON traces (tenant_id, is_error, start_time DESC);
CREATE INDEX idx_spans_trace ON spans (trace_id);

-- ── 3. Logs ────────────────────────────────────────────────

CREATE TABLE logs (
    id           UUID DEFAULT gen_random_uuid(),
    tenant_id    VARCHAR(64) NOT NULL,
    timestamp    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    level        VARCHAR(16) NOT NULL,
    logger_name  VARCHAR(256) NOT NULL,
    thread_name  VARCHAR(128),
    message      TEXT NOT NULL,
    trace_id     VARCHAR(32),
    span_id      VARCHAR(16),
    stack_trace  TEXT,
    structured   JSONB DEFAULT '{}',
    PRIMARY KEY (timestamp, id)
) PARTITION BY RANGE (timestamp);

CREATE INDEX idx_logs_lookup ON logs (tenant_id, timestamp DESC);
CREATE INDEX idx_logs_level ON logs (tenant_id, level, timestamp DESC);
CREATE INDEX idx_logs_fts ON logs USING GIN (to_tsvector('portuguese', message));

-- ── 4. Alert Rules & Incidents ─────────────────────────────

CREATE TABLE alert_rules (
    id              UUID DEFAULT gen_random_uuid(),
    tenant_id       VARCHAR(64) NOT NULL,
    name            VARCHAR(128) NOT NULL,
    description     TEXT,
    metric_name     VARCHAR(128) NOT NULL,
    condition       VARCHAR(16) NOT NULL,
    threshold       DOUBLE PRECISION NOT NULL,
    duration_sec    INTEGER NOT NULL DEFAULT 0,
    severity        VARCHAR(16) NOT NULL,
    enabled         BOOLEAN DEFAULT TRUE,
    notify_channels JSONB DEFAULT '[]',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, name)
);

CREATE TABLE alert_rule_evaluations (
    id              UUID DEFAULT gen_random_uuid(),
    alert_rule_id   UUID NOT NULL REFERENCES alert_rules(id),
    tenant_id       VARCHAR(64) NOT NULL,
    evaluated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_value   DOUBLE PRECISION,
    threshold       DOUBLE PRECISION,
    breached        BOOLEAN NOT NULL,
    PRIMARY KEY (evaluated_at, id)
) PARTITION BY RANGE (evaluated_at);

CREATE TABLE incidents (
    id              UUID DEFAULT gen_random_uuid(),
    alert_rule_id   UUID REFERENCES alert_rules(id),
    tenant_id       VARCHAR(64) NOT NULL,
    title           VARCHAR(256) NOT NULL,
    description     TEXT,
    severity        VARCHAR(16) NOT NULL,
    status          VARCHAR(16) NOT NULL DEFAULT 'OPEN',
    current_value   DOUBLE PRECISION,
    threshold       DOUBLE PRECISION,
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ,
    resolved_at     TIMESTAMPTZ,
    UNIQUE (alert_rule_id, status) WHERE status = 'OPEN'
);

CREATE TABLE incident_timeline (
    id          UUID DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES incidents(id),
    event_type  VARCHAR(32) NOT NULL,
    description TEXT,
    created_by  VARCHAR(128),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 5. Notification Channels ───────────────────────────────

CREATE TABLE notification_channels (
    id        UUID DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(64) NOT NULL,
    name      VARCHAR(128) NOT NULL,
    type      VARCHAR(32) NOT NULL,
    config    JSONB NOT NULL,
    enabled   BOOLEAN DEFAULT TRUE,
    UNIQUE (tenant_id, name)
);

-- ── 6. SLO Definitions ─────────────────────────────────────

CREATE TABLE slo_definitions (
    id              UUID DEFAULT gen_random_uuid(),
    tenant_id       VARCHAR(64) NOT NULL,
    name            VARCHAR(128) NOT NULL,
    description     TEXT,
    sli_type        VARCHAR(32) NOT NULL,
    metric_name     VARCHAR(128) NOT NULL,
    target_pct      DOUBLE PRECISION NOT NULL,
    window_days     INTEGER NOT NULL DEFAULT 30,
    enabled         BOOLEAN DEFAULT TRUE,
    UNIQUE (tenant_id, name)
);

CREATE TABLE sli_snapshots (
    id              UUID DEFAULT gen_random_uuid(),
    slo_id          UUID NOT NULL REFERENCES slo_definitions(id),
    tenant_id       VARCHAR(64) NOT NULL,
    window_start    TIMESTAMPTZ NOT NULL,
    window_end      TIMESTAMPTZ NOT NULL,
    good_count      BIGINT NOT NULL,
    total_count     BIGINT NOT NULL,
    sli_pct         DOUBLE PRECISION NOT NULL,
    error_budget_pct DOUBLE PRECISION,
    computed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 7. Dashboard Definitions ───────────────────────────────

CREATE TABLE dashboards (
    id          UUID DEFAULT gen_random_uuid(),
    tenant_id   VARCHAR(64) NOT NULL,
    name        VARCHAR(128) NOT NULL,
    description TEXT,
    definition  JSONB NOT NULL,  -- layout e widgets
    is_default  BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, name)
);
```

## Estratégia de Partição e Retenção

| Tabela | Partition Key | Intervalo | Retenção |
|--------|--------------|-----------|----------|
| `metrics_ts` | `timestamp` | Mensal | 6 meses |
| `traces` | `start_time` | Diário | 7 dias |
| `spans` | `start_time` | Diário | 7 dias |
| `logs` | `timestamp` | Diário | 30 dias |
| `alert_rule_evaluations` | `evaluated_at` | Mensal | 3 meses |

**Gerenciamento de partições**: Script SQL mensal (`maintenance.sql`) com `DROP TABLE IF EXISTS` para partições expiradas.

## Plano de Implementação (4 Fases)

### Fase 1 — Foundation (Sprint 1-2)
**Esforço**: ~5 dias-homem
**Entrega**: Métricas reais + tracing básico

1. Criar schema PostgreSQL (`observability/`)
2. Migrar `CustomMetrics.java` para persistir no PostgreSQL via `MetricsService`
3. Criar `MetricsInterceptor` (AOP) para captura automática de métricas HTTP
4. Criar `TraceInterceptor` + `TraceContextFilter` para tracing
5. Substituir mock `MetricsService` por real
6. Substituir mock `APMController` por `TraceController`
7. Criar endpoints `GET /api/v1/metrics/query` e `GET /api/v1/traces`
8. Criar hook `useSSE` no frontend
9. Adicionar `ChartContainer` + `chart.tsx` shadcn-style component
10. Atualizar `ObserveModule` com abas Metrics + Traces

### Fase 2 — Alerting (Sprint 3-4)
**Esforço**: ~4 dias-homem
**Entrega**: Alertas + SLO/SLI

1. Criar entidades `AlertRule`, `AlertRuleEvaluation`, `Incident`, `SloDefinition`
2. Criar `AlertEvaluationService` com `@Scheduled`
3. Criar `SloComputationService` com `@Scheduled`
4. Criar controllers REST para alertas, incidentes, SLOs
5. Criar `NotificationService` com webhook + email
6. Adicionar abas Alertas + SLO no frontend

### Fase 3 — Logging (Sprint 5-6)
**Esforço**: ~3 dias-homem
**Entrega**: Coleta e busca de logs

1. Criar entidade `LogEntry`
2. Criar `PostgresLogAppender` (Logback appender assíncrono)
3. Criar controller `POST /api/v1/logs/ingest` + `GET /api/v1/logs`
4. Criar `LogViewer` no frontend com busca full-text
5. Integrar traceId nos logs

### Fase 4 — Dashboards (Sprint 7-8)
**Esforço**: ~4 dias-homem
**Entrega**: Custom dashboards + refinamentos

1. Criar entidade `Dashboard`
2. Criar `DashboardService` + controller
3. Construir dashboard builder no frontend
4. Adicionar time-range control, auto-refresh, drill-down
5. Performance tuning das queries PostgreSQL
6. Remover código mock antigo (APMController, MetricsService mock data)

## Consequências

### Positivas
- Zero dependências externas de observabilidade
- UX unificada — tudo no CloudBuilder
- Controle total sobre retenção, schemas, alertas
- Alinhamento com a visão do produto
- Custo de infraestrutura reduzido (sem Prometheus/Grafana/OTel)
- Mais simples de operar (só PostgreSQL)

### Negativas
- Esforço de implementação significativo (~16 dias-homem total)
- PostgreSQL para time-series tem limites: ~10M metrics/min antes de precisar de tuning
- Funcionalidades avançadas (anomaly detection, flame graphs) precisam ser construídas
- Perde ecossistema de plugins do Grafana
- Perde integração com padrão OpenTelemetry (vendor lock-in leve)

### Riscos
- **Performance**: Consultas de séries temporais em tabelas grandes precisam de monitoramento
- **Mitigação**: BRIN indexes, partition pruning, materialized views para agregações
- **Retenção**: Sem gerenciamento automático de partições, disco pode encher
- **Mitigação**: Script de manutenção mensal + alarme de disco
- **Regressão**: Código mock existente pode ser removido antes do real estar pronto
- **Mitigação**: Dual-write durante migração (Micrometer + PostgreSQL)

## Referências
- [Micrometer Documentation](https://micrometer.io/docs) — API de métricas
- [PostgreSQL Partitioning](https://www.postgresql.org/docs/16/ddl-partitioning.html) — Time-series partitioning
- [PostgreSQL BRIN Indexes](https://www.postgresql.org/docs/16/brin-intro.html) — Indexação para time-series
- [Spring AOP](https://docs.spring.io/spring-framework/reference/core/aop.html) — Interceptação de métodos
- [Recharts](https://recharts.org/) — Biblioteca de gráficos React
- [shadcn/ui Chart](https://ui.shadcn.com/docs/components/chart) — Componente chart baseado em Recharts
- [Google SRE Book](https://sre.google/books/) — SLI/SLO/Error Budget patterns
- [Netflix Tech Blog — Distributed Tracing](https://netflixtechblog.com/) — Tracing patterns
