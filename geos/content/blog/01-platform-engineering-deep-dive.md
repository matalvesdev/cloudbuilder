# Platform Engineering na Prática: Arquitetura de uma IDP com Canvas Visual

**Autor**: CloudBuilder Team | **Leitura**: 12 min | **Categoria**: Platform Engineering

---

## Por que escrevemos isso

A maioria dos artigos sobre Platform Engineering para em "é criar uma IDP". Nós vamos além: mostramos a arquitetura real, os trade-offs, e como implementar uma plataforma visual que transforma diagramas em infraestrutura rodando.

## O problema real

Uma equipe de 30 desenvolvedores precisa provisionar infraestrutura. O fluxo atual:

```
Dev precisa de infraestrutura
    → Abre ticket para time de platform
    → Platform engineer escreve Terraform (2-3 dias)
    → Code review (1-2 dias)
    → Aprovação manual (1 dia)
    → Deploy via CLI (30 min)
    → Resultado: 5-7 dias de espera
```

Enquanto isso, o dev está bloqueado. Ou pior: cria infraestrutura por fora, sem governança, gerando custos ocultos e vulnerabilidades.

## O que uma IDP realmente precisa

Uma Internal Developer Platform não é apenas um catálogo de templates. É um sistema com 5 camadas:

```
┌─────────────────────────────────────────┐
│  1. Visual Design (Canvas)              │  ← Onde o dev projeta
├─────────────────────────────────────────┤
│  2. Code Generation (Templates)         │  ← Onde vira Terraform
├─────────────────────────────────────────┤
│  3. Policy Engine (OPA/Rego)            │  ← Onde valida compliance
├─────────────────────────────────────────┤
│  4. Provisioning (Go Engine)            │  ← Onde executa na cloud
├─────────────────────────────────────────┤
│  5. Observability (Metrics/Traces)      │  ← Onde monitora resultado
└─────────────────────────────────────────┘
```

Cada camada tem responsabilidades claras e interfaces definidas. Vamos detalhar cada uma.

## Camada 1: Canvas Visual

O canvas é a interface primária do desenvolvedor. Ele não precisa escrever Terraform — precisa **pensar em arquitetura**.

### Arquitetura técnica

```
React 19 + TypeScript
    ↓
ReactFlow v12 (@xyflow/react)
    ↓
Zustand Store (30+ stores)
    ↓
REST API → Spring Boot Backend
```

### Componentes do canvas

O canvas não é apenas "arrastar e soltar". Cada componente tem uma **schema definition** que define:

```typescript
// ComponentDefinition — o que o canvas sabe sobre cada recurso
interface ComponentDefinition {
  id: string;
  provider: "aws" | "google" | "azurerm" | "kubernetes";
  resourceType: string;        // ex: "google_compute_network"
  displayName: string;         // ex: "VPC"
  category: string;            // ex: "network"
  icon: string;                // ex: "lucide-network"
  color: string;               // ex: "#4285F4"
  propertiesSchema: PropertySchema[];  // formulário de configuração
  connectionRules: ConnectionRule[];   // quais conexões são válidas
}
```

### Validação de conexões

Quando um dev conecta dois recursos, o canvas valida se a conexão faz sentido:

```typescript
// connectionRules.ts — validação por provider
const GCP_RULES = {
  "google_compute_network": {
    canConnectTo: ["google_compute_subnetwork", "google_compute_firewall"],
    canReceiveFrom: [],  // VPC não recebe conexões
  },
  "google_compute_subnetwork": {
    canConnectTo: ["google_compute_instance", "google_sql_database_instance"],
    canReceiveFrom: ["google_compute_network"],
  },
};
```

Se o dev tentar conectar uma VPC diretamente a uma VM (sem subnet), o canvas mostra um erro antes de gerar código.

## Camada 2: Code Generation

O CodeGeneratorService traduz o design visual em Terraform válido. Não é um template estático — é um gerador inteligente.

### Arquitetura

```
CanvasDesign (JSON)
    ↓
CodeGeneratorService
    ↓
resolveTemplate() → BuiltInTemplate ou DB template
    ↓
renderTemplate() → regex substitution {{variable}}
    ↓
GeneratedCode (5 arquivos HCL)
```

### Built-in templates

O CloudBuilder vem com templates para os recursos mais comuns:

```java
// CodeGeneratorService.java
builtInTemplates.put("google_compute_network", new BuiltInTemplate(
    """
    resource "google_compute_network" "{{id}}" {
      name                    = "{{name}}"
      auto_create_subnetworks = {{auto_create_subnetworks}}
      routing_mode            = "{{routing_mode}}"
      project                 = var.gcp_project_id
    }
    """,
    List.of(
        new VariableDef("gcp_project_id", "string", "GCP project ID", "my-project"),
        new VariableDef("gcp_region", "string", "GCP region", "us-central1")
    ),
    List.of(
        new OutputDef("network_id", "The network ID",
            "google_compute_network.{{id}}.id")
    )
));
```

### O que é gerado

Para um canvas com VPC + Subnet + VM + SQL:

