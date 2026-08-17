# 🧪 Guia de Teste Manual — CloudBuilder Full Stack

## Pré-requisitos

```bash
cd CloudBuilder
docker compose up -d --build
```

Aguarde todos os 7 serviços ficarem `healthy` (~2 min):
```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```

---

## 1. Acessar a Aplicação

| Serviço | URL | Descrição |
|---------|-----|-----------|
| **Frontend** | http://localhost:3000 | Interface principal |
| **Backend API** | http://localhost:8080 | API REST |
| **Nginx** | http://localhost:80 | Proxy reverso |
| **Go Engine** | http://localhost:50052 | Provision engine |
| **Collab Server** | http://localhost:8765 | WebSocket collaboration |
| **OPA** | http://localhost:8181 | Policy engine |
| **PostgreSQL** | localhost:5432 | Banco de dados |

---

## 2. Login

### Via Frontend
1. Acesse http://localhost:3000
2. O login dev é automático (profile `dev`)

### Via API
```bash
curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@cloudbuilder.dev","password":"admin"}'
```

Salve o token:
```bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@cloudbuilder.dev","password":"admin"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
echo "Token: ${TOKEN:0:30}..."
```

---

## 3. Canvas / Design System

### 3.1 Criar Canvas
```bash
curl -s -X POST http://localhost:8080/api/v1/canvases \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "tenantId": "dev-tenant",
    "name": "GCP Stack Completo",
    "description": "VPC + Subnet + VM + Cloud SQL",
    "userId": "admin"
  }'
```

Anote o `id` retornado (ex: `abc123...`).

### 3.2 Criar Component Definitions
```bash
# VPC
curl -s -X POST http://localhost:8080/api/v1/component-definitions \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"provider":"google","resourceType":"google_compute_network","category":"network","displayName":"VPC","description":"Google VPC","terraformTemplate":"resource \"google_compute_network\" \"example\" {}"}'

# Subnet
curl -s -X POST http://localhost:8080/api/v1/component-definitions \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"provider":"google","resourceType":"google_compute_subnetwork","category":"network","displayName":"Subnet","description":"Google Subnet","terraformTemplate":"resource \"google_compute_subnetwork\" \"example\" {}"}'

# VM
curl -s -X POST http://localhost:8080/api/v1/component-definitions \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"provider":"google","resourceType":"google_compute_instance","category":"compute","displayName":"VM","description":"Google Compute Instance","terraformTemplate":"resource \"google_compute_instance\" \"example\" {}"}'

# Cloud SQL
curl -s -X POST http://localhost:8080/api/v1/component-definitions \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"provider":"google","resourceType":"google_sql_database_instance","category":"database","displayName":"Cloud SQL","description":"Google Cloud SQL","terraformTemplate":"resource \"google_sql_database_instance\" \"example\" {}"}'
```

### 3.3 Adicionar Nodes ao Canvas
Substitua `CANVAS_ID` pelo ID do canvas criado:

```bash
CANVAS_ID="SEU_CANVAS_ID_AQUI"

# VPC
curl -s -X POST "http://localhost:8080/api/v1/canvases/$CANVAS_ID/nodes" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "componentDefinitionId": "ID_DA_VPC",
    "positionX": 100, "positionY": 200,
    "id": "node-vpc",
    "properties": "{\"name\":\"main-vpc\",\"auto_create_subnetworks\":\"false\",\"routing_mode\":\"REGIONAL\"}"
  }'

# Subnet
curl -s -X POST "http://localhost:8080/api/v1/canvases/$CANVAS_ID/nodes" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "componentDefinitionId": "ID_DA_SUBNET",
    "positionX": 400, "positionY": 200,
    "id": "node-subnet",
    "properties": "{\"name\":\"main-subnet\",\"ipCidrRange\":\"10.0.1.0/24\",\"region\":\"us-central1\"}"
  }'

# VM
curl -s -X POST "http://localhost:8080/api/v1/canvases/$CANVAS_ID/nodes" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "componentDefinitionId": "ID_DA_VM",
    "positionX": 700, "positionY": 100,
    "id": "node-vm",
    "properties": "{\"name\":\"web-server\",\"machineType\":\"e2-medium\",\"zone\":\"us-central1-a\",\"subnetwork\":\"node-subnet\",\"imageProject\":\"debian-cloud\",\"imageFamily\":\"debian-11\"}"
  }'

# Cloud SQL
curl -s -X POST "http://localhost:8080/api/v1/canvases/$CANVAS_ID/nodes" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "componentDefinitionId": "ID_DO_SQL",
    "positionX": 700, "positionY": 300,
    "id": "node-sql",
    "properties": "{\"name\":\"app-db\",\"databaseVersion\":\"POSTGRES_14\",\"tier\":\"db-f1-micro\",\"region\":\"us-central1\"}"
  }'
```

