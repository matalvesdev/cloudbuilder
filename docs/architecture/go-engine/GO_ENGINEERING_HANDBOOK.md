# CloudBuilder Go Engineering Handbook

> **Version:** 1.0.0  
> **Status:** ✅ Complete  
> **Last Updated:** 2026-06-28  
> **Module:** `github.com/cloudbuilder/provision-engine`  
> **Stack:** Go 1.22 + Cobra CLI + gRPC + Zerolog

---

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Stack e Dependências](#2-stack-e-dependências)
3. [Estrutura de Diretórios](#3-estrutura-de-diretórios)
4. [Modelo de Domínio](#4-modelo-de-domínio)
5. [Interface gRPC](#5-interface-grpc)
6. [Motor de Geração de Código](#6-motor-de-geração-de-código)
7. [Sistema de Templates por Provider](#7-sistema-de-templates-por-provider)
8. [Executor Terraform/OpenTofu](#8-executor-terraformopentofu)
9. [Detecção de Drift](#9-detecção-de-drift)
10. [Parser de Plan e State](#10-parser-de-plan-e-state)
11. [Sistema de Eventos](#11-sistema-de-eventos)
12. [Colaboração em Tempo Real](#12-colaboração-em-tempo-real)
13. [CLI com Cobra](#13-cli-com-cobra)
14. [Docker Build](#14-docker-build)
15. [Pipeline de Deploy](#15-pipeline-de-deploy)
16. [Testes](#16-testes)
17. [Referências](#17-referências)

---

## 1. Visão Geral

O **Provision Engine** é o motor Go responsável por traduzir designs visuais (criados no módulo Design do frontend) em infraestrutura real. Ele opera como um gateway entre a camada de orquestração (backend Spring Boot) e as ferramentas de IaC (Terraform/OpenTofu).

### Responsabilidades Principais

1. **Geração de Código IaC** — Converte `CanvasDesign` (nodes + edges) em HCL Terraform válido
2. **Planejamento e Deploy** — Executa `terraform init → plan → apply` com streaming de status
3. **Detecção de Drift** — Compara estado desejado (design) vs estado real (state) e reporta diferenças
4. **Observabilidade de Deploy** — Eventos publicados via sistema pub/sub interno e stream gRPC
5. **Colaboração** — Servidor WebSocket para edição colaborativa em tempo real (Yjs CRDT)

### Arquitetura Simplificada

```
┌──────────────┐     gRPC      ┌──────────────────────┐     exec     ┌──────────────┐
│  Backend     │◄─────────────►│  Provision Engine    │─────────────►│  Terraform   │
│  (Spring)    │               │  (Go 1.22)           │              │  / OpenTofu  │
└──────────────┘               │                      │              └──────────────┘
                               │  ┌────────────────┐  │
                               │  │  Event Pub/Sub │  │
                               │  └────────────────┘  │
                               │  ┌────────────────┐  │
                               │  │  WebSocket     │  │◄────────── Frontend (Yjs)
                               │  │  Collaboration │  │
                               │  └────────────────┘  │
                               └──────────────────────┘
```

---

## 2. Stack e Dependências

### Runtime

| Dependência | Versão | Propósito |
|---|---|---|
| **Go** | 1.22.0 (toolchain 1.22.10) | Linguagem e toolchain |
| **google.golang.org/grpc** | v1.71.1 | Servidor gRPC e streaming |
| **github.com/spf13/cobra** | v1.9.1 | CLI com subcomandos |
| **github.com/rs/zerolog** | v1.33.0 | Logging estruturado |
| **github.com/gorilla/websocket** | v1.5.3 | Servidor WebSocket (colaboração) |

### Zero Dependências Externas de IaC

O engine não embute Terraform nem OpenTofu. Eles são esperados como binários no `$PATH` ou configurados via `EngineType`. O Docker compose usa sidecars.

### Go Modules

```
module github.com/cloudbuilder/provision-engine

go 1.22.0
toolchain go1.22.10
```

---

## 3. Estrutura de Diretórios

```
provision-engine/
├── cmd/
│   └── provision-engine/
│       └── main.go              ← Entrypoint Cobra CLI (2 comandos)
├── internal/
│   ├── api/
│   │   └── grpc/
│   │       ├── proto/
│   │       │   ├── provision.proto  ← Definição proto (8 RPCs)
│   │       │   └── provision.pb.go  ← Hand-written Go (JSON codec custom)
│   │       ├── server.go            ← Implementação do servidor gRPC
│   │       └── server_test.go       ← Testes do servidor (9 tests)
│   ├── collaboration/
│   │   ├── server.go                ← Servidor WebSocket
│   │   ├── room.go                  ← Gerenciamento de salas
│   │   └── client.go                ← Cliente WebSocket + Yjs relay
│   ├── drift/
│   │   ├── detector.go              ← Lógica de detecção de drift
│   │   └── detector_test.go         ← Testes de drift (6 tests)
│   ├── executor/
│   │   ├── engine.go                ← Wrapper exec Terraform/OpenTofu
│   │   ├── deployment.go            ← DeploymentManager (init→plan→apply→destroy)
│   │   ├── engine_test.go           ← Testes do executor
│   │   └── deployment_test.go       ← Testes do DeploymentManager
│   ├── generator/
│   │   └── terraform/
│   │       ├── generator.go         ← Geração HCL a partir de CanvasDesign
│   │       └── generator_test.go    ← Testes do generator
│   ├── messaging/
│   │   ├── event.go                 ← EventPublisher (pub/sub síncrono)
│   │   ├── stream.go                ← Bridge entre EventPublisher e gRPC streaming
│   │   ├── event_test.go            ← Testes do publisher
│   │   └── stream_test.go           ← Testes do stream bridge
│   ├── model/
│   │   └── design.go                ← Domain types: CanvasDesign, DesignNode, ProviderType
│   ├── parser/
│   │   ├── plan.go                  ← Parser de Terraform plan JSON
│   │   ├── state.go                 ← Parser de Terraform state JSON
│   │   ├── plan_test.go             ← Testes do plan parser
│   │   └── state_test.go            ← Testes do state parser
│   └── provider/
│       └── templates/
│           ├── router.go            ← Roteador central de templates
│           ├── aws.go               ← Templates AWS (5 resources)
│           ├── azure.go             ← Templates Azure (5 resources)
│           ├── gcp.go               ← Templates GCP (4 resources)
│           ├── k8s.go               ← Templates K8s (4 resources)
│           ├── aws_test.go          ← Testes AWS templates
│           ├── azure_providers.go   ← Provider blocks Azure
│           ├── gcp_providers.go     ← Provider blocks GCP
│           └── k8s_providers.go     ← Provider blocks K8s
├── Dockerfile                       ← Multi-stage build
├── go.mod
└── go.sum
```

### Total: 27 arquivos Go, 7 suites de teste, 23 testes

---

## 4. Modelo de Domínio

### `internal/model/design.go`

Define os tipos centrais que representam um design visual de infraestrutura:

```go
type ProviderType string

const (
    ProviderAWS   ProviderType = "aws"
    ProviderAZURE ProviderType = "azure"
    ProviderGCP   ProviderType = "gcp"
    ProviderK8s   ProviderType = "k8s"
)

type DesignNode struct {
    ID         string                 `json:"id"`
    Name       string                 `json:"name"`
    Provider   ProviderType           `json:"provider"`
    Type       string                 `json:"type"`
    Properties map[string]interface{} `json:"properties"`
    PositionX  float64                `json:"positionX"`
    PositionY  float64                `json:"positionY"`
}

type Edge struct {
    ID       string `json:"id"`
    SourceID string `json:"sourceId"`
    TargetID string `json:"targetId"`
}

type CanvasDesign struct {
    Nodes []DesignNode `json:"nodes"`
    Edges []Edge       `json:"edges"`
}
```

**Design Decisions:**
- `ProviderType` é string tipada (não enum) para flexibilidade
- `Properties` usa `map[string]interface{}` — compatível com JSON arbitrário vindo do frontend
- `PositionX`/`PositionY` espelham o formato flat do backend Spring Boot (não `XYPosition`)
- `GetProvider()` faz fallback para `ProviderAWS` em caso de provider desconhecido

---

## 5. Interface gRPC

### Proto (`internal/api/grpc/proto/provision.proto`)

8 RPCs definidos:

| RPC | Tipo | Descrição |
|---|---|---|
| `GenerateCode` | Unary | Converte design JSON em arquivos Terraform |
| `Deploy` | Server-stream | Executa init → plan, stream de eventos de status |
| `GetPlan` | Unary | Executa `terraform plan -out=tfplan` + `terraform show -json` |
| `ApprovePlan` | Unary | Executa `terraform apply tfplan` |
| `GetState` | Unary | Executa `terraform show -json` |
| `DetectDrift` | Unary | Compara state vs design, retorna recursos em drift |
| `Destroy` | Server-stream | Executa `terraform destroy`, stream de eventos |
| `WatchEvents` | Server-stream | Stream de eventos de deploy/drift/lifecycle |

### Implementação Customizada (sem protoc)

Diferente da abordagem tradicional (`.proto` → `protoc` → `*.pb.go`), este projeto usa **hand-written Go structs** com um **JSON codec customizado**:

```go
type JSONCodec struct{}
func (JSONCodec) Marshal(v interface{}) ([]byte, error) { return json.Marshal(v) }
func (JSONCodec) Unmarshal(data []byte, v interface{}) error { return json.Unmarshal(data, v) }
func (JSONCodec) Name() string { return "proto" }
```

**Por que?** Elimina a dependência de `protoc` no build, simplifica o pipeline CI, e mantém compatibilidade com gRPC via codec `"proto"`.

### Servidor (`internal/api/grpc/server.go`)

O `ProvisionServer` implementa `ProvisionServiceServer` e orquestra todos os outros pacotes:

| Método | Pacotes Usados |
|---|---|
| `GenerateCode` | — (templates inline no server.go) |
| `GetPlan` | `executor`, `parser` |
| `ApprovePlan` | `executor`, `messaging` |
| `Deploy` | `executor` (DeploymentManager) |
| `Destroy` | `executor` (DeploymentManager) |
| `GetState` | `executor`, `parser` |
| `DetectDrift` | `executor`, `drift`, `messaging` |
| `WatchEvents` | `messaging` (EventPublisher.SubscribeToEvents) |

#### `GenerateCode` — Geração Atual (Fase 1)

Atualmente usa **templates inline hardcoded** para AWS (vpc, instance, subnet, s3_bucket, security_group). O design JSON é parseado e cada node é mapeado para um template. Recursos sem template recebem um fallback.

> **Nota Arquitetural:** A geração de código real (com templates por provider) está no pacote `generator/terraform` e é usada pelo `GetTemplate` router. A implementação em `server.go` é uma versão simplificada da Fase 1 que será migrada para usar o `Generator` unificado.

#### `WatchEvents` — Streaming de Eventos

Usa `context.Context` para lifecycle, `EventPublisher.SubscribeToEvents` para receber eventos, e filtro opcional por `event_types`. Suporta multi-tenant via `tenant_id`.

---

## 6. Motor de Geração de Código

### `internal/generator/terraform/generator.go`

O `Generator` produz HCL Terraform completo a partir de um `model.CanvasDesign`:

```
Generator.Generate(design) → string (HCL completo)
```

### Pipeline de Geração

```
CanvasDesign → Provider Router → Resource Template → HCL String
                    ↓
            Provider Block (1x por provider)
                    ↓
            Output Blocks
                    ↓
            Header + Variables
```

### Blocos Gerados Automaticamente

1. **Header**: `required_version`, `required_providers` (AWS, Azure, GCP), `variable "environment"`, `variable "region"`, `data "aws_availability_zones"`
2. **Provider Blocks**: Um por provider usado no design
3. **Resource Blocks**: Cada node mapeado via `templates.GetTemplate()`
4. **Output Blocks**: VPC ID, Instance Public IP, Bucket ARN (por tipo de recurso)

### Suporte a Variáveis

```hcl
variable "environment" { type = string; default = "production" }
variable "region"      { type = string; default = "us-east-1" }
```

Tags padronizadas incluem `${var.environment}` e `ManagedBy = "CloudBuilder"` em todos os recursos.

---

## 7. Sistema de Templates por Provider

### Router Central (`internal/provider/templates/router.go`)

```go
func GetTemplate(provider model.ProviderType, resourceType string) (ResourceTemplate, bool)
```

O router agrega templates de todos os 4 providers em um único mapa:

```go
func allTemplates() map[ProviderType]map[string]ResourceTemplate {
    return map[ProviderType]map[string]ResourceTemplate{
        ProviderAWS:   awsTemplates(),
        ProviderAZURE: azureTemplates(),
        ProviderGCP:   gcpTemplates(),
        ProviderK8s:   k8sTemplates(),
    }
}
```

### Tipo `ResourceTemplate`

```go
type ResourceTemplate func(node model.DesignNode) (string, error)
```

Cada template é uma **função pura** que recebe um `DesignNode` e retorna HCL. Isso permite templates dinâmicos baseados em `Properties`.

### Templates por Provider

#### AWS (5 tipos, 12 aliases) — `aws.go`

| Resource Type | Aliases | Função Template |
|---|---|---|
| `aws_vpc` | `vpc` | `awsVpcTemplate` — CIDR, DNS, tags |
| `aws_subnet` | `subnet` | `awsSubnetTemplate` — VPC ref, AZ, public/private |
| `aws_security_group` | `security_group` | `awsSecurityGroupTemplate` — ingress/egress, VPC ref |
| `aws_instance` | `instance`, `ec2` | `awsInstanceTemplate` — AMI, type, subnet, SG, root volume gp3 |
| `aws_s3_bucket` | `s3`, `s3_bucket` | `awsS3BucketTemplate` — versioning toggle |

**Helpers de referência parental:**
- `getParentVPCID(node)` → `aws_vpc.{id}.id`
- `getParentSubnetID(node)` → `aws_subnet.{id}.id`
- `getParentSecurityGroupID(node)` → `aws_security_group.{id}.id`

#### Azure (5 tipos) — `azure.go`

| Resource Type | Função Template |
|---|---|
| `azurerm_resource_group` | `azureResourceGroupTemplate` |
| `azurerm_virtual_network` | `azureVirtualNetworkTemplate` |
| `azurerm_subnet` | `azureSubnetTemplate` |
| `azurerm_linux_virtual_machine` | `azureLinuxVMTemplate` — SSH key, Canonical Ubuntu 22.04 |
| `azurerm_postgresql_flexible_server` | `azurePostgresTemplate` — PG 16, SKU configurável |

#### GCP (4 tipos) — `gcp.go`

| Resource Type | Função Template |
|---|---|
| `google_compute_network` | `gcpComputeNetworkTemplate` |
| `google_compute_subnetwork` | `gcpSubnetworkTemplate` |
| `google_compute_instance` | `gcpComputeInstanceTemplate` — Ubuntu 22.04, boot SSD |
| `google_storage_bucket` | `gcpStorageBucketTemplate` — uniform bucket-level access, versioning |

#### Kubernetes (4 tipos) — `k8s.go`

| Resource Type | Função Template |
|---|---|
| `kubernetes_namespace` | `k8sNamespaceTemplate` |
| `kubernetes_deployment` | `k8sDeploymentTemplate` — replicas, resources limits/requests |
| `kubernetes_service` | `k8sServiceTemplate` — ClusterIP, port, selector |
| `kubernetes_config_map` | `k8sConfigMapTemplate` |

### Helpers Compartilhados (em `aws.go`)

```go
func getStringProp(props map[string]interface{}, key, defaultVal string) string
func getBoolProp(props map[string]interface{}, key string, defaultVal bool) bool
```

Esses helpers estão no pacote `templates` e são reutilizados por todos os providers.

---

## 8. Executor Terraform/OpenTofu

### `internal/executor/engine.go`

O `Executor` é um wrapper sobre `os/exec` que executa comandos Terraform ou OpenTofu:

```go
type Executor struct {
    engine     EngineType   // "terraform" ou "tofu"
    workDir    string
    binaryPath string
}
```

### EngineType

```go
const (
    Terraform EngineType = "terraform"
    OpenTofu  EngineType = "tofu"
)
```

### Comandos Suportados

| Método | Comando | Uso |
|---|---|---|
| `Init(ctx)` | `terraform/tofu init -input=false` | Inicializa backend e providers |
| `Validate(ctx)` | `terraform/tofu validate` | Valida sintaxe HCL |
| `Plan(ctx, out)` | `terraform/tofu plan -out=tfplan` | Gera plano de execução |
| `Apply(ctx, planFile)` | `terraform/tofu apply -auto-approve tfplan` | Aplica mudanças |
| `ShowPlan(ctx, planFile)` | `terraform/tofu show -json tfplan` | JSON do plano |
| `Show(ctx)` | `terraform/tofu show -json` | JSON do state atual |
| `Destroy(ctx)` | `terraform/tofu destroy -auto-approve` | Destrói infraestrutura |
| `Output(ctx)` | `terraform/tofu output -json` | Outputs do state |
| `WorkspaceList(ctx)` | `terraform/tofu workspace list` | Lista workspaces |
| `WorkspaceSelect(ctx, name)` | `terraform/tofu workspace select {name}` | Seleciona workspace |

### `ExecutionResult`

```go
type ExecutionResult struct {
    Stdout   string
    Stderr   string
    ExitCode int
}
```

### `internal/executor/deployment.go` — DeploymentManager

O `DeploymentManager` orquestra o ciclo de vida completo de deploy:

```go
type DeploymentManager struct {
    executor *Executor
}
```

### Status de Deploy

```
StatusPending → StatusInit → StatusPlanning → StatusPlanned
                                 ↓              ↓
                           StatusFailed    StatusApplying → StatusApplied
                                                              ↓
                                                        StatusDestroying → StatusDestroyed
                                                              ↓
                                                        StatusFailed
```

### Métodos

| Método | Pipeline Interno |
|---|---|
| `WriteCode(files)` | Salva arquivos HCL no `workDir` |
| `Execute(ctx, statusChan)` | `Init → Plan` (envia status pelo canal) |
| `Apply(ctx, statusChan)` | `Apply tfplan` (envia status) |
| `Destroy(ctx, statusChan)` | `Destroy` (envia status) |

O `DeploymentManager` é usado pelos handlers gRPC `Deploy`, `Destroy` e `ApprovePlan` para gerenciar o ciclo de vida com **streaming de status**.

---

## 9. Detecção de Drift

### `internal/drift/detector.go`

Compara o estado desejado (design JSON) com o estado real (Terraform state JSON) e identifica diferenças:

```go
func DetectDrift(stateJSON string, designJSON string) (*DriftReport, error)
```

### Algoritmo

```
1. Parse state JSON → TerraformState.Resources[]
2. Parse design JSON → []DesignNode
3. Build stateMap[address] = *StateResource
4. Para cada design node:
   - Se address não existe em stateMap → "added" (recurso deveria existir mas não existe)
5. Para cada recurso em stateMap:
   - Se address não existe no design → "removed" (recurso existe mas não deveria)
6. report.HasDrift = len(report.Resources) > 0
```

### DriftReport

```go
type DriftReport struct {
    HasDrift  bool            `json:"has_drift"`
    Resources []DriftResource `json:"resources"`
}

type DriftResource struct {
    Address      string `json:"address"`
    ResourceType string `json:"resource_type"`
    Expected     string `json:"expected"`    // "present" ou "absent"
    Actual       string `json:"actual"`      // "present" ou "absent"
    ChangeType   string `json:"change_type"` // "added", "removed"
}
```

> **Nota:** A detecção atual é **binária** (presente/ausente). Não detecta modificações de propriedades (ex: mudança de `instance_type`). Essa é uma melhoria planejada para futura iteração.

### Fluxo no gRPC Server

```
DetectDrift:
  executor.Show(ctx) → state JSON
  drift.DetectDrift(stateJSON, designJSON) → DriftReport
  messaging.Publish(EventDriftDetected|EventDriftResolved)
```

---

## 10. Parser de Plan e State

### `internal/parser/plan.go`

Parseia `terraform show -json` output para análise de plano:

```go
type TerraformPlan struct {
    FormatVersion     string
    ResourceChanges   []ResourceChange
    OutputChanges     map[string]Change
    PriorState        json.RawMessage
    Configuration     json.RawMessage
}

type ResourceChange struct {
    Address      string
    Type         string
    Name         string
    Change       Change  // Actions: ["create"], ["update"], ["delete"], ["no-op"]
}

func (p *TerraformPlan) Summary() (added, changed, destroyed int)
```

### `internal/parser/state.go`

Parseia `terraform show -json` output para análise de estado:

```go
type TerraformState struct {
    Version          int
    Resources        []StateResource
}

type StateResource struct {
    Type      string
    Name      string
    Instances []StateInstance
}

func (s *TerraformState) ResourceCount() int
func (s *TerraformState) FindResource(address string) *StateResource
```

---

## 11. Sistema de Eventos

### `internal/messaging/event.go`

Implementação de **pub/sub síncrono em memória** com fan-out para subscribers e log stdout:

```go
type EventPublisher struct {
    subscribers map[string]*Subscriber  // thread-safe (sync.RWMutex)
}
```

### Tipos de Evento

| EventType | Disparado Quando |
|---|---|
| `deployment.started` | Deploy inicia |
| `deploying` | Progresso de deploy |
| `deployment.complete` | Deploy finalizado com sucesso |
| `deployment.failed` | Deploy falha |
| `drift.detected` | Drift encontrado |
| `drift.resolved` | Drift resolvido |

### Características

- **Buffer por subscriber**: 100 eventos (non-blocking se consumer lento)
- **Drop silencioso**: Se buffer do subscriber encher, evento é dropado com log
- **Log obrigatório**: Todo evento publicado é logado no stdout como JSON
- **Thread-safe**: `sync.RWMutex` para leitura/escrita concorrente
- **PublisherProgress**: Helper para publicar eventos de progresso com `percentage`

### Bridge gRPC (`internal/messaging/stream.go`)

O `SubscribeToEvents` faz a ponte entre o `EventPublisher` e o streaming gRPC `WatchEvents`:

```go
func (p *EventPublisher) SubscribeToEvents(ctx context.Context, id string) <-chan StreamEvent
```

Cria uma goroutine que:
1. Se inscreve no publisher
2. Converte `DeploymentEvent` → `StreamEvent`
3. Envia no canal de saída
4. Cancela com `ctx.Done()` (graceful shutdown)
5. Remove subscriber e fecha canal ao sair

---

## 12. Colaboração em Tempo Real

### `internal/collaboration/`

Servidor WebSocket para edição colaborativa de canvas usando **Yjs CRDT** (protocolo binário).

### Arquitetura

```
WebSocket Client ──► /ws/{roomId} ──► Collaboration Server
                                             │
                                    ┌────────┴────────┐
                                    │     Room         │
                                    │  ┌──────────┐   │
                                    │  │ Client A │   │
                                    │  ├──────────┤   │
                                    │  │ Client B │   │
                                    │  ├──────────┤   │
                                    │  │ Client C │   │
                                    │  └──────────┘   │
                                    └─────────────────┘
```

### Componentes

#### Server
- HTTP server na porta `8765` (padrão)
- Upgrades HTTP para WebSocket via `gorilla/websocket`
- Path-based rooms: `/ws/{roomId}` (ex: `/ws/canvas:abc123`)
- CORS liberado para dev (`CheckOrigin: return true`)
- Endpoint `/health` com status, contagem de rooms e clients

#### Room
- `AddClient` / `RemoveClient` com contagem de peers
- `BroadcastBinary` → Yjs sync (para todos EXCETO sender)
- `BroadcastJSON` → awareness/presence (para TODOS, incluindo sender)
- `PresenceList` → snapshot de `UserInfo` dos clients conectados

#### Client
- `readPump`: Lê WebSocket, trata `BinaryMessage` (Yjs) e `TextMessage` (JSON)
- `writePump`: Escreve mensagens + ping a cada 54s (9/10 de 60s)
- `MessageBinary` → Yjs sync relay para peers
- `MessageJSON` → Awareness, userinfo, presença
- `disconnect()` → Remove do room, broadcast de presença, limpeza

### Protocolo de Mensagens

**Binário:** Payload Yjs CRDT — relay direto entre peers  
**JSON (awareness):**
```json
{ "type": "awareness", "cursor": { "x": 100, "y": 200 } }
```
**JSON (userinfo):**
```json
{ "type": "userinfo", "name": "Rafael", "avatar": "R" }
```
**JSON (presence broadcast):**
```json
{ "type": "presence", "users": [{ "id": "...", "name": "...", "avatar": "...", "status": "online" }] }
```

---

## 13. CLI com Cobra

### `cmd/provision-engine/main.go`

Dois comandos via Cobra:

### `provision-engine` (root)

```
Usage: provision-engine [--port 50051] [--log-level info]
```

Inicia o servidor gRPC na porta especificada:
1. Listen TCP na porta
2. Cria gRPC server com `loggingInterceptor`
3. Registra `ProvisionServiceServer`
4. Registra `reflection` (para `grpcurl` e debugging)
5. Graceful shutdown em `SIGINT`/`SIGTERM`

### `provision-engine collab-server`

```
Usage: provision-engine collab-server [--port 8765]
```

Inicia o servidor WebSocket de colaboração.

### Logging Interceptor

```go
func loggingInterceptor(ctx context.Context, req interface{},
    info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
    log.Printf("gRPC call: %s", info.FullMethod)
    return handler(ctx, req)
}
```

---

## 14. Docker Build

### `Dockerfile` — Multi-Stage Build

```dockerfile
# Stage 1: Build
FROM golang:1.22-alpine AS build
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o /app/provision-engine ./cmd/provision-engine/

# Stage 2: Runtime
FROM alpine:3.19
RUN addgroup -S cloudbuilder && adduser -S cloudbuilder -G cloudbuilder -u 1000
USER cloudbuilder
EXPOSE 50051
ENTRYPOINT ["/app/provision-engine"]
```

### Características

| Caractere | Valor |
|---|---|
| **Base build** | `golang:1.22-alpine` |
| **Base runtime** | `alpine:3.19` |
| **CGO** | Desabilitado (`CGO_ENABLED=0`) → static binary |
| **Strip** | `-ldflags="-s -w"` → binary reduzido |
| **Non-root** | `cloudbuilder:cloudbuilder` (UID 1000) |
| **Porta** | `50051` (gRPC) |
| **Extra** | `ca-certificates` + `tzdata` |
| **Layer cache** | `go.mod`/`go.sum` copiados antes do source |

---

## 15. Pipeline de Deploy

### Fluxo Completo (Backend → Go Engine → Terraform)

```
Backend Spring Boot
  │
  │  POST /api/v1/canvases/{id}/generate
  │  ┌─────────────────────────────────────┐
  │  │  CodeGeneratorService               │
  │  │  1. Busca Canvas + Nodes do DB      │
  │  │  2. Monta CanvasDesign DTO          │
  │  │  3. Serializa para JSON             │
  │  │  4. Chama gRPC GenerateCode()       │
  │  └─────────────────────────────────────┘
  │
  ▼
Provision Engine (Go)
  │
  │  GenerateCode(designJSON)
  │  ┌─────────────────────────────────────┐
  │  │  ProvisionServer.GenerateCode()     │
  │  │  → Parse design JSON               │
  │  │  → Map nodes → built-in templates   │
  │  │  → Return main.tf + providers.tf    │
  │  │    + variables.tf + outputs.tf      │
  │  └─────────────────────────────────────┘
  │
  │  POST /api/v1/environments/{id}/deploy
  │  ┌─────────────────────────────────────┐
  │  │  Deploy(workspaceDir, engine)        │
  │  │  → DeploymentManager.Execute()      │
  │  │    → executor.Init()                │
  │  │    → executor.Plan()                │
  │  │    → stream de status (gRPC stream) │
  │  │  → Backend recebe DeployEvent       │
  │  └─────────────────────────────────────┘
  │
  │  POST /api/v1/environments/{id}/approve
  │  ┌─────────────────────────────────────┐
  │  │  ApprovePlan(workspaceDir, engine)   │
  │  │  → executor.Apply(tfplan)           │
  │  │  → EventPublisher.Publish(deploy    │
  │  │      .complete)                     │
  │  └─────────────────────────────────────┘
  │
  ▼
Terraform/OpenTofu (binário externo)
  │  init → plan → apply → state
  │
  ▼
Cloud Provider (AWS/Azure/GCP/K8s)
```

### Drift Detection Flow

```
Backend → DetectDrift(workspaceDir, designJSON)
  │
  ├── executor.Show() → terraform show -json (state atual)
  ├── drift.DetectDrift(stateJSON, designJSON) → DriftReport
  ├── EventPublisher.Publish(drift.detected ou drift.resolved)
  └── Retorna DriftResponse → Backend salva DriftReport no DB
```

---

## 16. Testes

### Suites de Teste (23 testes, 7 arquivos)

| Suite | Arquivo | Testes | O Que Cobre |
|---|---|---|---|
| **Server** | `api/grpc/server_test.go` | 9 | GenerateCode (vazio, VPC, multi-recurso, tipo desconhecido, JSON inválido, duplicatas), ApprovePlan (workspace vazio), NewProvisionServer |
| **Drift** | `drift/detector_test.go` | 6 | No drift, missing resource, extra resource, combined, invalid JSON, empty design |
| **Executor** | `executor/engine_test.go` | — | Testes de criação e engine type |
| **Deployment** | `executor/deployment_test.go` | — | Testes de DeploymentManager |
| **Generator** | `generator/terraform/generator_test.go` | — | Testes do Generator |
| **Event** | `messaging/event_test.go` | — | Testes do EventPublisher |
| **Stream** | `messaging/stream_test.go` | — | Testes do SubscribeToEvents |
| **Plan** | `parser/plan_test.go` | — | Testes de parse de plano |
| **State** | `parser/state_test.go` | — | Testes de parse de state |
| **Provider** | `provider/templates/aws_test.go` | — | Testes de templates AWS |

### Padrões de Teste

- **Tabela de cenários**: TestGenerateCode_WithMultipleResourceTypes
- **Edge cases**: JSON inválido, workspace vazio, design vazio, drift combinado
- **Assert helpers**: `contains(s, substr)` — busca textual em output HCL
- **Sem mocks**: Testes unitários diretos sem mock de dependências externas (com exceção de executor que executa binários reais)

---

## 17. Referências

### ADRs Relacionados

| ADR | Título | Relação |
|---|---|---|
| ADR-009 | Auto-Documentação | Pipeline de geração de documentação técnica |
| ADR-016 | (planejado) Go Engine Architecture | Decisões arquiteturais do motor |

### Backend Java (Spring Boot)

Os seguintes serviços no backend Spring Boot consomem o Go Engine:

- `CodeGeneratorService` (`provision/domain/service/`) — Chama `GenerateCode` gRPC
- `StateController` (`provision/infrastructure/web/`) — Expõe endpoints de deploy/drift
- `DriftDetectionService` (`provision/domain/service/`) — Orquestra detecção de drift

### Diagrama de Integração

```
┌─────────────────────────────────────────────────────────────┐
│                     Docker Compose                          │
│                                                             │
│  ┌──────────────┐    gRPC (:50051)    ┌──────────────────┐  │
│  │  Backend     │◄───────────────────►│  Provision Eng.  │  │
│  │  Spring Boot │                     │  Go 1.22         │  │
│  │  :8080       │                     │                  │  │
│  └──────────────┘                     │  ┌────────────┐  │  │
│                                       │  │ Executor   │──┼──┤──► Terraform
│  ┌──────────────┐                     │  └────────────┘  │  │
│  │  Frontend    │  WebSocket (:8765)  │  ┌────────────┐  │  │
│  │  Vite :3000  │◄────────────────────│─│ Collab Srv │  │  │
│  └──────────────┘                     │  └────────────┘  │  │
│                                       └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Comandos Úteis

```bash
# Build
cd provision-engine
go build -o provision-engine.exe ./cmd/provision-engine/

# Testes
go test ./... -v

# Executar servidor gRPC
./provision-engine --port 50051

# Executar servidor de colaboração
./provision-engine collab-server --port 8765

# Ver health
curl http://localhost:8765/health

# Docker build
docker build -t cloudbuilder/provision-engine:latest .

# gRPC reflection (com grpcurl)
grpcurl -plaintext localhost:50051 list
grpcurl -plaintext localhost:50051 list provision.ProvisionService
```
