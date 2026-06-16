# CloudBuilder AI — Módulo 06

## Epic

Como engenheiro de plataforma/SRE, quero análises de IA para identificar causa raiz de incidentes, recomendar otimizações de infraestrutura, e consultar minha infraestrutura em linguagem natural.

## Features

| ID | Feature | Descrição |
|----|---------|-----------|
| F-01 | Root Cause Analysis | Análise automática de causa raiz de incidentes |
| F-02 | Incident Classification | Classificação automática de incidentes por severidade/tipo |
| F-03 | Incident Summarization | Resumo automático de incidentes para post-mortem |
| F-04 | Cost Anomaly Investigation | Investigação automatizada de anomalias de custo |
| F-05 | Infrastructure Recommendations | Recomendações de arquitetura, segurança e performance |
| F-06 | Natural Language Query | Consulta de infraestrutura em linguagem natural |
| F-07 | Automated Remediation | Sugestões de remediação automatizada |
| F-08 | Security Analysis | Análise de vulnerabilidades na arquitetura |

## User Stories

**US-01**: Incidente dispara — IA analisa métricas/logs/traces e sugere causa raiz.
**US-02**: Post-mortem de incidente gerado automaticamente.
**US-03**: "Mostre todos recursos com custo > $1000/mês" — consulta em linguagem natural.
**US-04**: IA sugere mudança de instância EC2 com economia estimada.
**US-05**: IA detecta vulnerabilidade de segurança no design.

## API Contracts

```
POST /api/v1/ai/rca                    → Run RCA on incident
GET  /api/v1/ai/rca/{id}               → Get RCA results
POST /api/v1/ai/classify               → Classify incident
POST /api/v1/ai/summarize              → Summarize incident
GET  /api/v1/ai/recommendations        → Get infrastructure recommendations
POST /api/v1/ai/query                  → Natural language query
POST /api/v1/ai/analyze-security       → Security analysis of design
POST /api/v1/ai/remediate/{recommendationId} → Apply remediation
```

## Database Model

```sql
CREATE TABLE rca_results (
    id UUID PRIMARY KEY, incident_id UUID NOT NULL REFERENCES incidents(id),
    tenant_id UUID NOT NULL,
    root_cause TEXT NOT NULL, confidence DOUBLE PRECISION,
    evidence JSONB,   -- correlated metrics, logs, traces
    timeline JSONB, suggestions TEXT[],
    model_version VARCHAR(50), created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE ai_recommendations (
    id UUID PRIMARY KEY, tenant_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL,  -- COST, SECURITY, PERFORMANCE, ARCHITECTURE
    title VARCHAR(500) NOT NULL, description TEXT,
    resource_id UUID, design_id UUID,
    impact VARCHAR(50), effort VARCHAR(50),
    estimated_savings DECIMAL(12,2),
    auto_remediable BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'OPEN',
    applied_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE ai_queries (
    id UUID PRIMARY KEY, tenant_id UUID NOT NULL,
    query_text TEXT NOT NULL, intent VARCHAR(100),
    result JSONB, confidence DOUBLE PRECISION,
    feedback VARCHAR(20),  -- POSITIVE, NEGATIVE
    executed_at TIMESTAMPTZ NOT NULL,
    executed_by UUID NOT NULL
);

CREATE TABLE incident_classifications (
    id UUID PRIMARY KEY, incident_id UUID NOT NULL REFERENCES incidents(id),
    category VARCHAR(100), severity VARCHAR(20),
    patterns TEXT[], predicted_by VARCHAR(50),
    confidence DOUBLE PRECISION, created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE security_findings (
    id UUID PRIMARY KEY, tenant_id UUID NOT NULL,
    design_id UUID, resource_id UUID,
    finding_type VARCHAR(100), severity VARCHAR(20),
    title VARCHAR(500), description TEXT,
    remediation TEXT, cvss_score DOUBLE PRECISION,
    status VARCHAR(20) DEFAULT 'OPEN',
    created_at TIMESTAMPTZ NOT NULL, resolved_at TIMESTAMPTZ
);
```

## AI Service Architecture

```
┌─────────────────────────────┐
│     AIOps Module (Java)     │
│                             │
│  ┌───────────────────────┐  │
│  │   Incident Analysis   │  │
│  │   - Classifier         │  │
│  │   - Summarizer        │  │
│  │   - RCA Engine        │  │
│  └───────────┬───────────┘  │
│              │              │
│  ┌───────────▼───────────┐  │
│  │   Recommendation      │  │
│  │   Engine               │  │
│  └───────────┬───────────┘  │
│              │              │
│  ┌───────────▼───────────┐  │
│  │   NL Query Processor  │  │
│  └───────────┬───────────┘  │
│              │              │
│  ┌───────────▼───────────┐  │
│  │   Security Analyzer   │  │
│  └───────────────────────┘  │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│   LLM Adapter Layer          │
│   (OpenAI / Anthropic /      │
│    Local LLM)                │
│   - Prompt templates         │
│   - Context building         │
│   - Response parsing         │
└─────────────────────────────┘
```

## Prompt Engineering Strategy

| Use Case | Context Injected | Output Format |
|----------|-----------------|---------------|
| RCA | Incident timeline, metrics logs, traces, config changes | Root cause, evidence, timeline, suggestions |
| Classification | Incident title, description, metrics | Category, severity, patterns |
| Recommendations | Resource specs, usage metrics, cost data, alternatives | Title, description, savings, effort |
| NL Query | Schema of resources, current state | SQL or search query, formatted response |
| Security | Architecture design, component types, network config | Finding type, severity, remediation steps |