### 3.4 Adicionar Edges
```bash
# VPC → Subnet
curl -s -X POST "http://localhost:8080/api/v1/canvases/$CANVAS_ID/edges" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"sourceNodeId":"node-vpc","targetNodeId":"node-subnet","edgeType":"contains"}'

# Subnet → VM
curl -s -X POST "http://localhost:8080/api/v1/canvases/$CANVAS_ID/edges" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"sourceNodeId":"node-subnet","targetNodeId":"node-vm","edgeType":"deploys"}'

# Subnet → SQL
curl -s -X POST "http://localhost:8080/api/v1/canvases/$CANVAS_ID/edges" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"sourceNodeId":"node-subnet","targetNodeId":"node-sql","edgeType":"connects"}'
```

### 3.5 Listar Canvas
```bash
curl -s "http://localhost:8080/api/v1/canvases" -H "Authorization: Bearer $TOKEN"
```

---

## 4. Code Generation (Terraform)

### 4.1 Gerar Terraform
```bash
curl -s -X POST "http://localhost:8080/api/v1/canvases/$CANVAS_ID/generate" \
  -H "Authorization: Bearer $TOKEN"
```

**Verificar:**
- [ ] `provider` deve ser `"google"`
- [ ] `resourceCount` deve ser `4`
- [ ] `files` deve ter 5 arquivos (main.tf, variables.tf, outputs.tf, providers.tf, versions.tf)
- [ ] `versions.tf` deve conter APENAS `hashicorp/google` (sem aws/azurerm)
- [ ] `main.tf` deve ter os 4 resources com IDs corretos (`node-vpc`, `node-subnet`, `node-vm`, `node-sql`)
- [ ] Boot disk image deve ser `debian-cloud/debian-11` (não `${debian-cloud}-debian-11`)

### 4.2 Provision Preview
```bash
curl -s -X POST "http://localhost:8080/api/v1/canvases/$CANVAS_ID/provision/preview?engine=terraform" \
  -H "Authorization: Bearer $TOKEN"
```

**Verificar:**
- [ ] HTTP 200
- [ ] `provider` = `"google"`
- [ ] `resourceCount` = 4
- [ ] `files` contém main.tf com resources corretos

---

## 5. Credenciais

### 5.1 Criar Credencial GCP
```bash
curl -s -X POST http://localhost:8080/api/v1/credentials \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "tenantId": "dev-tenant",
    "name": "GCP Service Account",
    "provider": "google",
    "authType": "service-account",
    "encryptedPayload": "{\"type\":\"service_account\",\"project_id\":\"meu-projeto\",\"private_key\":\"-----BEGIN RSA PRIVATE KEY-----\\nfake\\n-----END RSA PRIVATE KEY-----\"}"
  }'
```

### 5.2 Listar Credenciais
```bash
curl -s "http://localhost:8080/api/v1/credentials?tenantId=dev-tenant" \
  -H "Authorization: Bearer $TOKEN"
```

### 5.3 Criar Credencial AWS
```bash
curl -s -X POST http://localhost:8080/api/v1/credentials \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "tenantId": "dev-tenant",
    "name": "AWS Access Key",
    "provider": "aws",
    "authType": "access-key",
    "encryptedPayload": "{\"accessKeyId\":\"AKIA123\",\"secretAccessKey\":\"secret456\",\"region\":\"us-east-1\"}"
  }'
```

---

## 6. Provisionamento

### 6.1 Provision Apply (gera + injeta credenciais)
```bash
CRED_ID="ID_DA_CREDENCIAL"

curl -s -X POST "http://localhost:8080/api/v1/canvases/$CANVAS_ID/provision/apply" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{
    \"credentialId\": \"$CRED_ID\",
    \"engine\": \"terraform\",
    \"autoApprove\": false
  }"
```

