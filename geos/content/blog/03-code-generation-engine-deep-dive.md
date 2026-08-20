# Por Baixo dos Panos: Como o CloudBuilder Gera Terraform a partir de um Canvas Visual

**Autor**: CloudBuilder Team | **Leitura**: 9 min | **Categoria**: Engineering Deep Dive

---

## O que acontece entre "arrastar um nó" e "ter um main.tf"

Quando um desenvolvedor arrasta um recurso para o canvas e clica em "Gerar Código", acontece uma cadeia de operações que transforma JSON em HCL válido. Neste artigo, vamos dissecar cada etapa.

## Arquitetura geral

```
Canvas (ReactFlow)
    ↓ JSON (nodes + edges)
CanvasDesignFetcher
    ↓ DesignNode[] + DesignEdge[]
CodeGeneratorService
    ↓ Template resolution + rendering
GeneratedCode
    ↓ 5 arquivos HCL
```

## Passo 1: Fetching do Design

O `CanvasDesignFetcherImpl` busca o canvas do banco e converte para o formato interno:

```java
// CanvasDesignFetcherImpl.java
public CanvasDesign fetchCanvasDesign(String canvasId) {
    Canvas canvas = canvasRepository.findById(canvasId)
        .orElseThrow(() -> new IllegalArgumentException("Canvas not found"));

    List<DesignNode> nodes = canvas.getCanvasNodes().stream()
        .map(this::toDesignNode)
        .toList();

    List<DesignEdge> edges = canvas.getCanvasEdges().stream()
        .map(this::toDesignEdge)
        .toList();

    return new CanvasDesign(canvas.getId(), canvas.getName(), nodes, edges);
}
```

### O problema do JSON aninhado

O frontend salva propriedades em JSON aninhado:

```json
{
  "label": "main-vpc",
  "provider": "google",
  "resourceType": "google_compute_network",
  "properties": {
    "name": "main-vpc",
    "auto_create_subnetworks": "false",
    "routing_mode": "REGIONAL"
  }
}
```

O backend precisa extrair o `properties` interno:

```java
private Map<String, String> parseProperties(String propertiesJson) {
    Map<String, Object> outer = objectMapper.readValue(propertiesJson, ...);
    Object innerProps = outer.get("properties");
    if (innerProps instanceof Map<?, ?> innerMap) {
        Map<String, String> result = new LinkedHashMap<>();
        for (Map.Entry<?, ?> entry : innerMap.entrySet()) {
            result.put(String.valueOf(entry.getKey()),
                       String.valueOf(entry.getValue()));
        }
        return result;
    }
    return Collections.emptyMap();
}
```

**Sem essa extração, o template renderiza com valores vazios.** É o bug mais comum em sistemas de code generation.

## Passo 2: Template Resolution

O `CodeGeneratorService` resolve o template para cada resource type:

```java
private String resolveTemplate(String resourceType, String nodeProvider) {
    // 1. Tenta buscar no banco (templates customizados)
    Optional<TerraformTemplate> dbTemplate =
        templateRepository.findByResourceType(resourceType);
    if (dbTemplate.isPresent() && dbTemplate.get().isActive()) {
        return dbTemplate.get().getTemplateContent();
    }

    // 2. Fallback para built-in templates
    BuiltInTemplate bt = builtInTemplates.get(resourceType);
    if (bt != null) return bt.template();

    // 3. Busca parcial (ex: "google_compute_network" match em "google_compute_*")
    BuiltInTemplate fallback = builtInTemplates.entrySet().stream()
        .filter(e -> e.getKey().equalsIgnoreCase(resourceType) ||
                     e.getKey().endsWith("/" + resourceType))
        .map(Map.Entry::getValue)
        .findFirst()
        .orElse(null);

    return fallback != null ? fallback.template() : null;
}
```

### Built-in vs Database templates

| Aspecto | Built-in | Database |
|---------|----------|----------|
| Velocidade | Instantâneo | Lookup + parsing |
| Customização | Não | Sim (usuário pode editar) |
| Versionamento | Code version | Flyway migrations |
| Caso de uso | Defaults | Templates específicos da empresa |

## Passo 3: Template Rendering

O rendering é feito por regex — simples, previsível, sem dependências:

```java
static String renderTemplate(String template,
                              Map<String, String> properties,
                              String nodeId) {
    Map<String, String> merged = new LinkedHashMap<>(properties);
    merged.putIfAbsent("id", nodeId != null ? nodeId : "");

    Pattern VARIABLE_PATTERN = Pattern.compile("\\{\\{\\s*(\\w+)\\s*}}");
    StringBuffer result = new StringBuffer();
    Matcher matcher = VARIABLE_PATTERN.matcher(template);

    while (matcher.find()) {
        String varName = matcher.group(1);
        String replacement = merged.getOrDefault(varName, "");
        matcher.appendReplacement(result,
            Matcher.quoteReplacement(replacement));
    }
    matcher.appendTail(result);
    return result.toString();
}
```

### Exemplo de rendering

**Template:**
```hcl
resource "google_compute_network" "{{id}}" {
  name = "{{name}}"
  auto_create_subnetworks = {{auto_create_subnetworks}}
}
```