```
main.tf          → 4 resources (google_compute_network, subnetwork, instance, sql)
variables.tf     → gcp_project_id, gcp_region
outputs.tf       → network_id, subnet_id, instance_id, sql_instance_id
providers.tf     → provider "google" { project = var.gcp_project_id }
versions.tf      → required_providers { google = { source = "hashicorp/google" } }
```

**5 arquivos. 4 recursos. Zero erros de sintaxe.**

## Camada 3: Policy Engine

Antes de provisionar, o design passa pelo OPA (Open Policy Agent) para validação de compliance.

### Exemplo de política Rego

```rego
# policy/gcp_network.rego
package cloudbuilder.gcp.network

deny[msg] {
  resource := input.resources[_]
  resource.type == "google_compute_network"
  resource.properties.auto_create_subnetworks == true
  msg := "VPC deve ter auto_create_subnetworks = false (production)"
}

deny[msg] {
  resource := input.resources[_]
  resource.type == "google_compute_instance"
  not resource.properties.boot_disk.encrypted
  msg := "Disco de boot deve estar criptografado"
}
```

### Fluxo de validação

```
Canvas Design
    ↓
OPA Engine (Rego policies)
    ↓
┌──────────────┬──────────────┐
│  ✅ Approved  │  ❌ Denied    │
│  → Provision │  → Show errors│
└──────────────┴──────────────┘
```

## Camada 4: Provisioning

O Go provision engine executa Terraform de forma isolada e segura.

### Arquitetura

```
Backend (Java)
    ↓ gRPC/REST
Go Provision Engine
    ↓
terraform init → plan → apply
    ↓
Cloud Provider (GCP/AWS/Azure)
```

### O que o Go engine faz

1. **Recebe** o payload com arquivos Terraform + credenciais
2. **Escreve** os arquivos em diretório temporário
3. **Executa** `terraform init` (download providers)
4. **Executa** `terraform plan` (preview de mudanças)
5. **Executa** `terraform apply` (cria recursos reais)
6. **Retorna** status + outputs

### Segurança de credenciais

As credenciais nunca ficam no banco de dados em texto claro:

```
Credential (encrypted with AES-256-GCM)
    ↓
ProvisionController.buildCredentialEnvVars()
    ↓
GOOGLE_CREDENTIALS / AWS_ACCESS_KEY_ID / ARM_CLIENT_ID
    ↓
Go engine (injected as env vars, never persisted)
```

## Camada 5: Observability

Após provisionar, a plataforma monitora os recursos automaticamente.

### Métricas coletadas

```
metrics_ts (Time Series)
    ↓
tenant_id, metric_name, tags, value, timestamp
    ↓
Dashboard em tempo real
```

### Anomaly Detection

O CloudBuilder detecta custos fora do padrão:

```java
// Moving average de 7 dias
double movingAvg = calculateMovingAverage(metricName, 7);
double stdDev = calculateStdDev(metricName, 7);
double threshold = movingAvg + (2 * stdDev);  // 2σ

if (currentValue > threshold) {
    createAnomalyAlert(metricName, currentValue, threshold);
}
```

## Fluxo completo: Design → Produção

```
1. Dev abre CloudBuilder
    ↓
2. Escolha template (GCP Web App)
    ↓
3. Canvas carrega com 4 recursos
    ↓
4. Dev ajusta propriedades (machine_type, region, etc.)
    ↓
5. Clique em "Gerar Código"
    ↓
6. CodeGeneratorService produz 5 arquivos HCL
    ↓
7. Dev revisa código gerado
    ↓
8. Dev seleciona credencial GCP
    ↓
9. Clique em "Provisionar"
    ↓
10. Go engine: terraform init → plan → apply
    ↓
11. Infraestrutura rodando no GCP
    ↓
12. Observability conecta automaticamente
    ↓
13. Dashboard mostra métricas dos recursos
```

**Tempo total: 5 minutos.** Sem tickets. Sem espera. Sem erros de digitação.

## Métricas que importam

| Métrica | Antes (manual) | Depois (CloudBuilder) |
|---------|----------------|----------------------|
| Tempo de provisioning | 5-7 dias | 5 minutos |
| Erros de configuração | 15-20% | < 1% |
| Custo por provisionamento | R$ 500 (horas de engenheiro) | R$ 0 (self-service) |
| Compliance violations | Não medido | 0 (OPA enforced) |

## Conclusão

Platform Engineering não é sobre criar mais uma ferramenta. É sobre criar um **sistema** que elimina o gargalo entre intenção e execução.

O CloudBuilder implementa as 5 camadas de uma IDP real: visual design, code generation, policy enforcement, provisioning, e observability. Tudo integrado. Tudo auditável. Tudo self-service.

**Quer ver na prática?** [Acesse cloudbuilder.io](https://cloudbuilder.io) e crie seu primeiro design em 5 minutos.

---

## Tags

`#PlatformEngineering` `#IDP` `#InternalDeveloperPlatform` `#Terraform` `#GCP` `#AWS` `#Azure` `#InfrastructureAsCode` `#CloudArchitecture`