**Verificar:**
- [ ] HTTP 200
- [ ] `files` contém main.tf, variables.tf, etc.
- [ ] `provider` = `"google"`
- [ ] `envVars` contém `GOOGLE_CREDENTIALS` com o JSON da service account
- [ ] `autoApprove` = false

### 6.2 Provision Apply com Auto-approve
```bash
curl -s -X POST "http://localhost:8080/api/v1/canvases/$CANVAS_ID/provision/apply" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{
    \"credentialId\": \"$CRED_ID\",
    \"engine\": \"terraform\",
    \"autoApprove\": true
  }"
```

---

## 7. Observabilidade

### 7.1 Metrics
```bash
curl -s "http://localhost:8080/api/v1/observability/metrics/query?metricName=cpu.usage" \
  -H "Authorization: Bearer $TOKEN"
```

### 7.2 Logs
```bash
curl -s "http://localhost:8080/api/v1/observability/logs" \
  -H "Authorization: Bearer $TOKEN"
```

### 7.3 Traces
```bash
curl -s "http://localhost:8080/api/v1/observability/traces?tenantId=dev-tenant" \
  -H "Authorization: Bearer $TOKEN"
```

### 7.4 SLOs
```bash
curl -s "http://localhost:8080/api/v1/observability/slo?tenantId=dev-tenant" \
  -H "Authorization: Bearer $TOKEN"
```

### 7.5 Alert Rules
```bash
curl -s "http://localhost:8080/api/v1/observability/alert-rules?tenantId=dev-tenant" \
  -H "Authorization: Bearer $TOKEN"
```

### 7.6 Incidents
```bash
curl -s "http://localhost:8080/api/v1/observability/incidents?tenantId=dev-tenant" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 8. AIOps

### 8.1 AI Query
```bash
curl -s -X POST http://localhost:8080/api/v1/aiops/query \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"question":"Quais serviços estão provisionados?","context":"infrastructure"}'
```

### 8.2 Metric Analysis
```bash
curl -s -X POST http://localhost:8080/api/v1/aiops/analyze-metric \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"metricName":"cpu.usage","recentValues":[85.0,92.0,88.0,95.0,91.0]}'
```

### 8.3 Anomaly Detection (Metrics)
```bash
curl -s -X POST http://localhost:8080/api/v1/aiops/anomaly/metrics \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"tenantId":"dev-tenant","metricName":"cpu.usage","value":95.0,"windowMinutes":60}'
```

### 8.4 Anomaly Detection (Logs)
```bash
curl -s -X POST http://localhost:8080/api/v1/aiops/anomaly/logs \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"tenantId":"dev-tenant","windowMinutes":60,"maxLogs":200}'
```

---

## 9. Go Provision Engine

### 9.1 Healthcheck
```bash
curl -s http://localhost:50052/healthz
```

### 9.2 Validar Terraform
```bash
curl -s -X POST http://localhost:50052/api/v1/provision/validate \
  -H 'Content-Type: application/json' \
  -d '{
    "canvasId": "test",
    "tenantId": "dev-tenant",
    "provider": "google",
    "engine": "terraform",
    "files": {
      "main.tf": "resource \"google_compute_network\" \"vpc\" {\n  name = \"test\"\n}"
    }
  }'