**Propriedades:**
```json
{"name": "main-vpc", "auto_create_subnetworks": "false"}
```

**Resultado:**
```hcl
resource "google_compute_network" "node-uuid-1234" {
  name = "main-vpc"
  auto_create_subnetworks = false
}
```

### Variáveis especiais

| Variável | Origem | Descrição |
|----------|--------|-----------|
| `{{id}}` | Node UUID | ID único do nó no canvas |
| `{{name}}` | User input | Nome do recurso |
| `{{provider}}` | ComponentDefinition | Provider cloud |
| `{{*}}` | User input | Qualquer propriedade customizada |

## Passo 4: Geração de Variáveis

Cada template declara quais variáveis Terraform precisa:

```java
private record VariableDef(
    String name,        // "gcp_project_id"
    String type,        // "string"
    String description, // "GCP project ID"
    String defaultValue // "my-project"
) {}
```

O gerador evita duplicatas:

```java
Set<String> declaredVariables = new LinkedHashSet<>();

for (VariableDef var : bt.variables()) {
    if (declaredVariables.add(var.name())) {
        variableDeclarations.append(generateVariable(var));
    }
}
```

### variables.tf gerado

```hcl
variable "gcp_project_id" {
  type        = string
  description = "GCP project ID"
  default     = "my-project"
}

variable "gcp_region" {
  type        = string
  description = "GCP region"
  default     = "us-central1"
}
```

## Passo 5: Geração de Outputs

Outputs expõem IDs e endpoints para outros módulos:

```java
private record OutputDef(
    String name,           // "network_id"
    String description,    // "The network ID"
    String valueTemplate   // "google_compute_network.{{id}}.id"
) {}
```

### outputs.tf gerado

```hcl
output "network_id" {
  description = "The network ID"
  value       = google_compute_network.node-uuid-1234.id
}

output "subnet_id" {
  description = "The subnet ID"
  value       = google_compute_subnetwork.node-uuid-5678.id
}
```

## Passo 6: Geração de Providers e Versions

O provider é determinado pelo provider dos nós:

```java
private String generateProviders(String provider) {
    return switch (provider) {
        case "aws" -> """
            provider "aws" {
              region = var.aws_region
            }
            """;
        case "google" -> """
            provider "google" {
              project = var.gcp_project_id
              region  = var.gcp_region
            }
            """;
        case "azurerm" -> """
            provider "azurerm" {
              features {}
            }
            """;
        default -> "provider \"%s\" {}".formatted(provider);
    };
}
```

### versions.tf — provider filtering

O `versions.tf` só inclui os providers necessários:

```java
private String generateVersionsForProvider(String engine, String provider) {
    StringBuilder sb = new StringBuilder();
    sb.append("terraform {\n");
    sb.append("  required_version = \">= 1.6.0\"\n");
    sb.append("  required_providers {\n");

    if (provider == null || provider.equals("google")) {
        sb.append("    google = {\n");
        sb.append("      source  = \"hashicorp/google\"\n");
        sb.append("      version = \"~> 5.0\"\n");
        sb.append("    }\n");
    }
    // ... aws, azurerm ...

    sb.append("  }\n}\n");
    return sb.toString();
}
```

**Resultado:** Se o canvas só tem recursos GCP, o `versions.tf` só declara o provider `google`. Nada de `aws` ou `azurerm` desnecessário.

## Resultado final: 5 arquivos

```
GeneratedCode {
  files: {
    "main.tf":       4 resources, ~40 lines
    "variables.tf":  2 variables, ~12 lines
    "outputs.tf":    4 outputs, ~20 lines
    "providers.tf":  1 provider, ~4 lines
    "versions.tf":   1 required_providers block, ~10 lines
  },
  resourceCount: 4,
  provider: "google"
}
```

## Por que não usar LLM para gerar Terraform?

Pergunta válida. Resposta:

| Aspecto | Template Engine | LLM |
|---------|----------------|-----|
| **Determinismo** | 100% — mesmo input = mesmo output | Variável — pode gerar código diferente |
| **Velocidade** | < 100ms | 2-10s |
| **Custo** | $0 | $0.01-0.10 por chamada |
| **Validação** | Sintaxe garantida | Pode gerar HCL inválido |
| **Auditabilidade** | Templates versionados | Black box |
| **Customização** | Editável pelo usuário | Prompt-dependent |

O CloudBuilder usa **template engine para code generation** e **LLM para recomendações e natural language query**. Cada tecnologia no seu lugar certo.

## Conclusão

A geração de Terraform a partir de um canvas visual não requer magia. Requer:

1. **Extração correta** de propriedades do JSON aninhado
2. **Resolução de templates** com fallback inteligente
3. **Rendering determinístico** com regex
4. **Deduplicação** de variáveis e outputs
5. **Filtragem** de providers por canvas

Simples. Previsível. Auditável.

**Código fonte:** [cloudbuilder.io](https://cloudbuilder.io)

---

## Tags

`#Engineering` `#Terraform` `#CodeGeneration` `#Java` `#TemplateEngine` `#InfrastructureAsCode` `#DeepDive`
