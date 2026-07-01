# CloudBuilder AI Platform Architecture

> **Version:** 1.0.0  
> **Status:** ✅ Complete  
> **Last Updated:** 2026-06-28  
> **Domain Module:** `com.cloudbuilder.aiops` (Spring Modulith)  
> **Database:** PostgreSQL (`incidents`, `aiops_remediation_actions`, `aiops_runbooks`, `aiops_post_mortems`, `diagnosis_results`)

---

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Princípios de Design](#2-princípios-de-design)
3. [LLM Provider Abstraction](#3-llm-provider-abstraction)
4. [Modelo de Incidentes](#4-modelo-de-incidentes)
5. [API REST](#5-api-rest)
6. [Classificação de Incidentes](#6-classificação-de-incidentes)
7. [Análise de Causa Raiz (RCA)](#7-análise-de-causa-raiz-rca)
8. [Auto-Remediation (ADR-017)](#8-auto-remediation-adr-017)
9. [Runbooks](#9-runbooks)
10. [Post-Mortem](#10-post-mortem)
11. [Design Templates](#11-design-templates)
12. [Chat com Assistente IA](#12-chat-com-assistente-ia)
13. [Frontend AIOps Module](#13-frontend-aiops-module)
14. [Fluxo de Detecção e Resposta](#14-fluxo-de-detecção-e-resposta)
15. [Circuit Breaker e Resiliência](#15-circuit-breaker-e-resiliência)
16. [Modelagem de Dados](#16-modelagem-de-dados)
17. [Roadmap](#17-roadmap)
18. [Referências](#18-referências)

---

## 1. Visão Geral

O módulo **AI Platform** (AIOps) do CloudBuilder fornece inteligência artificial para operações de infraestrutura, combinando análise automatizada de incidentes, geração de RCA, recomendações de remediação, runbooks pesquisáveis e um assistente de chat com contexto do ambiente.

### Responsabilidades

| Responsabilidade | Descrição |
|---|---|
| **Gerenciamento de Incidentes** | Criação, classificação, análise e resolução de incidentes |
| **Classificação Automática** | Categorização via regras determinísticas (rápida, sem LLM) |
| **Geração de RCA** | Análise de causa raiz via LLM ou fallback rule-based |
| **Auto-Remediation** | Sugestão e execução de ações corretivas (3 tiers) |
| **Runbooks** | Documentação de procedimentos operacionais padrão |
| **Post-Mortem** | Geração automática de documentos post-mortem pós-incidente |
| **Design Templates** | Templates pré-definidos para criação rápida de canvas |
| **Assistente IA** | Chat contextual com conhecimento do ambiente |
| **Análise de Métricas** | Detecção de anomalias em métricas via LLM |

---

## 2. Princípios de Design

### Abstração de LLM Provider (ADR-013)

O sistema é agnóstico a provedores de LLM através da interface `LlmClient`:

```
┌────────────────────────────────────────────┐
│              LlmClient (interface)          │
│  ┌──────────┬──────────┬────────────────┐  │
│  │  chat()  │analyze() │  generateRca() │  │
│  └──────────┴──────────┴────────────────┘  │
└────────────────────────────────────────────┘
           ▲                 ▲          ▲
           │                 │          │
┌──────────┴──┐    ┌─────────┴──┐  ┌───┴───────────┐
│  OpenAI     │    │  Anthropic │  │  Rule-Based    │
│  gpt-4o     │    │  claude-   │  │  (fallback     │
│             │    │  sonnet-4  │  │   padrão)      │
└─────────────┘    └────────────┘  └────────────────┘
```

### Tiers de Confiança (ADR-017)

| Tier | Descrição | Tempo | LLM |
|---|---|---|---|
| **Tier 1** | Regras determinísticas | Instantâneo | Não |
| **Tier 2** | LLM-reasoned | 3–10s | OpenAI/Anthropic |
| **Tier 3** | Manual (humano) | Variável | N/A |

### Separação ML vs Determinístico

- **Classificação**: 100% determinística (keywords → categoria)
- **RCA**: LLM prioritário, fallback rule-based
- **Análise de Métrica**: LLM prioritário, fallback rule-based
- **Chat**: LLM prioritário, fallback rule-based
- **Remediação**: Suggest via LLM, execute via script ou manual

---

## 3. LLM Provider Abstraction

### Interface `LlmClient`

```java
public interface LlmClient {
    String chat(String systemPrompt, String userMessage, Map<String, Object> context);
    String analyzeMetric(String metricName, List<Double> recentValues, double threshold);
    String generateRca(String incidentTitle, String incidentDescription,
                       String severity, Map<String, Object> relatedMetrics,
                       List<String> relatedLogs);
}
```

### Implementações

| Implementação | Ativação | Provider | Modelo Padrão |
|---|---|---|---|
| `RuleBasedLlmClient` | `matchIfMissing = true` (padrão) | N/A (templates) | N/A |
| `OpenAiLlmClient` | `cloudbuilder.ai.llm.provider=openai` | OpenAI | `gpt-4o` |
| `AnthropicLlmClient` | `cloudbuilder.ai.llm.provider=anthropic` | Anthropic | `claude-sonnet-4-20250514` |

### Configuração (`application.yml`)

```yaml
cloudbuilder:
  ai:
    llm:
      provider: openai  # ou "anthropic" ou "rule-based"
      openai:
        api-key: ${OPENAI_API_KEY}
        model: gpt-4o
      anthropic:
        api-key: ${ANTHROPIC_API_KEY}
        model: claude-sonnet-4-20250514
```

### Resiliência — Circuit Breaker

Todas as chamadas LLM são protegidas por **Resilience4j CircuitBreaker**:

```java
@CircuitBreaker(name = "llmClient", fallbackMethod = "chatFallback")
public String chat(String systemPrompt, String userMessage, Map<String, Object> context) {
    // ...
}
```

- Nome do breaker: `llmClient`
- 3 métodos com fallback: `chatFallback`, `analyzeMetricFallback`, `generateRcaFallback`
- Fallback sempre redireciona para `RuleBasedLlmClient`
- Se API key não configurada, `enabled=false` e delega direto ao fallback

### `LlmClientConfig`

Configuração via `@ConditionalOnProperty` — apenas um bean `LlmClient` é ativado por vez:

```java
@Component
@ConditionalOnProperty(name = "cloudbuilder.ai.llm.provider", havingValue = "openai")
public class OpenAiLlmClient implements LlmClient { }
```

---

## 4. Modelo de Incidentes

### Ciclo de Vida

```
OPEN ──► classificar ──► gerar RCA ──► sugerir remediação ──► RESOLVED
  │                                                            │
  └──► (diagnóstico automático via analyze)                    │
                                                               │
                                                      criar PostMortem
```

### Entidade `Incident`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `String` (UUID) | Identificador único |
| `environmentId` | `String` | Ambiente de origem |
| `title` | `String` | Título do incidente |
| `description` | `TEXT` | Descrição detalhada |
| `severity` | `String` | `CRITICAL`, `HIGH`, `MODERATE`, `LOW` |
| `status` | `String` | `OPEN`, `RESOLVED` |
| `classification` | `TEXT` | Categoria (rede, segurança, banco, etc) |
| `suggestedRca` | `TEXT` | Análise de causa raiz sugerida |
| `detectedAt` | `Instant` | Timestamp de detecção |
| `resolvedAt` | `Instant` | Timestamp de resolução |

### `DiagnosisResult`

| Campo | Tipo | Descrição |
|---|---|---|
| `incidentId` | `String` | Incidente associado |
| `rootCause` | `TEXT` | Causa raiz identificada |
| `confidence` | `String` | Nível de confiança |
| `severity` | `String` | Severidade do diagnóstico |
| `recommendedAction` | `TEXT` | Ação recomendada |
| `affectedResources` | `TEXT` | Recursos afetados |
| `status` | `String` | Status do diagnóstico |

### `RemediationAction`

| Campo | Tipo | Descrição |
|---|---|---|
| `incidentId` | `String` | Incidente associado |
| `actionType` | `Enum` | `RESTART_SERVICE`, `SCALE_UP`, `ROLLBACK_DEPLOY`, `CLEAR_CACHE`, etc |
| `description` | `TEXT` | Descrição da ação |
| `script` | `TEXT` | Script de automação (opcional) |
| `status` | `Enum` | `SUGGESTED` → `APPROVED` → `IN_PROGRESS` → `COMPLETED`/`FAILED`/`SKIPPED` |
| `aiSuggested` | `boolean` | Se foi sugerida por IA |
| `executedBy` | `String` | Quem executou |
| `result` | `TEXT` | Resultado da execução |

**Ciclo de vida:**

```
SUGGESTED → APPROVED → IN_PROGRESS → COMPLETED
    │                                    │
    └──→ SKIPPED                         └──→ FAILED
```

### `Runbook`

| Campo | Tipo | Descrição |
|---|---|---|
| `category` | `Enum` | `DATABASE`, `NETWORK`, `SECURITY`, `APPLICATION`, `INFRASTRUCTURE`, `DEPLOYMENT`, `GENERAL` |
| `severity` | `String` | Severidade alvo |
| `estimatedDurationMinutes` | `int` | Tempo estimado |
| `automated` | `boolean` | Pode ser executado automaticamente |
| `tags` | `TEXT` | Tags para busca |

### `PostMortem`

| Campo | Tipo | Descrição |
|---|---|---|
| `incidentId` | `String` (único) | Incidente associado |
| `summary` | `TEXT` | Resumo executivo |
| `rootCause` | `TEXT` | Causa raiz |
| `impact` | `TEXT` | Impacto do incidente |
| `timeline` | `TEXT` | Timeline de eventos |
| `actionItems` | `TEXT` | Itens de ação |
| `lessonsLearned` | `TEXT` | Lições aprendidas |
| `status` | `String` | `DRAFT` → `PUBLISHED` |
| `generatedBy` | `String` | Gerador (usuário ou IA) |

---

## 5. API REST

### Incidentes — `AIOpsController`

| Método | Path | Descrição |
|---|---|---|
| `GET` | `/api/v1/aiops/templates` | Lista design templates pré-definidos |
| `GET` | `/api/v1/aiops/incidents/{environmentId}` | Lista incidentes por ambiente |
| `GET` | `/api/v1/aiops/incidents/detail/{id}` | Detalhe do incidente |
| `POST` | `/api/v1/aiops/incidents` | Cria incidente |
| `POST` | `/api/v1/aiops/incidents/{id}/classify` | Classifica incidente |
| `POST` | `/api/v1/aiops/incidents/{id}/rca` | Define RCA sugerido |
| `POST` | `/api/v1/aiops/incidents/{id}/resolve` | Resolve incidente |
| `POST` | `/api/v1/aiops/incidents/{id}/analyze` | Análise completa (classificação + RCA via LLM) |

### Remediação

| Método | Path | Descrição |
|---|---|---|
| `POST` | `/api/v1/aiops/remediation` | Cria ação de remediação |
| `GET` | `/api/v1/aiops/remediation/{id}` | Detalhe da ação |
| `GET` | `/api/v1/aiops/remediation/incident/{id}` | Ações por incidente |
| `GET` | `/api/v1/aiops/remediation/suggested` | Ações sugeridas pendentes |
| `POST` | `/api/v1/aiops/remediation/{id}/execute` | Executa ação |
| `POST` | `/api/v1/aiops/remediation/{id}/approve` | Aprova ação |
| `POST` | `/api/v1/aiops/remediation/{id}/skip` | Pula ação |
| `POST` | `/api/v1/aiops/remediation/suggest/{incidentId}` | Sugere ações para incidente |

### Runbooks

| Método | Path | Descrição |
|---|---|---|
| `POST` | `/api/v1/aiops/runbooks` | Cria runbook |
| `GET` | `/api/v1/aiops/runbooks/{id}` | Detalhe do runbook |
| `GET` | `/api/v1/aiops/runbooks` | Lista/busca runbooks |
| `POST` | `/api/v1/aiops/runbooks/suggest/{incidentId}` | Sugere runbooks para incidente |
| `PUT` | `/api/v1/aiops/runbooks/{id}` | Atualiza runbook |
| `DELETE` | `/api/v1/aiops/runbooks/{id}` | Remove runbook |

### Post-Mortem

| Método | Path | Descrição |
|---|---|---|
| `POST` | `/api/v1/aiops/post-mortems/generate/{incidentId}` | Gera post-mortem |
| `GET` | `/api/v1/aiops/post-mortems/{id}` | Detalhe do post-mortem |
| `GET` | `/api/v1/aiops/post-mortems/incident/{id}` | Post-mortem por incidente |
| `GET` | `/api/v1/aiops/post-mortems` | Lista todos |
| `PUT` | `/api/v1/aiops/post-mortems/{id}` | Atualiza |
| `POST` | `/api/v1/aiops/post-mortems/{id}/publish` | Publica |
| `DELETE` | `/api/v1/aiops/post-mortems/{id}` | Remove |

### Chat e Análise

| Método | Path | Descrição |
|---|---|---|
| `POST` | `/api/v1/aiops/query` | Chat contextual com IA |
| `POST` | `/api/v1/aiops/analyze-metric` | Análise de métrica com IA |

### Segurança

- Todos os endpoints requerem autenticação (`@PreAuthorize("isAuthenticated()")`)
- Design templates são públicos (GET /templates)

---

## 6. Classificação de Incidentes

### Algoritmo Determinístico (`AIService.classifyIncident`)

```
desc.toLowerCase() contém:
  "rede" / "network" / "conexão"       → "rede"
  "segurança" / "security" / "auth"     → "segurança"
  "banco" / "database" / "sql" / "query" → "banco de dados"
  "app" / "aplicação" / "serviço"       → "aplicação"
  "infra" / "servidor" / "instância"    → "infraestrutura"
  default                                → "geral"
```

**Características:**
- **Zero dependência de LLM** — execução instantânea
- **PT-BR nativo** — termos em português e inglês
- **Usado como pre-filter** antes da geração de RCA

---

## 7. Análise de Causa Raiz (RCA)

### Pipeline

```
Incident criado
    │
    ▼
classifyIncident() → classificação (determinística)
    │
    ▼
analyzeIncident() → chamada completa:
    ├── aiService.classifyIncident() → classificação
    └── aiService.analyzeIncident() → RCA via LLM
           │
           ▼
    LlmClient.generateRca(title, desc, severity, metrics, logs)
           │
           ▼
    OpenAI / Anthropic API (ou fallback rule-based)
```

### Fallback Rule-Based (`RuleBasedLlmClient.generateRca`)

```java
desc contém "rede" / "network" / "conexão"
  → "Problema de rede detectado. Possível causa: latência elevada..."

desc contém "banco" / "database" / "sql" / "query"
  → "Problema de banco de dados identificado. Causas possíveis: ..."

desc contém "cpu" / "memória" / "memory"
  → "Degradação de performance por recurso. Possível causa: ..."

severity "critical"
  → "Possível falha de infraestrutura subjacente..."

severity "warning"
  → "Degradação de performance detectada..."
```

---

## 8. Auto-Remediation (ADR-017)

### Arquitetura de 3 Tiers

```
┌─────────────────────────────────────────────────────┐
│                    Incidente                         │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────┐
│  Tier 1 — Regras Determinísticas             │
│  ├── Tipo: RESTART_SERVICE, SCALE_UP, etc    │
│  ├── Gatilho: match de padrão no incidente   │
│  ├── Ação: cria RemediationAction            │
│  └── Confiança: ALTA (sem LLM)              │
├──────────────────────────────────────────────┤
│  Tier 2 — LLM Reasoning                      │
│  ├── Tipo: múltiplas ações sugeridas         │
│  ├── Gatilho: suggestActions(incidentId)     │
│  ├── Ação: LLM analisa e recomenda           │
│  └── Confiança: MÉDIA (requer aprovação)    │
├──────────────────────────────────────────────┤
│  Tier 3 — Manual                             │
│  ├── Tipo: ação criada por humano            │
│  ├── Gatilho: usuário cria ação             │
│  ├── Ação: execução manual com script        │
│  └── Confiança: DEFINITIVA                  │
└──────────────────────────────────────────────┘
```

### Ciclo de Execução

```
Incident → suggestActions()
    │
    ▼
[RemediationAction] SUGGESTED
    │
    ▼
approveAction() → APPROVED
    │
    ▼
executeAction() → IN_PROGRESS → COMPLETED
    │                              │
    ├── com script auto           └── markFailed() → FAILED
    └── sem script: manual
```

### Tipos de Ação

| ActionType | Descrição | Automável |
|---|---|---|
| `RESTART_SERVICE` | Reinicia serviço | ✅ |
| `SCALE_UP` | Aumenta recursos | ✅ |
| `SCALE_DOWN` | Reduz recursos | ✅ |
| `ROLLBACK_DEPLOY` | Reverte deploy | ✅ |
| `CLEAR_CACHE` | Limpa cache | ✅ |
| `INCREASE_TIMEOUT` | Aumenta timeout | ✅ |
| `RETRY_CONNECTION` | Retenta conexão | ✅ |
| `EXECUTE_SCRIPT` | Executa script customizado | ✅ |
| `DNS_UPDATE` | Atualiza DNS | ✅ |
| `OTHER` | Ação manual | ❌ |

---

## 9. Runbooks

### Categorias

| Categoria | Uso |
|---|---|
| `DATABASE` | Procedimentos para bancos de dados (failover, backup, tuning) |
| `NETWORK` | Problemas de rede (DNS, latency, packet loss) |
| `SECURITY` | Incidentes de segurança (breach, DDoS, IAM) |
| `APPLICATION` | Problemas de aplicação (crash, OOM, slow responses) |
| `INFRASTRUCTURE` | Infraestrutura geral (disk full, node down) |
| `DEPLOYMENT` | Problemas de deploy (rollback, failed deployment) |
| `GENERAL` | Procedimentos gerais |

### Sugestão de Runbooks

O endpoint `POST /runbooks/suggest/{incidentId}` correlaciona:
1. Categoria do incidente → runbooks da mesma categoria
2. Severidade → runbooks de severidade compatível
3. Tags → busca textual por palavras-chave

### Busca

```
GET /aiops/runbooks?category=DATABASE&search=postgres
```

---

## 10. Post-Mortem

### Ciclo de Vida

```
Incident → RESOLVED
    │
    ▼
generatePostMortem(incidentId, generatedBy)
    │
    ▼
PostMortem (status: DRAFT)
    │
    ▼
updatePostMortem() → revisão manual
    │
    ▼
publishPostMortem() → PUBLISHED (publishedAt registrado)
```

### Geração Automática

O post-mortem é gerado a partir dos dados do incidente:
- `title` = baseado no título do incidente
- `summary` = resumo do incidente + ações tomadas
- `severity` = herdada do incidente
- `generatedBy` = usuário ou "auto"

Após geração, o documento pode ser revisado e enriquecido com:
- `rootCause` — Causa raiz consolidada
- `impact` — Impacto detalhado
- `timeline` — Timeline de eventos
- `actionItems` — Itens de ação corretiva
- `lessonsLearned` — Lições aprendidas

---

## 11. Design Templates

### Templates Pré-Definidos

Três templates disponíveis via `GET /api/v1/aiops/templates`:

| Template | Recursos | Conexões | Uso |
|---|---|---|---|
| **VPC + ECS + RDS** | 11 recursos (VPC, subnets, ECS, ALB, RDS, SGs) | 14 conexões | Aplicação web containerizada com banco PostgreSQL |
| **Kubernetes Cluster (EKS)** | 12 recursos (VPC, subnets, EKS, node group, addons, namespaces) | 12 conexões | Cluster K8s gerenciado na AWS |
| **API Serverless** | 6 recursos (API GW, Lambda, DynamoDB, Cognito, IAM, CW Logs) | 5 conexões | API REST serverless com autenticação |

### Formato DTO

```json
{
  "id": "vpc-ecs-rds",
  "name": "VPC + ECS + RDS",
  "description": "Aplicação web em container com banco PostgreSQL gerenciado",
  "resources": [
    { "id": "vpc", "label": "VPC", "provider": "aws", "type": "vpc", "category": "network" }
  ],
  "connections": [
    { "sourceId": "vpc", "targetId": "subnet_public", "type": "contains" }
  ]
}
```

Esses templates são usados pelo assistente IA para sugerir designs a partir de prompts em linguagem natural.

---

## 12. Chat com Assistente IA

### Endpoint

```
POST /api/v1/aiops/query
{
  "question": "Qual a causa do pico de CPU no último incidente?",
  "context": "3 incidentes ativos, 2 de severidade alta",
  "extraContext": {
    "environmentId": "env-123",
    "recentMetrics": { "cpu": [45, 52, 78, 95, 88] }
  }
}
```

### Resposta

```json
{
  "answer": "Com base na análise dos 3 incidentes ativos..."
}
```

### Prompt do Sistema

```
"Você é o assistente de IA do CloudBuilder, uma plataforma de engenharia de
infraestrutura como código. Responda em português de forma técnica e objetiva.
Use os dados de contexto fornecidos para enriquecer sua resposta.
Se não tiver informações suficientes, sugira o que o usuário pode fazer para
obtê-las."
```

### Capacidades do Assistente

- Responder perguntas sobre incidentes ativos
- Analisar métricas e health da infraestrutura
- Sugerir otimizações de custo e performance
- Recomendar designs de infraestrutura

---

## 13. Frontend AIOps Module

### `incidentStore.ts` (Zustand)

| Estado | Tipo | Descrição |
|---|---|---|
| `incidents` | `BackendIncident[]` | Lista de incidentes |
| `fixHistory` | `FixHistoryEntry[]` | Histórico de correções |
| `autoFixEnabled` | `boolean` | Toggle de auto-remediação |
| `loading` | `boolean` | Estado de carregamento |

### Actions

| Action | Descrição | API |
|---|---|---|
| `fetchIncidents(envId)` | Carrega incidentes do backend | `aiopsApi.getIncidents()` |
| `addIncidentReactive(incident)` | Adiciona via SSE (tempo real) | EventStream |
| `analyzeIncident(id)` | Dispara análise LLM | `aiopsApi.analyzeIncident()` |
| `resolveIncident(id)` | Marca como resolvido | `aiopsApi.resolveIncident()` |
| `addFixHistory(entry)` | Registra correção local | Local |
| `toggleAutoFix()` | Liga/desliga auto-fix | Local |

### FixHistoryEntry

```typescript
interface FixHistoryEntry {
  id: string
  incidentId: string
  incidentTitle: string
  fixDescription: string
  modifications: ResourceModification[]
  appliedAt: string
  deployedAt: string | null
  result: 'pending' | 'success' | 'failed' | 'rolled-back'
  autoFix: boolean
}
```

### AIOpsController Integration

O frontend se comunica com o backend via `aiopsApi`:
- `aiopsApi.getIncidents(envId)` → GET `/aiops/incidents/{envId}`
- `aiopsApi.analyzeIncident(id)` → POST `/aiops/incidents/{id}/analyze`
- `aiopsApi.resolveIncident(id)` → POST `/aiops/incidents/{id}/resolve`

---

## 14. Fluxo de Detecção e Resposta

### Visão Completa

```
┌──────────────┐     SSE       ┌─────────────────────┐
│  Observability│─────────────►│  AIOpsModule        │
│  Module       │  new incident  │  (Frontend)         │
│  (alerts)     │              │  addIncidentReactive│
└──────────────┘              └──────────┬──────────┘
                                         │
                                ┌────────▼────────┐
                                │  analyzeIncident │
                                │  (chat/LLM)     │
                                └────────┬────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
             ┌──────▼──────┐   ┌────────▼────────┐   ┌───────▼───────┐
             │ classificar │   │  Gerar RCA      │   │ Sugerir Ações │
             │ rule-based  │   │  LLM/fallback   │   │ Tier 1/2     │
             └─────────────┘   └─────────────────┘   └───────────────┘
                                                              │
                                                    ┌─────────▼─────────┐
                                                    │  RemediationAction│
                                                    │  SUGGESTED        │
                                                    └─────────┬─────────┘
                                                              │
                                              ┌───────────────┼──────────────┐
                                              │               │              │
                                      ┌───────▼────┐  ┌──────▼─────┐  ┌─────▼─────┐
                                      │ APPROVED   │  │ EXECUTED   │  │ SKIPPED   │
                                      │ (manual)   │  │ (auto)     │  │           │
                                      └────────────┘  └────────────┘  └───────────┘
                                                              │
                                                    ┌─────────▼─────────┐
                                                    │  Incident →       │
                                                    │  RESOLVED         │
                                                    └─────────┬─────────┘
                                                              │
                                                    ┌─────────▼─────────┐
                                                    │  PostMortem DRAFT │
                                                    │  → PUBLISHED      │
                                                    └───────────────────┘
```

### Event-Driven

O `addIncidentReactive` no frontend é acionado via **SSE** (Server-Sent Events) a partir do módulo Observability. Quando um alerta é detectado:

1. Observability Module → SSE Event
2. `useEventStream` hook → detecta novo incidente
3. `incidentStore.addIncidentReactive()` → adiciona ao estado
4. UI exibe notificação e opção de análise

---

## 15. Circuit Breaker e Resiliência

### Resilience4j Configuration

Todas as chamadas a provedores LLM passam por:

```java
@CircuitBreaker(name = "llmClient", fallbackMethod = "chatFallback")
```

### Comportamento

| Estado | Ação |
|---|---|
| **CLOSED** | Chamadas passam diretamente para o LLM |
| **OPEN** | Chamadas redirecionadas para `RuleBasedLlmClient` |
| **HALF_OPEN** | Após wait duration, testa com uma chamada |

### Fallback Chain

```
OpenAiLlmClient.chat()
    → Circuit Breaker OPEN? → OpenAiLlmClient.chatFallback()
        → RuleBasedLlmClient.chat() (templates determinísticos)
    → Exception? → OpenAiLlmClient.chatFallback()
        → RuleBasedLlmClient.chat()
```

### Graceful Degradation

Se API key não está configurada, o cliente LLM opera em modo `disabled`:

```java
this.enabled = apiKey != null && !apiKey.isBlank();
if (!this.enabled) {
    log.warn("OpenAI LLM client configured but no API key provided");
}
```

Quando `enabled=false`, toda chamada delega imediatamente para o fallback rule-based, sem tentativa de requisição HTTP.

---

## 16. Modelagem de Dados

### Tabelas PostgreSQL

```sql
CREATE TABLE incidents (
    id              VARCHAR(36) PRIMARY KEY,
    environment_id  VARCHAR(255) NOT NULL,
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    severity        VARCHAR(20) NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    classification  TEXT,
    suggested_rca   TEXT,
    detected_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at     TIMESTAMP
);

CREATE TABLE diagnosis_results (
    id                 VARCHAR(36) PRIMARY KEY,
    incident_id        VARCHAR(36) NOT NULL,
    root_cause         TEXT NOT NULL,
    confidence         VARCHAR(20) NOT NULL,
    severity           VARCHAR(20) NOT NULL,
    recommended_action TEXT,
    affected_resources TEXT,
    status             VARCHAR(20) NOT NULL,
    created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE aiops_remediation_actions (
    id              VARCHAR(36) PRIMARY KEY,
    incident_id     VARCHAR(36) NOT NULL,
    action_type     VARCHAR(30) NOT NULL,
    description     TEXT NOT NULL,
    script          TEXT,
    status          VARCHAR(20) NOT NULL DEFAULT 'SUGGESTED',
    is_ai_suggested BOOLEAN DEFAULT FALSE,
    executed_by     VARCHAR(255),
    executed_at     TIMESTAMP,
    result          TEXT,
    error_message   TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE aiops_runbooks (
    id                        VARCHAR(36) PRIMARY KEY,
    title                     VARCHAR(255) NOT NULL,
    content                   TEXT NOT NULL,
    category                  VARCHAR(20) NOT NULL,
    tags                      TEXT,
    severity                  VARCHAR(20) NOT NULL,
    estimated_duration_minutes INT DEFAULT 0,
    automated                 BOOLEAN DEFAULT FALSE,
    created_at                TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE aiops_post_mortems (
    id              VARCHAR(36) PRIMARY KEY,
    incident_id     VARCHAR(36) NOT NULL UNIQUE,
    title           TEXT NOT NULL,
    summary         TEXT NOT NULL,
    root_cause      TEXT,
    impact          TEXT,
    timeline        TEXT,
    action_items    TEXT,
    lessons_learned TEXT,
    severity        VARCHAR(20) NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    generated_by    VARCHAR(255),
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    published_at    TIMESTAMP
);
```

### Índices Recomendados

```sql
CREATE INDEX idx_incidents_env ON incidents(environment_id);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_diagnosis_incident ON diagnosis_results(incident_id);
CREATE INDEX idx_remediation_incident ON aiops_remediation_actions(incident_id);
CREATE INDEX idx_remediation_status ON aiops_remediation_actions(status);
CREATE INDEX idx_runbooks_category ON aiops_runbooks(category);
CREATE INDEX idx_runbooks_tags ON aiops_runbooks USING gin(to_tsvector('portuguese', tags));
CREATE INDEX idx_post_mortems_incident ON aiops_post_mortems(incident_id);
```

---

## 17. Roadmap

### Q4 2026 (Intelligence) — Atual

- [x] Gerenciamento de incidentes (CRUD)
- [x] Classificação determinística por keyword
- [x] Geração de RCA via LLM + fallback rule-based
- [x] LlmClient abstraction (ADR-013)
- [x] Circuit breaker + graceful degradation
- [x] Auto-remediation 3 tiers (ADR-017)
- [x] Runbooks com categorias e busca
- [x] Post-mortem com ciclo draft → published
- [x] Design templates (VPC+ECS+RDS, EKS, Serverless)
- [x] Chat contextual com assistente IA
- [x] Análise de métricas via LLM

### Q1 2027 (Enterprise)

- [ ] **Auto-Remediation Automática** — Tier 1 execução sem aprovação para baixo risco
- [ ] **ML-based Anomaly Detection** — Modelos treinados para detectar padrões
- [ ] **Integração PagerDuty/Opsgenie** — Notificação e escalonamento
- [ ] **SLO-driven Remediation** — Ações baseadas em burn rate de SLO
- [ ] **Runbook Automation** — Execução automática de runbooks com validação
- [ ] **Chat Multi-Modal** — Upload de screenshots/diagramas no chat
- [ ] **Análise Preditiva** — Prever incidentes antes de ocorrerem

---

## 18. Referências

### ADRs

| ADR | Título | Descrição |
|---|---|---|
| ADR-013 | LLM Provider Abstraction | Interface `LlmClient` com 3 implementações |
| ADR-017 | Hybrid Auto-Remediation | 3-tier confidence pipeline (rule→LLM→manual) |
| ADR-032 | Feature Flags | Feature `module.aiops` |

### Código-Fonte

| Arquivo | Caminho |
|---|---|
| LlmClient.java | `backend/.../aiops/domain/service/llm/LlmClient.java` |
| OpenAiLlmClient.java | `backend/.../aiops/domain/service/llm/OpenAiLlmClient.java` |
| AnthropicLlmClient.java | `backend/.../aiops/domain/service/llm/AnthropicLlmClient.java` |
| RuleBasedLlmClient.java | `backend/.../aiops/domain/service/llm/RuleBasedLlmClient.java` |
| AIService.java | `backend/.../aiops/domain/service/AIService.java` |
| AIOpsService.java | `backend/.../aiops/domain/service/AIOpsService.java` |
| AIOpsController.java | `backend/.../aiops/infrastructure/web/AIOpsController.java` |
| LlmClientConfig.java | `backend/.../aiops/infrastructure/config/LlmClientConfig.java` |
| Incident.java | `backend/.../aiops/domain/model/Incident.java` |
| RemediationAction.java | `backend/.../aiops/domain/model/RemediationAction.java` |
| Runbook.java | `backend/.../aiops/domain/model/Runbook.java` |
| PostMortem.java | `backend/.../aiops/domain/model/PostMortem.java` |
| DesignTemplateDTO.java | `backend/.../aiops/application/dto/DesignTemplateDTO.java` |
| incidentStore.ts | `frontend/src/store/incidentStore.ts` |

### Documentos

- [Architecture Manifesto — Part III (DDD)](../manifesto/ARCHITECTURE_MANIFESTO.md#part-iii-strategic-domain-driven-design)
- [ADR-013 — LLM Provider Abstraction](../adr-013-llm-provider-abstraction.md)
- [ADR-017 — Hybrid Auto-Remediation](../adr-017-hybrid-auto-remediation.md)
- [Observability Architecture](../observability/OBSERVABILITY_ARCHITECTURE.md)