```

---

## 10. Frontend — Checklist Visual

### 10.1 Canvas Module
- [ ] Acesse http://localhost:3000
- [ ] Clique em "Novo design" (+)
- [ ] Arraste componentes da paleta para o canvas
- [ ] Conecte componentes com edges
- [ ] Clique em um node → PropertiesPanel abre à direita
- [ ] Clique em "Salvar" (disk icon)
- [ ] Clique em "Validar design" (checkmark)
- [ ] Clique em "Exportar JSON"

### 10.2 Painéis Laterais
- [ ] Clique no ícone "Olho" → dropdown com painéis
- [ ] **Código Terraform** → mostra terraform gerado
- [ ] **Assistente IA** → AIChatPanel abre
- [ ] **Observabilidade** → ObservabilityPanel
- [ ] **Estimativa de custos** → CostEstimationBar
- [ ] **Provisionar** → ProvisionPanel abre

### 10.3 ProvisionPanel
- [ ] Clique em "Provisionar" no dropdown
- [ ] Painel mostra "2" nós no canvas
- [ ] Selecione engine (Terraform/OpenTofu)
- [ ] Clique "Gerar Preview Terraform"
- [ ] Preview mostra 4 arquivos gerados
- [ ] Clique "Ver main.tf" → código aparece
- [ ] Clique "Configurar Credenciais"
- [ ] Lista de credenciais disponíveis
- [ ] Selecione uma credencial
- [ ] Marque/desmarque "Auto-apply"
- [ ] Clique "Provisionar"
- [ ] Status mostra "Provisionado com sucesso!"

### 10.4 Toolbar
- [ ] Botão "+" → novo design
- [ ] Botão "Save" → salva
- [ ] Botão "Check" → valida
- [ ] Undo/Redo funcionam
- [ ] Export JSON funciona
- [ ] Import JSON funciona
- [ ] Command Palette (Cmd+K)

---

## 11. Policy Engine (OPA)

```bash
# Verificar se OPA está rodando
curl -s http://localhost:8181/health

# Avaliar uma política
curl -s -X POST http://localhost:8181/v1/data/system/health \
  -H 'Content-Type: application/json' \
  -d '{}'
```

---

## 12. Banco de Dados

```bash
# Listar tabelas
docker exec cloudbuilder-postgres psql -U cloudbuilder -d cloudbuilder -c "\dt"

# Verificar Flyway migrations
docker exec cloudbuilder-postgres psql -U cloudbuilder -d cloudbuilder -c \
  "SELECT version, description, success FROM flyway_schema_history ORDER BY installed_rank;"

# Contar migrations
docker exec cloudbuilder-postgres psql -U cloudbuilder -d cloudbuilder -c \
  "SELECT count(*) as total, count(*) filter (where success) as ok FROM flyway_schema_history;"

# Verificar tabelas JPA
docker exec cloudbuilder-postgres psql -U cloudbuilder -d cloudbuilder -c \
  "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;"
```

---

## 13. Logs

```bash
# Backend
docker logs cloudbuilder-backend -f

# Frontend
docker logs cloudbuilder-frontend -f

# Go Engine
docker logs cloudbuilder-provision-engine -f

# PostgreSQL
docker logs cloudbuilder-postgres -f
```

---

## 14. Troubleshooting

### Backend não sobe
```bash
docker logs cloudbuilder-backend 2>&1 | tail -20
```

### Flyway erro
```bash
docker logs cloudbuilder-backend 2>&1 | grep -i flyway
```

### Frontend não carrega
```bash
docker logs cloudbuilder-frontend 2>&1 | tail -10
```

### Resetar tudo
```bash
docker compose down -v
docker compose up -d --build
```

---

## 15. Resumo dos Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/v1/auth/login` | Login |
| GET | `/api/v1/auth/me` | Usuário atual |
| POST | `/api/v1/canvases` | Criar canvas |
| GET | `/api/v1/canvases` | Listar canvases |
| POST | `/api/v1/canvases/{id}/nodes` | Adicionar node |
| POST | `/api/v1/canvases/{id}/edges` | Adicionar edge |
| POST | `/api/v1/canvases/{id}/generate` | Gerar Terraform |
| POST | `/api/v1/canvases/{id}/provision/preview` | Preview provision |
| POST | `/api/v1/canvases/{id}/provision/apply` | Provisionar |
| POST | `/api/v1/component-definitions` | Criar component def |
| GET | `/api/v1/component-definitions` | Listar component defs |
| POST | `/api/v1/credentials` | Criar credencial |
| GET | `/api/v1/credentials` | Listar credenciais |
| GET | `/api/v1/observability/metrics/*` | Métricas |
| GET | `/api/v1/observability/logs` | Logs |
| GET | `/api/v1/observability/traces` | Traces |
| GET | `/api/v1/observability/slo` | SLOs |
| GET | `/api/v1/observability/alert-rules` | Alert rules |
| GET | `/api/v1/observability/incidents` | Incidents |
| POST | `/api/v1/aiops/query` | AI Query |
| POST | `/api/v1/aiops/analyze-metric` | Metric Analysis |
| POST | `/api/v1/aiops/anomaly/metrics` | Anomaly Detection |
| POST | `/api/v1/aiops/anomaly/logs` | Log Analysis |
