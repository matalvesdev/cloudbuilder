# CloudBuilder Observe — Módulo 03

## Epic

Como SRE/platform engineer, quero monitorar recursos provisionados através do CloudBuilder, coletar métricas, logs e traces via OpenTelemetry, e visualizar dashboards integrados ao design original da infraestrutura.

## Features

| ID | Feature | Descrição |
|----|---------|-----------|
| F-01 | Metrics Collection | Coleta de métricas via OpenTelemetry + Prometheus |
| F-02 | Log Aggregation | Agregação e busca de logs estruturados |
| F-03 | Distributed Tracing | Tracing distribuído via OpenTelemetry |
| F-04 | Dashboard Builder | Criação de dashboards visuais |
| F-05 | Alerting | Sistema de alertas com severidade e notificações |
| F-06 | SLO/SLI Tracking | Rastreamento de SLOs e SLIs |
| F-07 | Incident Management | Gerenciamento de incidentes integrado |
| F-08 | Resource Topology | Mapa topológico de recursos com status |

## User Stories

**US-01**: Visualizar métricas em tempo real de recursos no canvas.
**US-02**: Buscar logs com filtros por recurso, severidade, timestamp.
**US-03**: Ver trace de uma requisição atravessando múltiplos serviços.
**US-04**: Criar dashboard customizado com widgets drag-and-drop.
**US-05**: Configurar alerta quando CPU > 80% por 5min.
**US-06**: Rastrear SLO de 99.9% para serviço crítico.

## API Contracts

```
POST /api/v1/metrics/query              → PromQL query
GET  /api/v1/metrics/series             → List metric series
POST /api/v1/logs/search                → Search logs
POST /api/v1/traces/search              → Search traces
GET  /api/v1/traces/{traceId}           → Get trace detail
GET  /api/v1/dashboards                 → List dashboards
POST /api/v1/dashboards                 → Create dashboard
PUT  /api/v1/dashboards/{id}            → Update dashboard
POST /api/v1/alerts                     → Create alert rule
GET  /api/v1/alerts                     → List alert rules
GET  /api/v1/alerts/firing              → List firing alerts
POST /api/v1/slos                       → Create SLO
GET  /api/v1/slos                       → List SLOs
POST /api/v1/incidents                  → Create incident
GET  /api/v1/incidents                  → List incidents
```

## Database Model

```sql
CREATE TABLE dashboards (
    id UUID PRIMARY KEY, tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL, description TEXT,
    widgets JSONB NOT NULL, created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL, created_by UUID NOT NULL
);

CREATE TABLE alert_rules (
    id UUID PRIMARY KEY, tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL, query TEXT NOT NULL,
    condition VARCHAR(50) NOT NULL, threshold DOUBLE PRECISION NOT NULL,
    duration INT NOT NULL, severity VARCHAR(20) NOT NULL,
    notification_channels TEXT[], enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE firing_alerts (
    id UUID PRIMARY KEY, alert_rule_id UUID NOT NULL REFERENCES alert_rules(id),
    resource_id UUID, status VARCHAR(20) NOT NULL,
    started_at TIMESTAMPTZ NOT NULL, resolved_at TIMESTAMPTZ,
    details JSONB
);

CREATE TABLE slos (
    id UUID PRIMARY KEY, tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL, description TEXT,
    target DOUBLE PRECISION NOT NULL, window_days INT NOT NULL,
    sli_query TEXT NOT NULL, current_burn_rate DOUBLE PRECISION,
    created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE incidents (
    id UUID PRIMARY KEY, tenant_id UUID NOT NULL,
    title VARCHAR(500) NOT NULL, severity VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    resource_id UUID, alert_id UUID,
    root_cause TEXT, timeline JSONB,
    acknowledged_at TIMESTAMPTZ, resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ NOT NULL,
    created_by UUID
);

CREATE TABLE incident_events (
    id UUID PRIMARY KEY, incident_id UUID NOT NULL REFERENCES incidents(id),
    event_type VARCHAR(100) NOT NULL, details JSONB,
    actor_id UUID, timestamp TIMESTAMPTZ NOT NULL
);
```

## OpenTelemetry Integration

- **Instrumentation**: All Java services auto-instrumented with OpenTelemetry Java Agent
- **Export**: OTLP gRPC → OpenTelemetry Collector
- **Processing**: Collector processes (batch, filter, enrich, sample)
- **Backend**: 
  - Metrics → Prometheus (remote write)
  - Traces → Tempo (or OTLP-native backend)
  - Logs → Loki (or OTLP-native backend)
- **Visualization**: Grafana dashboards (or embedded Grafana panels)

```
┌────────────┐    OTLP    ┌──────────────┐
│  Service A ├───────────►│  OpenTelemetry│
│  (Java)    │            │  Collector    │
└────────────┘            └──────┬───────┘
┌────────────┐    OTLP           │
│  Service B ├───────────►       │
│  (Java)    │                   │
└────────────┘            ┌──────┴───────┐
                          │  Processors  │
                          │  - Batch     │
                          │  - Filter    │
                          │  - Sampling  │
                          └──────┬───────┘
                                 │
              ┌──────────────────┼──────────────────┐
              ▼                  ▼                  ▼
       ┌───────────┐     ┌───────────┐     ┌───────────┐
       │ Prometheus │     │   Tempo   │     │   Loki    │
       │ (Metrics)  │     │  (Traces) │     │   (Logs)  │
       └───────────┘     └───────────┘     └───────────┘
              │                  │                  │
              └──────────────────┼──────────────────┘
                                 ▼
                          ┌───────────┐
                          │  Grafana  │
                          │ Dashboards│
                          └───────────┘
```
