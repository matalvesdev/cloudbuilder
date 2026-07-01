# ADR-033: Go Engine DAG Pipeline Architecture

**Status**: Proposed
**Date**: 2026-06-24
**Author**: Cloud Native Agent + Principal Architect
**References**: ADR-012 (Q3 Operations), ADR-020 (Policy-as-Code OPA), `cloud-infrastructure-patterns-compare.md` (Competitive Analysis)

> **Baseado em pesquisa competitiva**: Grafana Agent Flow (component DAG), Crossplane v2.0+ (composition functions pipeline), Pulumi (Automation API), Datadog Agent (Fx DI framework)

---

## Context

O Go engine do CloudBuilder (`provision-engine/`) gera código Terraform/OpenTofu a partir de designs visuais. Atualmente, a arquitetura é **linear e monolítica**:

### Arquitetura Atual

```
provision-engine/
├── cmd/provision-engine/main.go       → Cobra CLI + gRPC server
├── internal/
│   ├── api/grpc/server.go             → Handlers: GenerateCode, Deploy, Plan, Drift
│   ├── generator/terraform/generator.go → Generate(CanvasDesign) string (MONOLÍTICO)
│   ├── executor/engine.go              → Terraform/OpenTofu CLI wrapper
│   ├── drift/detector.go               → Drift detection (design vs state)
│   ├── parser/                         → Plan + State JSON parsing
│   ├── provider/templates/aws.go       → Template functions (ResourceTemplate)
│   └── model/design.go                 → CanvasDesign, DesignNode, Edge
```

### Problemas Identificados

| # | Problema | Impacto |
|---|----------|---------|
| **P1** | `Generator.Generate()` é monolítico — header + provider blocks + templates + outputs em um método só | Impossível reutilizar estágios; difícil testar isoladamente |
| **P2** | Templates são funções `map[string]ResourceTemplate` — sem validação, transformação, ou composição | Cada template precisa implementar toda a lógica do zero |
| **P3** | Não há pipeline de validação antes da geração — erros só aparecem no HCL malformado | Feedback lento para o usuário |
| **P4** | Propriedades não são transformadas — o que vem do canvas vai direto para o template | Sem normalização, defaults, ou type coercion |
| **P5** | Dependências entre recursos (edges) resolvidas manualmente em cada template | Duplicação de lógica de resolução de referências |
| **P6** | Apenas Terraform HCL como output — sem suporte a Pulumi, Crossplane, CDK, ou OpenTofu | Vendor lock-in de formato de saída |
| **P7** | Sem hooks de pós-processamento — outputs, variáveis, providers são gerados ad-hoc | Cada novo provider requer mudanças no core |
| **P8** | Drift detection opera em nível de string JSON, não em modelo tipado | Propenso a erros de parsing e falsos positivos |

### Drivers Técnicos

- CloudBuilder roadmap (Fase 1) prioriza pipeline programável como capacidade #1
- Competidores (Grafana Alloy, Crossplane) já adotaram arquitetura DAG com sucesso comprovado
- Necessidade de suportar múltiplos formatos de saída (Terraform, Pulumi, Crossplane, CDK)
- Provedores comunitários precisam de interface padronizada (plugin SDK)

---

## Decision

### Adotar Arquitetura DAG Pipeline no Go Engine

Substituir a geração linear de código por um **pipeline de componentes conectados em grafo acíclico direcionado (DAG)**, onde cada componente executa uma etapa especializada e se comunica via interfaces tipadas.

#### Arquitetura Proposta

