# CloudBuilder FinOps Architecture

> **Version:** 1.0.0  
> **Status:** ✅ Complete  
> **Last Updated:** 2026-06-28  
> **Domain Module:** `com.cloudbuilder.cost` (Spring Modulith)  
> **Database:** PostgreSQL (`cost_records`, `budgets`, `budget_alerts`, `cost_scenarios`, `cost_forecasts`, `cost_optimization_suggestions`)

---

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Princípios de Design](#2-princípios-de-design)
3. [Modelo de Domínio](#3-modelo-de-domínio)
4. [API REST](#4-api-rest)
5. [Camada de Serviços](#5-camada-de-serviços)
6. [Anomalia de Custos](#6-anomalia-de-custos)
7. [Projeção de Custos](#7-projeção-de-custos)
8. [What-if Cost Scenario](#8-what-if-cost-scenario)
9. [Otimizações e Sugestões](#9-otimizações-e-sugestões)
10. [Budget Alerts](#10-budget-alerts)
11. [Frontend CostModule](#11-frontend-costmodule)
12. [Fluxo de Dados](#12-fluxo-de-dados)
13. [Integração com AWS Cost Explorer](#13-integração-com-aws-cost-explorer)
14. [Modelagem de Dados](#14-modelagem-de-dados)
15. [Roadmap](#15-roadmap)
16. [Referências](#16-referências)

---

## 1. Visão Geral

O módulo **Cost** do CloudBuilder oferece visibilidade, previsibilidade e governança sobre custos de infraestrutura cloud. Ele permite que engenheiros e FinOps acompanhem gastos em tempo real, simulem cenários de custo antes de provisionar recursos, e recebam sugestões de otimização baseadas em dados históricos.

### Responsabilidades

| Responsabilidade | Descrição |
|---|---|
| **Registro de Custos** | Importação e armazenamento de custos por ambiente/provedor/serviço |
| **Orçamentos** | Criação e monitoramento de budgets com alertas por threshold |
| **Detecção de Anomalias** | Identificação estatística de picos de custo (média móvel 7d + desvio padrão) |
| **Projeção** | Estimativa de custos futuros baseada em séries temporais |
| **What-if Scenarios** | Simulação de impacto de custo de designs antes do deploy |
| **Otimizações** | Sugestões de redução de custo com severidade e savings estimados |
| **Chargeback/Showback** | Rastreamento de custo por ambiente e tenant |

---

## 2. Princípios de Design

### Arquitetura Hexagonal (Ports & Adapters)

O módulo Cost segue a mesma arquitetura hexagonal dos demais módulos do CloudBuilder:

```
┌─────────────────────────────────────────────────────┐
│                  Infrastructure                      │
│  ┌──────────────────────────────────────────┐       │
│  │  CostController  BudgetAlertController   │       │
│  │  CostForecastController                  │       │
│  └────────────┬─────────────────────────────┘       │
│               │ REST                                │
│  ┌────────────▼─────────────────────────────┐       │
│  │            Application (DTOs)             │       │
│  │  BudgetAlert, CostAnomaly,               │       │
│  │  CostProjectionPoint                     │       │
│  └────────────┬─────────────────────────────┘       │
│               │                                     │
│  ┌────────────▼─────────────────────────────┐       │
│  │            Domain (Service)               │       │
│  │  CostService                             │       │
│  │  CostScenarioService                     │       │
│  │  CostOptimizationService                 │       │
│  │  AnomalyDetectionService                 │       │
│  │  CostProjectionService                   │       │
│  │  BudgetAlertService                      │       │
│  │  CostForecastService                     │       │
│  │  AwsCostExplorerService                  │       │
│  └────────────┬─────────────────────────────┘       │
│               │                                     │
│  ┌────────────▼─────────────────────────────┐       │
│  │         Domain (Port/Repository)          │       │
│  │  CostRecordRepository                    │       │
│  │  BudgetRepository                        │       │
│  │  CostScenarioRepository                  │       │
│  │  CostOptimizationRepository              │       │
│  │  BudgetAlertRepository                   │       │
│  │  CostForecastRepository                  │       │
│  └────────────┬─────────────────────────────┘       │
│               │ JPA / Spring Data                    │
│  ┌────────────▼─────────────────────────────┐       │
│  │          Domain (Model)                   │       │
│  │  CostRecord, Budget, BudgetAlert         │       │
│  │  CostScenario, CostForecast              │       │
│  │  CostOptimizationSuggestion              │       │
│  └──────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────┘
```

### Separação por Fronteiras

- **Domain Model**: Entidades JPA com lógica de negócio embutida (ex: `recalculateStatus()` em `BudgetAlert`)
- **Domain Service**: Orquestração e algoritmos (ex: detecção de anomalia com média móvel)
- **Application DTO**: Objetos de transferência específicos para resposta da API (desacoplados do modelo JPA)
- **Infrastructure Controllers**: Endpoints REST com validação Spring Security

---

## 3. Modelo de Domínio

### `CostRecord` — Registro de Custo Atômico

Representa um único registro de custo de um serviço em um provedor:

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `String` (UUID) | Identificador único |
| `environmentId` | `String` | Ambiente associado |
| `provider` | `String` | Provedor (AWS, Azure, GCP) |
| `serviceName` | `String` | Nome do serviço (ex: EC2, S3) |
| `amount` | `double` | Valor do custo |
| `currency` | `String` | Moeda (USD) |
| `date` | `LocalDate` | Data do custo |
| `resourceId` | `String` | (opcional) ID do recurso específico |
| `tags` | `TEXT` | (opcional) JSON de tags |
| `importedAt` | `Instant` | Timestamp de importação |

### `Budget` — Orçamento por Ambiente

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `String` (UUID) | Identificador único |
| `environmentId` | `String` | Ambiente |
| `name` | `String` | Nome do orçamento |
| `limitAmount` | `double` | Limite máximo |
| `spentAmount` | `double` | Gasto atual |
| `currency` | `String` | Moeda |
| `startDate` | `LocalDate` | Início do período |
| `endDate` | `LocalDate` | Fim do período |
| `status` | `String` | `ACTIVE`, `EXCEEDED`, `CLOSED` |

Método `getUsagePercent()` retorna `(spentAmount / limitAmount) * 100`.

### `BudgetAlert` — Alerta de Orçamento

Entidade separada com thresholds configuráveis e cálculo automático de status:

| Campo | Tipo | Padrão | Descrição |
|---|---|---|---|
| `warningThreshold` | `double` | `0.8` (80%) | Dispara alerta WARNING |
| `criticalThreshold` | `double` | `0.95` (95%) | Dispara alerta CRITICAL |

**Status calculado via** `recalculateStatus()`:
| Condição | Status |
|---|---|
| `ratio < 80%` | `OK` |
| `ratio >= 80%` | `WARNING` |
| `ratio >= 95%` | `CRITICAL` |
| `ratio >= 100%` | `EXCEEDED` |

### `CostScenario` — What-if Scenario (ADR-011)

Persiste simulações de custo do canvas visual:

| Campo | Tipo | Descrição |
|---|---|---|
| `tenantId` | `String` | Tenant proprietário |
| `name` | `String` | Nome do cenário |
| `description` | `TEXT` | Descrição opcional |
| `environmentId` | `String` | Ambiente de referência |
| `canvasId` | `String` | Canvas associado |
| `tier` | `String` | `min`, `avg`, `max` (3-tier estimation) |
| `currentTotal` | `double` | Custo atual da infra |
| `proposedTotal` | `double` | Custo proposto pelo design |
| `resourceCount` | `int` | Quantidade de recursos |
| `breakdownJson` | `TEXT` | JSON com breakdown por categoria |

### `CostOptimizationSuggestion` — Sugestão de Otimização

| Campo | Tipo | Descrição |
|---|---|---|
| `resourceType` | `String` | Tipo do recurso |
| `resourceName` | `String` | Nome do recurso |
| `provider` | `String` | Provedor |
| `suggestion` | `TEXT` | Descrição da ação |
| `currentCost` | `double` | Custo atual |
| `estimatedCost` | `double` | Custo estimado após otimização |
| `savings` | `double` | Economia calculada |
| `savingsPercent` | `double` | Percentual de economia |
| `severity` | `String` | `HIGH`, `MEDIUM`, `LOW` |
| `applied` | `boolean` | Se já foi aplicada |

### `CostForecast` — Previsão de Custo

| Campo | Tipo | Descrição |
|---|---|---|
| `predictedAmount` | `double` | Valor previsto |
| `lowerBound` | `double` | Limite inferior do intervalo |
| `upperBound` | `double` | Limite superior do intervalo |
| `period` | `String` | Período (ex: `MONTHLY`) |
| `model` | `String` | Modelo usado (ex: `MOVING_AVERAGE`) |
| `forecastDate` | `LocalDateTime` | Data da previsão |

---

## 4. API REST

### Endpoints — `CostController`

| Método | Path | Auth | Descrição |
|---|---|---|---|
| `GET` | `/api/v1/cost/overview/{environmentId}` | Autenticado | Overview consolidado (total, top serviços, forecast, budgets) |
| `POST` | `/api/v1/cost/records` | ADMIN | Importa registro de custo |
| `GET` | `/api/v1/cost/records/{environmentId}` | Autenticado | Lista registros de custo |
| `POST` | `/api/v1/cost/budgets` | ADMIN | Cria orçamento |
| `GET` | `/api/v1/cost/budgets/{environmentId}` | Autenticado | Lista orçamentos |
| `GET` | `/api/v1/cost/anomalies/{environmentId}` | Autenticado | Detecta anomalias (parâmetro: `lookbackDays`) |
| `GET` | `/api/v1/cost/projection/{environmentId}` | Autenticado | Projeção de custos (parâmetro: `projectionDays`) |
| `GET` | `/api/v1/cost/budget-alerts/{environmentId}` | Autenticado | Avalia budgets e retorna alertas |
| `POST` | `/api/v1/cost/scenarios` | ADMIN | Cria cenário what-if |
| `GET` | `/api/v1/cost/scenarios/{id}` | Autenticado | Busca cenário por ID |
| `GET` | `/api/v1/cost/scenarios/environment/{envId}` | Autenticado | Cenários por ambiente |
| `GET` | `/api/v1/cost/scenarios/canvas/{canvasId}` | Autenticado | Cenários por canvas |
| `DELETE` | `/api/v1/cost/scenarios/{id}` | ADMIN | Remove cenário |

### Exemplo: `GET /api/v1/cost/overview/{envId}`

```json
{
  "totalCost": 4523.50,
  "forecast": 5230.00,
  "periodStart": "2026-06-01",
  "periodEnd": "2026-06-28",
  "topServices": [
    { "service": "Amazon EC2", "cost": 2150.00 },
    { "service": "Amazon RDS", "cost": 980.50 }
  ],
  "budgets": [ /* Budget[] */ ]
}
```

### Segurança

- Todos os endpoints requerem autenticação (`@PreAuthorize("isAuthenticated()")`)
- Operações de escrita (import, create budget, create scenario) requerem `ADMIN`
- Multi-tenant via `environmentId` (cada tenant vê apenas seus ambientes)

---

## 5. Camada de Serviços

### `CostService`

- `importCostRecord(record)` — Importa um registro de custo
- `getCosts(envId, start, end)` — Lista custos com filtro de data
- `getTopServicesByCost(envId)` — Top N serviços por custo
- `getTotalCost(envId, start, end)` — Custo total no período
- `createBudget(budget)` — Cria orçamento
- `getBudgets(envId)` — Lista orçamentos
- `getMonthlyForecast(envId)` — Forecast simples: `(gasto_atual / dias_decorridos) * dias_no_mes`

### `CostScenarioService`

CRUD completo para cenários what-if:
- `create(scenario)` → `CostScenario`
- `findByEnvironment(envId)` → `List<CostScenario>`
- `findByCanvas(canvasId)` → `List<CostScenario>`
- `findByTenant(tenantId)` → `List<CostScenario>`
- `findById(id)` → `CostScenario | null`
- `delete(id)` → void

### `CostOptimizationService`

- `getSuggestions(envId)` — Todas as sugestões
- `getPendingSuggestions(envId)` — Apenas não aplicadas
- `addSuggestion(suggestion)` — Adiciona sugestão
- `applySuggestion(id)` — Marca como aplicada
- `getSuggestionsByResource(envId, resourceId)` — Por recurso
- `getTotalPotentialSavings(envId)` — Soma de savings pendentes

### `AnomalyDetectionService`

Ver seção [6. Anomalia de Custos](#6-anomalia-de-custos).

### `CostProjectionService`

Ver seção [7. Projeção de Custos](#7-projeção-de-custos).

### `BudgetAlertService`

- `evaluateBudgets(envId)` — Avalia todos os budgets vs gastos atuais, retorna `BudgetAlert[]` com status calculado

### `CostForecastService`

- Gera previsões usando modelos (ex: média móvel)
- Persiste em `cost_forecasts` para consulta posterior

---

## 6. Anomalia de Custos

### Algoritmo (`AnomalyDetectionService.detectAnomalies`)

```
1. Busca registros dos últimos (lookbackDays + 6) dias
2. Agrupa por serviceName, ordena por data
3. Para cada serviço:
   a. Calcula média móvel de 7 dias para cada ponto
   b. Calcula desvio percentual: (amount - movingAvg) / movingAvg * 100
   c. Calcula média e desvio padrão dos desvios
   d. Threshold = 1.5 * stdDev
   e. Flag se |deviation| > threshold
4. Retorna anomalias ordenadas por data (decrescente)
```

### Classificação de Severidade

| Desvio Absoluto | Severidade |
|---|---|
| `< 20%` | `LOW` |
| `20% — 50%` | `MODERATE` (mapeado como LOW no código) |
| `50% — 100%` | `HIGH` |
| `>= 200%` | `CRITICAL` |

### CostAnomaly DTO

```json
{
  "id": "uuid",
  "serviceName": "Amazon EC2",
  "date": "2026-06-15",
  "actualAmount": 5230.00,
  "expectedAmount": 2450.00,
  "deviationPct": 113.47,
  "severity": "HIGH"
}
```

---

## 7. Projeção de Custos

### `CostProjectionService`

Gera pontos de projeção para os próximos N dias com base em dados históricos:

```json
{
  "date": "2026-07-15",
  "projectedAmount": 4850.00,
  "lowerBound": 4200.00,
  "upperBound": 5500.00
}
```

A projeção inclui:
- **Valor projetado**: Estimativa central baseada em tendência
- **Limite inferior**: Cenário pessimista (mínimo esperado)
- **Limite superior**: Cenário otimista (máximo esperado)

Usado no frontend para renderizar gráficos de projeção com banda de confiança.

---

## 8. What-if Cost Scenario

### Modelo de 3 Tier (ADR-011)

Implementado no frontend `WhatIfCost.tsx` e persistido via `CostScenario` no backend:

| Tier | Descrição | Aplicação |
|---|---|---|
| **Min** | Estimativa conservadora | Recursos menores, sem redundância |
| **Avg** | Cenário realista | Configuração típica de produção |
| **Max** | Cenário pessimista | Alta disponibilidade, scaling |

### Fluxo

```
Canvas Design → Extrair recursos e tipos
     ↓
Calcular custo por recurso (tabela de preços local)
     ↓
Gerar 3 estimativas (min/avg/max)
     ↓
Exibir no frontend (WhatIfCost.tsx)
     ↓
Salvar como CostScenario (opcional, ADMIN)
```

### Breakdown por Categoria

O `breakdownJson` contém uma estrutura como:

```json
[
  { "category": "Compute", "min": 120, "avg": 250, "max": 500 },
  { "category": "Storage", "min": 50,  "avg": 100, "max": 200 },
  { "category": "Network",  "min": 30,  "avg": 60,  "max": 120 }
]
```

---

## 9. Otimizações e Sugestões

### `CostOptimizationSuggestion`

Cada sugestão representa uma ação recomendada para reduzir custos:

| Campo | Exemplo |
|---|---|
| `resourceType` | `aws_instance` |
| `resourceName` | `web-server-01` |
| `suggestion` | "Redimensionar de t3.large para t3.medium" |
| `currentCost` | 120.00 |
| `estimatedCost` | 60.00 |
| `savings` | 60.00 |
| `savingsPercent` | 50.0 |
| `severity` | `HIGH` |

### Ciclo de Vida

```
Detecção → addSuggestion() → PENDENTE
                                  ↓
                          applySuggestion() → APLICADA
                                  ↓
                          appliedAt registrado
```

### API de Otimização

| Método | Path | Descrição |
|---|---|---|
| `GET` | (via CostController) | Sugestões por ambiente |
| `POST` | (via CostOptimizationService.addSuggestion) | Adicionar sugestão |
| `PUT` | (via CostOptimizationService.applySuggestion) | Aplicar sugestão |

---

## 10. Budget Alerts

### Arquitetura de Alertas

```
┌─────────────┐     ┌──────────────────┐     ┌──────────────┐
│  Budget     │────►│  BudgetAlert     │────►│  Status      │
│  (entidade) │     │  Service         │     │  OK          │
│  limitAmt   │     │  evaluateBudgets │     │  WARNING     │
│  spentAmt   │     │                  │     │  CRITICAL    │
│  thresholds │     │  ratio = spend   │     │  EXCEEDED    │
└─────────────┘     │  / limit * 100   │     └──────────────┘
                    │  recalculate     │
                    │  status()        │
                    └──────────────────┘
```

### Thresholds

| Threshold | Valor Padrão | Ação |
|---|---|---|
| `warningThreshold` | 80% | Notificação preventiva |
| `criticalThreshold` | 95% | Alerta crítico |
| `limitAmount` | 100% | Budget excedido |

### Endpoint

```
GET /api/v1/cost/budget-alerts/{environmentId}

Response:
[
  {
    "budgetId": "uuid",
    "budgetName": "Production Monthly",
    "limitAmount": 10000.00,
    "spentAmount": 8750.00,
    "usagePct": 87.5,
    "severity": "WARNING",
    "evaluatedAt": "2026-06-28T10:30:00"
  }
]
```

---

## 11. Frontend CostModule

### Store (`costStore.ts`)

Zustand store com chamadas reais de API (desmocado):

| Estado | Tipo | Descrição |
|---|---|---|
| `costSummary` | `CostSummary` | Overview consolidado |
| `costHistory` | `CostHistory[]` | Histórico mensal |
| `optimizations` | `OptimizationSuggestion[]` | Sugestões de otimização |
| `budgetAlerts` | `BudgetAlert[]` | Alertas de orçamento |
| `anomalies` | `CostAnomaly[]` | Anomalias detectadas |
| `projection` | `CostProjectionPoint[]` | Pontos de projeção |

### Actions

| Action | Descrição | API |
|---|---|---|
| `fetchCostData()` | Carrega overview | `dashboardApi.getCostOverview()` |
| `fetchCostHistory(envId)` | Carrega histórico | `costApi.getCostHistory()` |
| `fetchBudgetAlerts(envId)` | Carrega alertas | `costApi.getBudgetAlerts()` |
| `fetchAnomalies(envId, days)` | Carrega anomalias | `costApi.getAnomalies()` |
| `fetchProjection(envId, days)` | Carrega projeção | `costApi.getProjection()` |
| `applyOptimization(id)` | Marca otimização | Local (otimista) |

### `WhatIfCost.tsx`

Componente de simulação de custo preview:
- 3-tier estimation (min/avg/max)
- Toggle button no header do CostModule
- Cálculo local baseado em tabela de preços
- Não persiste (cálculo descartável)

### Cost Types (`cost.types.ts`)

```typescript
interface CostSummary {
  totalMonthly: number
  byProvider: Record<ProviderType, number>
  byService: Record<string, number>
  currency: string
}

interface OptimizationSuggestion {
  id: string
  resourceName: string
  resourceType: string
  provider: ProviderType
  currentCost: number
  estimatedCost: number
  savings: number
  savingsPercent: number
  suggestion: string
  severity: 'high' | 'medium' | 'low'
  applied: boolean
}

interface BudgetAlert {
  budgetId: string
  budgetName: string
  limitAmount: number
  spentAmount: number
  usagePct: number
  severity: 'WARNING' | 'CRITICAL' | 'EXCEEDED'
  evaluatedAt: string
}
```

---

## 12. Fluxo de Dados

### Visão Geral

```
┌──────────┐    API       ┌──────────────┐    JPA    ┌────────────┐
│ Frontend │◄───────────►│  Controller  │◄─────────►│ PostgreSQL │
│ CostMod. │  REST/JSON   │  (CostCont.) │            │            │
└──────────┘              └──────┬───────┘            │ cost_rec. │
                                 │                    │ budgets   │
                          ┌──────▼───────┐            │ cost_scen.│
                          │  Service     │            │ cost_opt. │
                          │  Layer       │            │ cost_for. │
                          └──────┬───────┘            │ budg_al.  │
                                 │                    └────────────┘
                    ┌────────────┼────────────┐
                    │            │            │
              ┌─────▼──┐  ┌─────▼──┐  ┌─────▼──┐
              │ AWS    │  │ Manual  │  │ API    │
              │ Cost   │  │ Import  │  │ Externa │
              │ Explor.│  │         │  │ (fut.)  │
              └────────┘  └─────────┘  └─────────┘
```

### Integração com Dashboard

O `GET /api/v1/cost/overview/{envId}` é consumido pelo `DashboardModule` para exibir:
- Custo total do mês
- Top serviços por custo
- Forecast mensal
- Budgets ativos

---

## 13. Integração com AWS Cost Explorer

### `AwsCostExplorerService`

Serviço especializado para integrar com a API AWS Cost Explorer via SDK:

```
AWS Cost Explorer API
  ─────────────────────────►
  getCostAndUsage()
    ────────────────────────►
  Retorna custos agregados
    por serviço, tag, etc.
```

**Status atual**: Estrutura criada, integração real com AWS pendente (requer credenciais AWS configuradas no tenant).

### Formato de Importação

```json
{
  "environmentId": "env-123",
  "provider": "aws",
  "serviceName": "AmazonEC2",
  "amount": 1250.50,
  "currency": "USD",
  "date": "2026-06-28"
}
```

---

## 14. Modelagem de Dados

### Tabelas PostgreSQL

```sql
CREATE TABLE cost_records (
    id              VARCHAR(36) PRIMARY KEY,
    environment_id  VARCHAR(255) NOT NULL,
    provider        VARCHAR(50) NOT NULL,
    service_name    VARCHAR(255) NOT NULL,
    amount          DOUBLE PRECISION NOT NULL,
    currency        VARCHAR(3) NOT NULL DEFAULT 'USD',
    date            DATE NOT NULL,
    resource_id     VARCHAR(255),
    tags            TEXT,
    imported_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE budgets (
    id              VARCHAR(36) PRIMARY KEY,
    environment_id  VARCHAR(255) NOT NULL,
    name            VARCHAR(255) NOT NULL,
    limit_amount    DOUBLE PRECISION NOT NULL,
    spent_amount    DOUBLE PRECISION DEFAULT 0,
    currency        VARCHAR(3) NOT NULL DEFAULT 'USD',
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cost_scenarios (
    id              VARCHAR(36) PRIMARY KEY,
    tenant_id       VARCHAR(36) NOT NULL,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    environment_id  VARCHAR(255) NOT NULL,
    canvas_id       VARCHAR(36) NOT NULL,
    tier            VARCHAR(10) NOT NULL,
    current_total   DOUBLE PRECISION DEFAULT 0,
    proposed_total  DOUBLE PRECISION DEFAULT 0,
    resource_count  INTEGER DEFAULT 0,
    breakdown_json  TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP
);

CREATE TABLE cost_optimization_suggestions (
    id              VARCHAR(36) PRIMARY KEY,
    tenant_id       VARCHAR(36) NOT NULL,
    environment_id  VARCHAR(255) NOT NULL,
    resource_type   VARCHAR(100) NOT NULL,
    resource_id     VARCHAR(255) NOT NULL,
    resource_name   VARCHAR(255) NOT NULL,
    provider        VARCHAR(50) NOT NULL,
    suggestion      TEXT NOT NULL,
    current_cost    DOUBLE PRECISION NOT NULL,
    estimated_cost  DOUBLE PRECISION NOT NULL,
    savings         DOUBLE PRECISION NOT NULL,
    savings_percent DOUBLE PRECISION NOT NULL,
    severity        VARCHAR(20) NOT NULL,
    applied         BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    applied_at      TIMESTAMP
);

CREATE TABLE cost_forecasts (
    id                VARCHAR(36) PRIMARY KEY,
    tenant_id         VARCHAR(36) NOT NULL,
    environment_id    VARCHAR(255) NOT NULL,
    predicted_amount  DOUBLE PRECISION NOT NULL,
    lower_bound       DOUBLE PRECISION,
    upper_bound       DOUBLE PRECISION,
    period            VARCHAR(20) NOT NULL,
    model             VARCHAR(50) NOT NULL,
    forecast_date     TIMESTAMP NOT NULL,
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE budget_alerts (
    id                VARCHAR(36) PRIMARY KEY,
    tenant_id         VARCHAR(36) NOT NULL,
    name              VARCHAR(255) NOT NULL,
    budget_amount     DOUBLE PRECISION NOT NULL,
    current_spend     DOUBLE PRECISION NOT NULL,
    period            VARCHAR(20) NOT NULL,
    status            VARCHAR(20) NOT NULL,
    warning_threshold DOUBLE PRECISION DEFAULT 0.8,
    critical_threshold DOUBLE PRECISION DEFAULT 0.95,
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### Índices Recomendados

```sql
CREATE INDEX idx_cost_records_env_date ON cost_records(environment_id, date);
CREATE INDEX idx_cost_records_service ON cost_records(service_name);
CREATE INDEX idx_budgets_env ON budgets(environment_id);
CREATE INDEX idx_cost_scenarios_env ON cost_scenarios(environment_id);
CREATE INDEX idx_cost_scenarios_canvas ON cost_scenarios(canvas_id);
CREATE INDEX idx_cost_opt_env ON cost_optimization_suggestions(environment_id);
CREATE INDEX idx_budget_alerts_env ON budget_alerts(environment_id);
```

---

## 15. Roadmap

### Q3 2026 (Operations)

- [x] Módulo Cost com CRUD de registros e budgets
- [x] Detecção de anomalias (média móvel 7d)
- [x] Projeção de custos com banda de confiança
- [x] What-if Cost Scenario (3-tier, ADR-011)
- [x] Sugestões de otimização com savings estimados
- [x] Budget alerts com thresholds configuráveis

### Q4 2026 (Intelligence)

- [ ] **Integração AWS Cost Explorer** — Importação automática via SDK
- [ ] **Integração Azure Cost Management** — API de custos Azure
- [ ] **Relatórios Programados** — Exportação periódica de relatórios FinOps
- [ ] **Chargeback por Time** — Rateio de custos por squad/projeto
- [ ] **Showback por Tenant** — Visualização de custo por tenant

### Q1 2027 (Enterprise)

- [ ] **Anomalias ML-based** — Substituir média móvel por detecção ML
- [ ] **Recomendações Automáticas** — Auto-apply de otimizações de baixo risco
- [ ] **Budget Auto-Scaling** — Ajuste automático de budgets baseado em tendência
- [ ] **Multi-Cloud Consolidado** — Visão unificada AWS + Azure + GCP

---

## 16. Referências

### ADRs

| ADR | Título | Descrição |
|---|---|---|
| ADR-011 | Cost Preview/Persistence | What-if cost scenarios com 3-tier estimation |
| ADR-032 | Feature Flags | Feature `cost.what-if-cost` e `module.cost` |

### Código-Fonte

| Arquivo | Caminho |
|---|---|
| CostController | `backend/.../cost/infrastructure/web/CostController.java` |
| CostService | `backend/.../cost/domain/service/CostService.java` |
| AnomalyDetectionService | `backend/.../cost/domain/service/AnomalyDetectionService.java` |
| CostScenarioService | `backend/.../cost/domain/service/CostScenarioService.java` |
| CostOptimizationService | `backend/.../cost/domain/service/CostOptimizationService.java` |
| BudgetAlert | `backend/.../cost/domain/model/BudgetAlert.java` |
| CostRecord | `backend/.../cost/domain/model/CostRecord.java` |
| Budget | `backend/.../cost/domain/model/Budget.java` |
| CostScenario | `backend/.../cost/domain/model/CostScenario.java` |
| CostForecast | `backend/.../cost/domain/model/CostForecast.java` |
| costStore.ts | `frontend/src/store/costStore.ts` |
| cost.types.ts | `frontend/src/types/cost.types.ts` |

### Documentos

- [Architecture Manifesto — Part IV (C4)](../manifesto/ARCHITECTURE_MANIFESTO.md#part-iv-c4-architecture)
- [ADR-011 — Cost Preview & Persistence](../adr-011-cost-preview-persistence.md)
- [ADR-032 — Feature Flags](../adr-032-feature-flags.md)
