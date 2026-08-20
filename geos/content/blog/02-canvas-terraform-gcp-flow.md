# Do Canvas ao GCP: Como Transformar um Diagrama em Infraestrutura Real

**Autor**: CloudBuilder Team | **Leitura**: 10 min | **Categoria**: Tutorial

---

## O que você vai aprender

Neste tutorial, vamos mostrar o fluxo completo de como um design visual se torna infraestrutura rodando no Google Cloud Platform. Sem abstrações mágicas — com código real, API real, resultados reais.

## Pré-requisitos

- Conta no [cloudbuilder.io](https://cloudbuilder.io)
- Conta no GCP com uma Service Account (roles: Compute Admin, Cloud SQL Admin)
- Docker rodando (para testar localmente)

## Fluxo visual

```
┌─────────┐     ┌──────────┐     ┌──────────┐     ┌─────────┐
│  Canvas  │ ──→ │ Generate │ ──→ │ Provision│ ──→ │   GCP   │
│ (design) │     │ (Terraform)│    │ (Go eng) │     │ (cloud) │
└─────────┘     └──────────┘     └──────────┘     └─────────┘
```

## Passo 1: Criar o Canvas via API

```bash
# Login e obter token
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@cloudbuilder.io","password":"admin"}' \
  | jq -r '.token')

# Criar canvas
CANVAS=$(curl -s -X POST http://localhost:8080/api/v1/canvases \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"name":"GCP Web App","tenantId":"t-001","userId":"u-001"}')

CANVAS_ID=$(echo $CANVAS | jq -r '.id')
echo "Canvas ID: $CANVAS_ID"
```

## Passo 2: Adicionar Recursos ao Canvas

Cada recurso no canvas é um nó (node) com uma `componentDefinitionId` que define o tipo de recurso.

```bash
# Buscar component definitions disponíveis
COMPONENTS=$(curl -s http://localhost:8080/api/v1/component-definitions?provider=google \
  -H "Authorization: Bearer $TOKEN")

# Extrair IDs dos componentes
VPC_ID=$(echo $COMPONENTS | jq -r '.[] | select(.resourceType=="google_compute_network") | .id')
SUBNET_ID=$(echo $COMPONENTS | jq -r '.[] | select(.resourceType=="google_compute_subnetwork") | .id')
VM_ID=$(echo $COMPONENTS | jq -r '.[] | select(.resourceType=="google_compute_instance") | .id')
SQL_ID=$(echo $COMPONENTS | jq -r '.[] | select(.resourceType=="google_sql_database_instance") | .id')

# Adicionar VPC
curl -s -X POST "http://localhost:8080/api/v1/canvases/$CANVAS_ID/nodes" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{
    \"componentDefinitionId\": \"$VPC_ID\",
    \"positionX\": 100,
    \"positionY\": 100,
    \"properties\": \"{\\\"label\\\":\\\"main-vpc\\\",\\\"provider\\\":\\\"google\\\",\\\"resourceType\\\":\\\"google_compute_network\\\",\\\"properties\\\":{\\\"name\\\":\\\"main-vpc\\\",\\\"auto_create_subnetworks\\\":\\\"false\\\",\\\"routing_mode\\\":\\\"REGIONAL\\\"}}\"
  }"
```

### O que acontece internamente

Quando você adiciona um nó, o backend:

1. **Valida** a `componentDefinitionId` existe
2. **Cria** um `CanvasNode` no banco com posição (x, y)
3. **Salva** as propriedades como JSON no campo `properties`
4. **Retorna** o nó com UUID gerado

### Estrutura do nó

```json
{
  "id": "a1b2c3d4-...",
  "componentDefinitionId": "comp-uuid-...",
  "positionX": 100.0,
  "positionY": 100.0,
  "properties": "{\"label\":\"main-vpc\",\"provider\":\"google\",\"resourceType\":\"google_compute_network\",\"properties\":{\"name\":\"main-vpc\",\"auto_create_subnetworks\":\"false\",\"routing_mode\":\"REGIONAL\"}}"
}
```

**Nota:** As propriedades são JSON aninhado — o `properties` externo contém metadados do nó (label, provider, resourceType) e o `properties` interno contém as propriedades reais do recurso Terraform.

## Passo 3: Conectar os Recursos

Edges definem relacionamentos entre recursos:

```bash
# Conectar VPC → Subnet
curl -s -X POST "http://localhost:8080/api/v1/canvases/$CANVAS_ID/edges" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{
    \"sourceNodeId\": \"$VPC_NODE_ID\",
    \"targetNodeId\": \"$SUBNET_NODE_ID\",
    \"edgeType\": \"network\"
  }"

# Conectar Subnet → VM
curl -s -X POST "http://localhost:8080/api/v1/canvases/$CANVAS_ID/edges" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{
    \"sourceNodeId\": \"$SUBNET_NODE_ID\",
    \"targetNodeId\": \"$VM_NODE_ID\",
    \"edgeType\": \"network\"
  }"

# Conectar Subnet → SQL
curl -s -X POST "http://localhost:8080/api/v1/canvases/$CANVAS_ID/edges" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{
    \"sourceNodeId\": \"$SUBNET_NODE_ID\",
    \"targetNodeId\": \"$SQL_NODE_ID\",
    \"edgeType\": \"network\"
  }"
```

### O resultado visual

```
┌──────────┐
│  main-vpc │ (google_compute_network)
└────┬─────┘
     │ network
     ↓
┌───────────┐
│ main-subnet│ (google_compute_subnetwork)
└───┬───┬───┘
    │   │
    ↓   ↓
┌─────┐ ┌──────────┐
│ web- │ │  app-db  │
│ server│ │(sql_db)  │
└─────┘ └──────────┘
```

## Passo 4: Gerar Terraform

```bash
# Gerar código Terraform
GENERATED=$(curl -s -X POST "http://localhost:8080/api/v1/canvases/$CANVAS_ID/generate?engine=terraform" \
  -H "Authorization: Bearer $TOKEN")

echo $GENERATED | jq '.files | keys'
# Output: ["main.tf", "variables.tf", "outputs.tf", "providers.tf", "versions.tf"]

echo $GENERATED | jq '.resourceCount'
# Output: 4
```

### O que o CodeGeneratorService faz

1. **Busca** o canvas design do banco (nodes + edges)
2. **Resolve** o provider dos nodes (neste caso: `google`)
3. **Para cada node**, busca o template correspondente:
   - Tenta `TerraformTemplateRepository` (banco)
   - Fallback para `builtInTemplates` (código)
4. **Renderiza** o template com as propriedades do nó usando regex `{{variable}}`
5. **Gera** variáveis, outputs, providers, versions
6. **Retorna** `GeneratedCode` com 5 arquivos

### main.tf gerado

```hcl
resource "google_compute_network" "node-vpc" {
  name                    = "main-vpc"
  auto_create_subnetworks = false
  routing_mode            = "REGIONAL"
  project                 = var.gcp_project_id
}

resource "google_compute_subnetwork" "node-subnet" {
  name          = "main-subnet"
  network       = "main-vpc"
  ip_cidr_range = "10.0.1.0/24"
  region        = "us-central1"
  project       = var.gcp_project_id
}

resource "google_compute_instance" "node-vm" {
  name         = "web-server"
  machine_type = "e2-medium"
  zone         = "us-central1-a"
  project      = var.gcp_project_id
  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-11"
    }
  }
  network_interface {
    subnetwork = "main-subnet"
    access_config {}
  }
}

resource "google_sql_database_instance" "node-sql" {
  name             = "app-db"
  database_version = "POSTGRES_14"
  region           = "us-central1"
  project          = var.gcp_project_id
  settings {
    tier = "db-f1-micro"
  }
  deletion_protection = false
}
```

## Passo 5: Criar Credencial

```bash
# Criar credencial GCP Service Account
curl -s -X POST http://localhost:8080/api/v1/credentials \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "GCP Production",
    "provider": "google",
    "tenantId": "t-001",
    "encryptedPayload": "{\"type\":\"service_account\",\"project_id\":\"my-project\",\"private_key\":\"...\"}"
  }'
```

### Como as credenciais são tratadas

```
Service Account JSON (texto plano)
    ↓
AES-256-GCM encryption (no backend)
    ↓
Armazenado no banco como encryptedPayload
    ↓
Na hora do provision:
    ↓
ProvisionController.buildCredentialEnvVars()
    ↓
GOOGLE_CREDENTIALS env var (injetado no Go engine)
    ↓
terraform apply (com credenciais via env)
```

**As credenciais nunca são logadas, exportadas, ou armazenadas em texto claro.**

## Passo 6: Provisionar

```bash
# Preview (gera código sem executar)
PREVIEW=$(curl -s -X POST "http://localhost:8080/api/v1/canvases/$CANVAS_ID/provision/preview?engine=terraform" \
  -H "Authorization: Bearer $TOKEN")

echo "Recursos: $(echo $PREVIEW | jq '.resourceCount')"
echo "Arquivos: $(echo $PREVIEW | jq '.files | keys')"

# Apply (executa na GCP)
RESULT=$(curl -s -X POST "http://localhost:8080/api/v1/canvases/$CANVAS_ID/provision/apply" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{
    \"credentialId\": \"$CRED_ID\",
    \"engine\": \"terraform\",
    \"autoApprove\": true
  }")

echo $RESULT | jq '.provider'    # "google"
echo $RESULT | jq '.resourceCount'  # 4
```

### O que acontece no Go engine

```
1. Recebe payload com:
   - files: { main.tf, variables.tf, outputs.tf, providers.tf, versions.tf }
   - envVars: { GOOGLE_CREDENTIALS: "..." }
   - engine: "terraform"

2. Cria diretório temporário
   terraform-temp/
   ├── main.tf
   ├── variables.tf
   ├── outputs.tf
   ├── providers.tf
   └── versions.tf

3. Executa:
   $ terraform init
   $ terraform plan -out=tfplan
   $ terraform apply tfplan -auto-approve

4. Retorna:
   - status: "SUCCESS"
   - resources: 4 criados
   - outputs: { network_id, subnet_id, instance_id, sql_instance_id }
```

## Passo 7: Verificar Resultado

```bash
# Verificar se os recursos foram criados
gcloud compute networks list --project=my-project
# NAME     SUBNET_MODE  ROUTE_MODE  BGP_DEFAULT_AS_NAME
# main-vpc REGIONAL    REGIONAL

gcloud compute instances list --project=my-project
# NAME         ZONE           MACHINE_TYPE  STATUS
# web-server   us-central1-a  e2-medium     RUNNING

gcloud sql instances list --project=my-project
# NAME    DATABASE_VERSION  TIER          REGION
# app-db  POSTGRES_14       db-f1-micro   us-central1
```

## Fluxo completo em 60 segundos

```
1. Login                    → JWT token
2. Create canvas            → Canvas UUID
3. Add 4 nodes              → VPC, Subnet, VM, SQL
4. Add 3 edges              → VPC→Subnet→VM, VPC→Subnet→SQL
5. Generate Terraform       → 5 files, 4 resources
6. Create credential        → GCP SA encrypted
7. Provision preview        → Review code
8. Provision apply          → terraform apply → GCP
9. Verify                   → 4 resources running
```

**Tempo total: 5 minutos.** Sem abrir o console do GCP. Sem escrever Terraform manualmente. Sem erros de sintaxe.

## Conclusão

O fluxo Canvas → Terraform → GCP não é mágica. É engenharia: cada passo é auditável, cada decisão é visível, cada recurso é rastreável.

O desenvolvedor não precisa conhecer Terraform. Precisa conhecer **arquitetura**. O CloudBuilder cuida do resto.

**Experimente:** [cloudbuilder.io](https://cloudbuilder.io)

---

## Tags

`#Tutorial` `#GCP` `#Terraform` `#Canvas` `#InfrastructureAsCode` `#GoogleCloud` `#DevOps` `#PlatformEngineering`
