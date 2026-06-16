# CloudBuilder Cost — Módulo 04

## Epic

Como FinOps analyst, quero rastrear custos de infraestrutura em tempo real, receber previsões e recomendações de otimização, e gerenciar orçamentos — tudo vinculado ao design visual da infraestrutura.

## Features

| ID | Feature | Descrição |
|----|---------|-----------|
| F-01 | Cost Explorer | Visualização de custos por recurso, ambiente, serviço, tag |
| F-02 | Real-Time Tracking | Rastreamento de custos em tempo real (streaming billing) |
| F-03 | Cost Forecasting | Previsão de custos com ML (próximos 3/6/12 meses) |
| F-04 | Budget Management | Criação e monitoramento de orçamentos |
| F-05 | Cost Anomaly Detection | Detecção automática de anomalias de custo |
| F-06 | Optimization Recommendations | Recomendações de redução de custo |
| F-07 | Right-Sizing | Sugestões de dimensionamento de recursos |
| F-08 | Reserved Instance Analysis | Análise de RI/Savings Plans |
| F-09 | Chargeback/Showback | Relatórios de alocação de custo por time/projeto |

## User Stories

**US-01**: Ver breakdown de custos por serviço (EC2, RDS, S3, etc.)
**US-02**: Comparar custo real vs. orçado no mês atual
**US-03**: Receber alerta quando custo projetado excede orçamento
**US-04**: Ver recomendação de right-sizing com economia projetada
**US-05**: Exportar relatório de chargeback para o time de plataforma

## API Contracts

```
GET  /api/v1/costs/current                 → Current month costs
GET  /api/v1/costs/history                 → Historical costs
GET  /api/v1/costs/by-resource             → Cost per resource
GET  /api/v1/costs/by-service              → Cost per service type
GET  /api/v1/costs/forecast                → Cost forecast
POST /api/v1/budgets                       → Create budget
GET  /api/v1/budgets                       → List budgets
GET  /api/v1/budgets/{id}/status           → Budget status
GET  /api/v1/recommendations               → List recommendations
POST /api/v1/recommendations/{id}/apply    → Apply recommendation
GET  /api/v1/anomalies                     → Current anomalies
GET  /api/v1/rightsizing                   → Right-sizing suggestions
GET  /api/v1/ri-analysis                   → Reserved instance analysis
GET  /api/v1/chargeback                    → Chargeback report
```

## Database Model

```sql
CREATE TABLE cost_entries (
    id UUID PRIMARY KEY, tenant_id UUID NOT NULL,
    resource_id UUID, service_type VARCHAR(100) NOT NULL,
    region VARCHAR(100), amount DECIMAL(12,4) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    usage_quantity DECIMAL(12,4), usage_unit VARCHAR(50),
    pricing_model VARCHAR(50),
    timestamp TIMESTAMPTZ NOT NULL,
    tags JSONB
) PARTITION BY RANGE (timestamp);

CREATE TABLE budgets (
    id UUID PRIMARY KEY, tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL, amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    period VARCHAR(20) NOT NULL DEFAULT 'MONTHLY',
    scope VARCHAR(50), scope_id UUID,
    alert_thresholds DOUBLE PRECISION[] DEFAULT '{80,90,100}',
    start_date DATE NOT NULL, end_date DATE,
    created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE cost_forecasts (
    id UUID PRIMARY KEY, tenant_id UUID NOT NULL,
    forecast_date DATE NOT NULL, amount DECIMAL(12,2) NOT NULL,
    confidence_lower DECIMAL(12,2), confidence_upper DECIMAL(12,2),
    model_version VARCHAR(50), generated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE cost_recommendations (
    id UUID PRIMARY KEY, tenant_id UUID NOT NULL,
    resource_id UUID, type VARCHAR(50) NOT NULL,
    title VARCHAR(500) NOT NULL, description TEXT,
    current_cost DECIMAL(12,2), projected_savings DECIMAL(12,2),
    effort VARCHAR(20), risk VARCHAR(20),
    status VARCHAR(20) DEFAULT 'OPEN',
    applied_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE cost_anomalies (
    id UUID PRIMARY KEY, tenant_id UUID NOT NULL,
    resource_id UUID, service_type VARCHAR(100),
    expected_cost DECIMAL(12,2), actual_cost DECIMAL(12,2),
    deviation_pct DECIMAL(5,2), severity VARCHAR(20),
    detected_at TIMESTAMPTZ NOT NULL, resolved_at TIMESTAMPTZ
);
```