```
┌─────────────────────────────────────────────────────────────────────┐
│                      DAG PIPELINE CONTROLLER                        │
│  (scheduler, health, evaluation, lifecycle)                         │
└─────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│  PIPELINE STAGES (componentes conectados em DAG)                   │
│                                                                     │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐        │
│  │  Input   │──▶│ Validate │──▶│  Map     │──▶│ Resolve  │         │
│  │  Adapter │   │ Pipeline │   │ Provider │   │ Deps     │         │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘        │
│       │              │              │              │                │
│       ▼              ▼              ▼              ▼                │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐        │
│  │ Template │──▶│ Post-    │──▶│ Formatter│──▶│ Output   │         │
│  │ Renderer │   │ Process  │   │          │   │ Adapter  │         │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘        │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Provider Registry (AWS / Azure / GCP / K8s / Custom)      │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Componentes do Pipeline

Cada componente implementa uma interface comum:

```go
// Component é a interface base para todos os componentes do pipeline.
type Component[T any] interface {
    // Name retorna o nome único do componente.
    Name() string

    // Run executa a lógica do componente.
    // ctx fornece cancelamento e tracing.
    // input é o tipo de entrada do componente.
    // output é o tipo de saída.
    Run(ctx context.Context, input T) (T, error)

    // Health retorna o estado de saúde do componente.
    Health(ctx context.Context) ComponentHealth
}

type ComponentHealth struct {
    Healthy bool
    Message string
    LastRun time.Time
    Duration time.Duration
}
```

#### Stage 1 — InputAdapter
**Entrada**: `CanvasDesign` (JSON do frontend)
**Saída**: `PipelineInput` (modelo tipado e normalizado)
**Responsabilidades**:
- Parsing e validação do JSON de entrada
- Normalização de nomes de recursos (formato canônico)
- População de defaults para propriedades ausentes
- Classificação de recursos por provider

```go
type PipelineInput struct {
    Resources []ResourceSpec
    Edges     []EdgeSpec
    Metadata  PipelineMetadata
}

type ResourceSpec struct {
    ID         string
    Type       string         // ex: "aws_vpc", "gcp_compute_instance"
    Provider   ProviderType
    Properties map[string]any // já normalizadas
    Dependencies []string     // IDs dos recursos dos quais depende
}
```

#### Stage 2 — ValidatePipeline
**Entrada**: `PipelineInput`
**Saída**: `PipelineInput` (mesmo, se válido) ou erro
**Responsabilidades**:
- Validação de propriedades obrigatórias (por tipo de recurso)
- Validação de tipos (string, number, CIDR, ARN, etc.)
- Validação de conectividade (edges compatíveis)
- Validação de unicidade (nomes/id únicos)
- Validação de limites (counts, tamanhos, ranges)

```go
// ValidationRule é uma regra de validação independente e testável.
type ValidationRule interface {
    Name() string
    Validate(ctx context.Context, input *PipelineInput) ValidationResult
}

// ValidationResult
type ValidationResult struct {
    Valid  bool
    Errors []ValidationError
}
```

Regras iniciais (reaproveitadas do backend Java):
- `RequiredPropertiesRule` — propriedades obrigatórias por tipo
- `CidrOverlapRule` — CIDRs não podem se sobrepor
- `ConnectionCompatibilityRule` — tipos de conexão compatíveis
- `ResourceNamingRule` — nomes seguem padrão `^[a-z][a-z0-9_]*$`
- `ProviderLimitRule` — limites por provider (ex: max 5 VPCs)

#### Stage 3 — MapProvider
**Entrada**: `PipelineInput`
**Saída**: `ProviderInput` (recursos mapeados para providers específicos)
**Responsabilidades**:
- Roteamento de cada recurso para seu provider handler
- Transformação de nomes genéricos em tipos específicos do provider
- Resolução de parâmetros específicos do provider (regiões, zones, tiers)
- Injeção de variáveis de ambiente do provider

```go
type ProviderInput struct {
    Provider  ProviderType
    Resources []ProviderResource
    Config    ProviderConfig
}

type ProviderHandler interface {
    Type() ProviderType
    MapResource(ctx context.Context, spec ResourceSpec) (*ProviderResource, error)
    DefaultConfig() ProviderConfig
}
```

#### Stage 4 — ResolveDeps
**Entrada**: `ProviderInput`
**Saída**: `ProviderInput` (com dependências resolvidas)
**Responsabilidades**:
- Análise do grafo de dependências entre recursos (a partir dos edges do canvas)
- Resolução topológica da ordem de criação
- Detecção de ciclos
- Geração de referências entre recursos (`aws_vpc.main.id` → `aws_subnet.main.vpc_id`)
- Injeção de `depends_on` implícitos e explícitos

```go
type DependencyGraph struct {
    Nodes     []string          // IDs topologicamente ordenados
    Edges     map[string][]string // dependências (source → targets)
    Cycles    [][]string        // ciclos detectados, se houver
}

