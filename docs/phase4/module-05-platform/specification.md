# CloudBuilder Platform — Módulo 05

## Epic

Como platform engineer, quero oferecer um Service Catalog com componentes padronizados e Golden Paths para que desenvolvedores possam auto-servir infraestrutura aprovada, com políticas de governança aplicadas automaticamente.

## Features

| ID | Feature | Descrição |
|----|---------|-----------|
| F-01 | Service Catalog | Catálogo de serviços de infraestrutura aprovados |
| F-02 | Golden Paths | Templates de arquitetura padronizados |
| F-03 | Scaffolding | Geração de projetos completos a partir de templates |
| F-04 | Policy Engine | Engine de políticas (OPA/Rego) para compliance |
| F-05 | Developer Portal | Self-service portal para devs solicitarem infra |
| F-06 | Scorecards | Dashboards de governança e maturity |
| F-07 | Template Registry | Registry de templates versionados |

## User Stories

**US-01**: Publicar componente padronizado no Service Catalog.
**US-02**: Criar Golden Path para microsserviço com RDS.
**US-03**: Desenvolvedor solicita infra via self-service.
**US-04**: Policy Engine bloqueia deploy de recursos não-compliant.
**US-05**: Scorecard mostra compliance dos ambientes.

## API Contracts

```
GET    /api/v1/catalog                    → List catalog items
POST   /api/v1/catalog                    → Create catalog item
PUT    /api/v1/catalog/{id}               → Update catalog item
POST   /api/v1/catalog/{id}/publish       → Publish to catalog

GET    /api/v1/golden-paths               → List golden paths
POST   /api/v1/golden-paths               → Create golden path
POST   /api/v1/golden-paths/{id}/instantiate → Create from template

POST   /api/v1/policies                   → Create policy
GET    /api/v1/policies                   → List policies
POST   /api/v1/policies/evaluate          → Evaluate resource against policies

GET    /api/v1/scorecards                 → List scorecards
GET    /api/v1/scorecards/{id}            → Scorecard detail

POST   /api/v1/requests                   → Create self-service request
GET    /api/v1/requests                   → List requests
POST   /api/v1/requests/{id}/approve      → Approve request
POST   /api/v1/requests/{id}/reject       → Reject request
```

## Database Model

```sql
CREATE TABLE catalog_items (
    id UUID PRIMARY KEY, tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL, description TEXT,
    category VARCHAR(100), provider VARCHAR(50),
    component_definition_id UUID,
    version VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'DRAFT',
    documentation_url VARCHAR(500),
    metadata JSONB, created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL, published_by UUID
);

CREATE TABLE golden_paths (
    id UUID PRIMARY KEY, tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL, description TEXT,
    category VARCHAR(100), version VARCHAR(50),
    canvas_template JSONB NOT NULL,
    input_schema JSONB, output_description TEXT,
    status VARCHAR(20) DEFAULT 'DRAFT',
    created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE policies (
    id UUID PRIMARY KEY, tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL, description TEXT,
    type VARCHAR(50) NOT NULL,  -- COST, SECURITY, COMPLIANCE, OPERATIONS
    engine VARCHAR(20) DEFAULT 'OPA',
    rego_code TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'WARNING',
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE policy_evaluations (
    id UUID PRIMARY KEY, policy_id UUID NOT NULL REFERENCES policies(id),
    resource_type VARCHAR(100), resource_id UUID,
    result VARCHAR(20) NOT NULL, details JSONB,
    evaluated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE catalog_requests (
    id UUID PRIMARY KEY, tenant_id UUID NOT NULL,
    requester_id UUID NOT NULL, catalog_item_id UUID,
    golden_path_id UUID, parameters JSONB,
    status VARCHAR(20) DEFAULT 'PENDING',
    approved_by UUID, approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE scorecards (
    id UUID PRIMARY KEY, tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL, category VARCHAR(100),
    metrics JSONB NOT NULL, score DOUBLE PRECISION,
    calculated_at TIMESTAMPTZ NOT NULL
);
```
