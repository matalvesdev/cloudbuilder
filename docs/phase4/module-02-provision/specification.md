# CloudBuilder Provision — Módulo 02

## Epic

Como platform engineer, quero que o CloudBuilder gere automaticamente Terraform/OpenTofu a partir do design visual e provisione a infraestrutura nos provedores de nuvem, garantindo que o estado real esteja sempre sincronizado com o canvas.

## Features

| ID | Feature | Descrição |
|----|---------|-----------|
| F-01 | Terraform Generator | Geração automática de Terraform a partir do canvas |
| F-02 | OpenTofu Generator | Geração automática de OpenTofu (equivalente) |
| F-03 | Deployment Engine | Pipeline de deploy com plan, approval, apply |
| F-04 | State Management | Gerenciamento de estado remoto com locking |
| F-05 | Drift Detection | Detecção de diferenças entre canvas e infra real |
| F-06 | Multi-Environment | Suporte a dev/staging/prod com promoção |
| F-07 | Plan Visualization | Visualização gráfica do terraform plan no canvas |
| F-08 | Provider Registry | Integração com registry de providers |

## User Stories

**US-01**: Gerar Terraform de um design e revisar o código em split view.
**US-02**: Executar terraform plan e ver mudanças visualmente no canvas.
**US-03**: Aprovar/rejeitar planos de deploy.
**US-04**: Visualizar drift detectado entre canvas e infra real.
**US-05**: Promover design de dev para staging para prod.

## API Contracts

```
POST /api/v1/canvases/{id}/generate           → Generate Terraform/OpenTofu
GET  /api/v1/canvases/{id}/generated-code     → Get generated code
POST /api/v1/environments                      → Create environment
GET  /api/v1/environments                      → List environments
POST /api/v1/environments/{id}/deploy          → Start deployment
GET  /api/v1/environments/{id}/deployments     → List deployments
GET  /api/v1/deployments/{id}/plan             → Get terraform plan
POST /api/v1/deployments/{id}/approve          → Approve plan
POST /api/v1/deployments/{id}/reject           → Reject plan
POST /api/v1/deployments/{id}/rollback         → Rollback deployment
GET  /api/v1/environments/{id}/drift           → Check drift
POST /api/v1/environments/{id}/sync            → Sync (remediate drift)
```

## Events

| Event | Publisher | Consumers |
|-------|-----------|-----------|
| CodeGenerated | Provision | Design, Audit |
| DeploymentStarted | Provision | Observe, Cost, Audit |
| DeploymentPlanCreated | Provision | Design (visual plan) |
| DeploymentApproved | Provision | Provision Engine |
| DeploymentCompleted | Provision | Design, Observe, Cost, AIOps |
| DeploymentFailed | Provision | Observe, AIOps, Notifications |
| DriftDetected | Provision | Design, Observe, AIOps |
| DriftRemediated | Provision | Design, Audit |

## Database Model

```sql
CREATE TABLE environments (
    id UUID PRIMARY KEY, tenant_id UUID NOT NULL, name VARCHAR(100) NOT NULL,
    canvas_id UUID NOT NULL, canvas_version INT NOT NULL,
    provider VARCHAR(50) NOT NULL, region VARCHAR(100) NOT NULL,
    state_backend JSONB, status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE deployments (
    id UUID PRIMARY KEY, environment_id UUID NOT NULL REFERENCES environments(id),
    canvas_version INT NOT NULL, status VARCHAR(20) NOT NULL,
    plan_json JSONB, plan_summary TEXT, approved_by UUID,
    approved_at TIMESTAMPTZ, started_at TIMESTAMPTZ, completed_at TIMESTAMPTZ,
    error_message TEXT, created_by UUID NOT NULL, created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE deployment_logs (
    id UUID PRIMARY KEY, deployment_id UUID NOT NULL REFERENCES deployments(id),
    level VARCHAR(10) NOT NULL, message TEXT NOT NULL, 
    timestamp TIMESTAMPTZ NOT NULL
);

CREATE TABLE managed_resources (
    id UUID PRIMARY KEY, environment_id UUID NOT NULL REFERENCES environments(id),
    node_id UUID, terraform_address VARCHAR(500) NOT NULL,
    resource_type VARCHAR(100) NOT NULL, provider VARCHAR(50) NOT NULL,
    state JSONB, status VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE drift_reports (
    id UUID PRIMARY KEY, environment_id UUID NOT NULL REFERENCES environments(id),
    detected_at TIMESTAMPTZ NOT NULL, drift_details JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'OPEN', remediated_at TIMESTAMPTZ
);
```

## Provision Engine (Go) — Architecture

```
provision-engine/
├── cmd/
│   └── provision-engine/main.go
├── internal/
│   ├── api/
│   │   └── grpc/
│   │       ├── server.go
│   │       └── proto/
│   ├── generator/
│   │   ├── generator.go          # Main orchestrator
│   │   ├── terraform/
│   │   │   ├── tf_generator.go
│   │   │   ├── template.go
│   │   │   └── output.go
│   │   └── opentofu/
│   │       └── tofu_generator.go
│   ├── executor/
│   │   ├── executor.go           # CLI process manager
│   │   ├── plan.go
│   │   ├── apply.go
│   │   └── state.go
│   ├── parser/
│   │   ├── plan_parser.go        # JSON plan → diff model
│   │   └── state_parser.go
│   ├── drift/
│   │   ├── detector.go
│   │   └── comparator.go
│   ├── provider/
│   │   ├── registry.go
│   │   └── templates/
│   ├── model/
│   │   ├── design.go
│   │   ├── deployment.go
│   │   └── resource.go
│   └── messaging/
│       └── kafka.go
├── Dockerfile
├── go.mod
└── go.sum
```