func ResolveDependencies(resources []ResourceSpec, edges []EdgeSpec) (*DependencyGraph, error) {
    // Implementa topological sort (Kahn's algorithm)
    // Detecta grafos desconectados
    // Retorna ordem de criação
}
```

#### Stage 5 — TemplateRenderer
**Entrada**: `ProviderInput` (com dependências resolvidas)
**Saída**: `RenderedTemplates`
**Responsabilidades**:
- Renderização de cada recurso usando templates específicos do provider
- Substituição de referências entre recursos (ex: `${aws_vpc.main.id}`)
- Suporte a múltiplos formatos de saída:
  - **Terraform HCL** (existente — migrar templates atuais)
  - **OpenTofu** (já suportado via executor)
  - **Pulumi** (TypeScript/Python) — novo
  - **Crossplane** (YAML) — novo
  - **CDKTF** (TypeScript) — novo

```go
type RenderedTemplates struct {
    Terraform map[string]string // filename → HCL content
    Pulumi    map[string]string // filename → TS/Python content
    Crossplane map[string]string // filename → YAML content
    Metadata  RenderMetadata
}

type Renderer interface {
    Format() OutputFormat
    RenderResource(ctx context.Context, resource *ProviderResource, deps *DependencyGraph) (string, error)
    RenderProvider(ctx context.Context, config ProviderConfig) (string, error)
    RenderOutputs(ctx context.Context, resources []ProviderResource) (string, error)
}
```

#### Stage 6 — PostProcess
**Entrada**: `RenderedTemplates`
**Saída**: `RenderedTemplates` (modificado)
**Responsabilidades**:
- Injeção de headers, comentários, e metadados
- Formatação consistente (indentação, spacing)
- Otimização de HCL (remoção de blanks, compressão)
- Geração de `variables.tf`, `outputs.tf`, `providers.tf`, `versions.tf`
- Aplicação de políticas (OPA) antes da saída final

#### Stage 7 — Formatter
**Entrada**: `RenderedTemplates`
**Saída**: `RenderedTemplates` (formatado)
**Responsabilidades**:
- Formatação HCL via `terraform fmt` (ou equivalente embutido)
- Formatação TypeScript/Python via prettier/black
- Lint básico (detecção de erros comuns)
- Validação sintática (HCL parser)

#### Stage 8 — OutputAdapter
**Entrada**: `RenderedTemplates`
**Saída**: `GenerateCodeResponse` (gRPC response)
**Responsabilidades**:
- Empacotamento dos arquivos gerados em resposta gRPC
- Resumo da geração (contagem de recursos, providers, avisos)
- Logs de saúde do pipeline para observabilidade

### Component Controller

Inspirado no Grafana Agent Flow:

```go
// PipelineController gerencia o ciclo de vida do pipeline DAG.
type PipelineController struct {
    components   map[string]Component[any]
    dag          *dag.AcyclicGraph
    health       map[string]ComponentHealth
    eventBus     *EventBus
}

func NewPipelineController() *PipelineController {
    return &PipelineController{
        components: make(map[string]Component[any]),
        dag:        dag.NewAcyclicGraph(),
        health:     make(map[string]ComponentHealth),
    }
}

// Register adiciona um componente ao DAG.
func (c *PipelineController) Register(comp Component[any], deps ...string) error {
    name := comp.Name()
    c.components[name] = comp
    c.dag.AddVertex(name)
    for _, dep := range deps {
        c.dag.AddEdge(name, dep) // name depende de dep
    }
    return nil
}

// Execute executa todo o pipeline em ordem topológica.
func (c *PipelineController) Execute(ctx context.Context, input any) (any, error) {
    order, err := c.dag.TopologicalOrder()
    if err != nil {
        return nil, fmt.Errorf("pipeline DAG has cycle: %w", err)
    }

    results := make(map[string]any)
    results["__input__"] = input

    for _, name := range order {
        comp := c.components[name]
        deps := c.dag.Dependencies(name)

        // Coleta entradas das dependências
        var componentInput any
        if len(deps) == 0 {
            componentInput = input
        } else {
            // Última dependência como input principal
            componentInput = results[deps[len(deps)-1]]
        }

        start := time.Now()
        output, err := comp.Run(ctx, componentInput)
        duration := time.Since(start)

        c.health[name] = ComponentHealth{
            Healthy:  err == nil,
            Message:  fmt.Sprintf("ran in %v", duration),
            LastRun:  time.Now(),
            Duration: duration,
        }

        if err != nil {
            return nil, fmt.Errorf("pipeline stage %q failed: %w", name, err)
        }

        results[name] = output
    }

    // Último componente na ordenação topológica é a saída final
    return results[order[len(order)-1]], nil
}
```

### Provider Registry

```go
// ProviderRegistry gerencia o registro e descoberta de providers.
type ProviderRegistry struct {
    providers map[ProviderType]ProviderHandler
    templates map[OutputFormat]map[ProviderType]map[string]TemplateFunc
}

// RegisterProvider adiciona um novo provider ao registry.
func (r *ProviderRegistry) RegisterProvider(p ProviderHandler) {
    r.providers[p.Type()] = p
}

// RegisterTemplate adiciona um template de recurso para um provider/format.
func (r *ProviderRegistry) RegisterTemplate(provider ProviderType, resourceType string, format OutputFormat, fn TemplateFunc) {
    // Inicializa mapas aninhados se necessário
    // Registra função de template
}

// ProviderPlugin é a interface para plugins de provider (carregados dinamicamente).
type ProviderPlugin interface {
    Init(ctx context.Context) error
    Provider() ProviderHandler
    Templates(format OutputFormat) map[string]TemplateFunc
    ValidationRules() []ValidationRule
}
```

### Fluxo de Dados Tipado

```
PipelineInput ──▶ ProviderInput ──▶ RenderedTemplates ──▶ GenerateCodeResponse
     │                  │                    │
     ▼                  ▼                    ▼
  Validação         Mapeamento           Formatação
  (sem perder       (preserva           (preserva
   informação)       contexto)           metadados)
```

Cada estágio preserva e enriquece o contexto, nunca descarta informação sem necessidade. O `PipelineInput` original é transportado como metadados para estágios posteriores.

---

## Alternatives Considered

### A1: Refatoração incremental (status quo melhorado)
Manter a arquitetura atual mas extrair métodos.

**Prós**: Menor esforço inicial, compatibilidade retroativa.
**Contras**: Não resolve P3-P8, arquitetura continua linear, difícil adicionar novos formatos de saída, acoplamento permanece alto.
**Veredito**: Rejeitado — não escala para multi-format e multi-provider.

### A2: Plugin architecture via hashicorp/go-plugin
Usar plugin system do HashiCorp para carregar providers em processos separados (como Terraform faz).

**Prós**: Isolamento total de providers, recarregável em runtime.
**Contras**: Complexidade de gRPC bidirecional, overhead de IPC, debugging difícil. Para o volume de providers do CloudBuilder (dezenas, não centenas), o overhead não se justifica.
**Veredito**: Rejeitado — complexidade desnecessária para o estágio atual.

### A3: OpenTelemetry Collector distribution (fork do OTel)
Adotar o OTel Collector como base e adicionar componentes customizados (como Grafana Alloy fez).

**Prós**: Ecossistema OTel maduro, pipeline pronto, centenas de componentes existentes.
**Contras**: Go engine atual não tem relação com OTel — seria reescrever do zero. OTel Collector é focado em telemetria, não em IaC. A abstração não se encaixa.
**Veredito**: Rejeitado — mismatch de domínio (Otel é para telemetria, CloudBuilder é para provisionamento).

### A4: DAG Pipeline Nativo (ESCOLHIDO)
Implementar DAG controller próprio, leve e específico para IaC.

**Prós**: Zero dependências externas, controle total do lifecycle, tipado fortemente, extensível por interface Go, testável isoladamente.
**Contras**: Mais esforço inicial que A1, mas menor que A2/A3.
**Veredito**: Escolhido — melhor relação custo/benefício para o roadmap.

---

## Consequences

### Positivas
1. **Composabilidade**: Providers podem ser adicionados registrando handlers — sem modificar o core.
2. **Testabilidade**: Cada componente é testável isoladamente com mocks das interfaces.
3. **Multi-formato**: Um design visual pode gerar Terraform, Pulumi, Crossplane, ou CDKTF.
4. **Validação precoce**: Erros detectados no Stage 2, não no HCL final.
5. **Observabilidade**: Cada componente expõe health, duration, e últimos erros.
6. **Extensibilidade**: Plugin SDK permite que a comunidade crie providers sem fork.
7. **Reuso**: Lógica de resolução de dependências, validação CIDR, e formatação é compartilhada.

### Negativas
1. **Esforço de migração**: Templates existentes precisam ser adaptados para o novo formato.
2. **Curva de aprendizado**: Contribuidores precisam entender DAG e interfaces.
3. **Overhead de desempenho**: Pipeline adiciona ~1-5ms de latência vs geração direta (desprezível para IaC).

### Mitigações
1. **Wrapper de compatibilidade**: Adaptador que converte templates `ResourceTemplate` existentes para o novo formato de componentes.
2. **Documentação e exemplos**: 3+ exemplos de providers implementados com o SDK.
3. **Benchmarking**: Testes de performance comparando geração direta vs pipeline (alvo: <10ms de overhead).

### Plano de Migração

| Fase | Escopo | Esforço | Dependências |
|------|--------|:-------:|-------------|
| **1** | Implementar `Component` interface + `PipelineController` | 1 sprint | Nenhuma |
| **2** | Implementar `ValidatePipeline` com regras existentes | 1 sprint | Fase 1 |
| **3** | Implementar `InputAdapter` + `MapProvider` + `ProviderRegistry` | 2 sprints | Fase 1 |
| **4** | Implementar `ResolveDeps` com topological sort | 1 sprint | Fase 3 |
| **5** | Migrar templates existentes para `TemplateRenderer` + wrapper | 2 sprints | Fase 3-4 |
| **6** | Implementar `OutputAdapter` + suporte OpenTofu nativo | 1 sprint | Fase 5 |
| **7** | Implementar `PostProcess` + formatação HCL | 1 sprint | Fase 5 |
| **8** | Adicionar suporte Pulumi (TypeScript) | 3 sprints | Fase 5-7 |
| **9** | Adicionar suporte Crossplane (YAML) | 2 sprints | Fase 5-7 |
| **10** | Plugin SDK para providers comunitários | 2 sprints | Fase 5-7 |

**Total estimado**: 14 sprints (Q3 2026 - Q1 2027)

### Mapa de Migração (Código Existente)

```
Arquivo Atual                      → Novo Componente
──────────────────────────────────────────────────────
generator/terraform/generator.go   → TemplateRenderer (Terraform)
  generateHeader()                 → PostProcess (header injection)
  generateProviderBlock()          → MapProvider (provider routing)
  generateOutputBlocks()           → PostProcess (output generation)
  Generate() → ...                 → PipelineController.Execute()

api/grpc/server.go                 → InputAdapter + OutputAdapter
  GenerateCode()                   → PipelineController.Execute()
  GetPlan()                        → Executor (unchanged)
  DetectDrift()                    → ResolveDeps + diff engine

provider/templates/aws.go          → ProviderRegistry + ProviderHandler
  GetTemplate()                    → ProviderRegistry.GetTemplate()
  ResourceTemplate type            → TemplateRenderer (formatted)

executor/engine.go                 → Unchanged (runs terraform/tofu CLI)
  Executor struct                  → Permanece como está
  Init, Plan, Apply, Show          → Chamado pelo PostProcess para fmt

drift/detector.go                  → Novos componentes:
  DetectDrift()                    → DriftDetector (Component)
  DriftReport                      → PipelineInput diff analysis
```

---

## Compatibility

### Retroativa
- O `GenerateCode` gRPC handler existente será adaptado para chamar `PipelineController.Execute()` internamente.
- Clientes existentes (backend Java) não precisam de mudanças — a API gRPC permanece idêntica.
- Templates AWS/Azure/GCP atuais têm wrapper de compatibilidade.

### Com a Stack Existente
- **Backend Java**: Nenhuma mudança — gRPC proto permanece o mesmo.
- **Frontend**: Nenhuma mudança — API REST para o backend permanece.
- **Executor**: Permanece inalterado — pipeline gera arquivos, executor aplica.

### Com Competidores (Alvo Futuro)

| Formato de Saída | Status | Prioridade |
|-----------------|--------|:----------:|
| Terraform HCL | ✅ Existente (migrar) | Imediata |
| OpenTofu | ✅ Existente (via executor) | Imediata |
| Pulumi TypeScript | 🔄 Pipeline habilitará | Q4 2026 |
| Crossplane YAML | 🔄 Pipeline habilitará | Q1 2027 |
| CDKTF TypeScript | 🔄 Pipeline habilitará | Q1 2027 |

---

## Open Questions

1. **Formato de template**: Usar Go `text/template` existente, ou migrar para um template engine mais expressivo (ex: `jet`, `templ`)?
   - **Proposta**: Manter `text/template` para consistência, avaliar `templ` se performance for problema.

2. **Cache de pipeline**: Em cenários de regeneração frequente (ex: preview), devemos cachear estágios intermediários?
   - **Proposta**: Cache opcional via content-addressed storage (SHA256 do input de cada estágio). Implementar como componente wrapper.

3. **Execução distribuída**: Em cenário multi-tenant, o pipeline deve executar no Go engine ou ser delegável?
   - **Proposta**: Pipeline executa localmente no Go engine. Se necessário, o controller pode serializar o DAG e distribuir.

4. **Versionamento de pipeline**: Cada pipeline deve ter uma versão (para compatibilidade com templates antigos)?
   - **Proposta**: `PipelineVersion` no metadata. Templates declaram compatibilidade com `>= X.Y`.

---

## References

### Documentação Oficial
- Grafana Agent Flow Architecture: https://grafana.com/docs/agent/latest/flow/concepts/component_controller/
- Crossplane Composition Functions: https://docs.crossplane.io/latest/composition/compositions/
- Datadog Agent Architecture: https://docs.datadoghq.com/agent/architecture/

### Pesquisa CloudBuilder
- `docs/architecture/cloud-infrastructure-patterns-compare.md` — Seção 11.1 (Padrões de Agentes), Seção 12 (Roadmap Priorizado, Item 1.1)
- ADR-012 — Q3 Operations Architecture (padrão de pipeline)
- ADR-020 — Policy-as-Code OPA (Stage 6 deve integrar com OPA)

### Código Fonte
- `provision-engine/internal/generator/terraform/generator.go` — Generator atual (157 linhas, monolítico)
- `provision-engine/internal/provider/templates/aws.go` — Template functions atuais
- `provision-engine/internal/api/grpc/server.go` — gRPC handlers atuais (313 linhas)
- `provision-engine/internal/executor/engine.go` — Executor (permanece inalterado)
- `provision-engine/internal/drift/detector.go` — Drift detection (84 linhas)

### Padrões
- Go Interface Segregation Principle (ISP) — componentes pequenos e focados
- Pipe and Filter Architecture — pipeline de processamento em estágios
- Strategy Pattern — ValidationRule, ProviderHandler, Renderer
- Dependency Injection — componentes recebem dependências via constructor
