# ADR-039: Architecture Simulation Engine

## Status

Proposed

## Context

CloudBuilder permite que usuários desenhem arquiteturas de nuvem multi-provider (AWS, Azure, GCP, K8s) no canvas visual e gerem Terraform para deploy. Atualmente, o pipeline é:

```
Desenhar → Validar → Gerar Terraform → Deploy
```

Não há etapa de **simulação** entre validação e geração de código. Usuários não conseguem responder perguntas como:

- "Se eu levar um spike de 10x no tráfego, essa arquitetura aguenta?"
- "Qual o impacto nos 4 golden signals se esse RDS cair?"
- "Essas 2 réplicas ECS saturam com quantos requests/s?"
- "Quanta latência uma fila SQS ou um API Gateway adiciona?"
- "Esse setup de K8s com HPA escala antes de saturar?"

A falta de previsibilidade pré-deploy força os usuários a:

1. Deployar → testar → ajustar (ciclo lento e caro)
2. Confiar em "achismo" sobre capacidade da arquitetura
3. Descobrir problemas em produção (incidentes evitáveis)

## Decision

Adicionar um **Motor de Simulação de Arquitetura** como etapa entre Validação e Geração de Código:

```
Desenhar → Validar → SIMULAR → Gerar Terraform → Deploy
```

O motor recebe o canvas design + parâmetros de cenário e retorna os **4 Golden Signals** do Google SRE para cada cenário simulado.

### Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                    DESIGN MODULE (Frontend)                       │
│  ┌──────────┐  ┌───────────┐  ┌──────────────┐  ┌────────────┐ │
│  │ Component │  │  Canvas   │  │  Properties  │  │ SIMULATION │ │
│  │ Palette   │  │ (ReactFLow)│ │   Panel      │  │   Panel    │ │
│  └──────────┘  └─────┬─────┘  └──────────────┘  └──────┬─────┘ │
│                      │  nodes + properties               │       │
└──────────────────────┼──────────────────────────────────┼───────┘
                       ▼                                  ▼
┌──────────────────────────────────────────────────────────────────┐
│                    SIMULATION MODULE (Backend Java)               │
│                                                                   │
│  ┌─────────────────────┐  ┌────────────────────────────────┐     │
│  │   SimulationEngine   │  │      Scenario Definitions      │     │
│  │   (domain/service)   │  │  - TrafficSpike (2x, 5x, 10x) │     │
│  │                      │  │  - ComponentFailure (node id)  │     │
│  │  run(canvas,scenario)│  │  - LatencyInjection (ms)       │     │
│  │  → SimulationResult  │  │  - BugRegression (% errors)    │     │
│  └──────────┬───────────┘  │  - CostExplosion (multiplier)  │     │
│             │              └────────────────────────────────┘     │
│             ▼                                                     │
│  ┌────────────────────────────────────────────────────────┐      │
│  │              Resource Performance Profiles              │      │
│  │  ┌──────────┬───────────┬────────┬────────┬──────────┐ │      │
│  │  │ Resource  │ Latency   │ MaxTPS │ vCPU   │ Memory   │ │      │
│  │  │ t3.medium│ 50ms      │ 100    │ 2      │ 4GB      │ │      │
│  │  │ r5.large │ 2ms       │ 2000   │ 2      │ 16GB     │ │      │
│  │  │ S3       │ 50ms      │ 5500   │ ∞      │ ∞        │ │      │
│  │  │ Lambda   │ 100ms*    │ 1000   │ 1      │ 512MB    │ │      │
│  │  └──────────┴───────────┴────────┴────────┴──────────┘ │      │
│  │  *cold start adds ~500ms                                │      │
│  └────────────────────────────────────────────────────────┘      │
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐      │
│  │              Signal Computers                            │      │
│  │  ┌─────────────┐ ┌──────────┐ ┌────────┐ ┌──────────┐ │      │
│  │  │  Latency     │ │ Traffic  │ │ Errors │ │Saturation│ │      │
│  │  │  Computer    │ │ Computer │ │Computer│ │ Computer  │ │      │
│  │  └─────────────┘ └──────────┘ └────────┘ └──────────┘ │      │
│  └────────────────────────────────────────────────────────┘      │
└──────────────────────────────┬───────────────────────────────────┘
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│              SIMULATION PANEL (Frontend React)                    │
│                                                                   │
│  ┌─ Scenario Selector ────────────────────────────────────┐      │
│  │  [Spike 5x] [Falha RDS] [Latência 200ms] [+Custom]    │      │
│  └────────────────────────────────────────────────────────┘      │
│  ┌─ 4 Golden Signals ─────────────────────────────────────┐      │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │      │
│  │  │ ⚡ Latência │ │ 📊 Tráfego│ │ ❌ Erros   │ │ 💾 Saturação│ │      │
│  │  │  420ms    │ │  2.5k/s  │ │  12.3%   │ │  92% CPU │ │      │
│  │  │  +740% ▲  │ │ +150% ▲  │ │ +8.2pp ▲ │ │  🔴     │ │      │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ │      │
│  └────────────────────────────────────────────────────────┘      │
│  ┌─ Breakdown por Recurso ───────────────────────────────┐      │
│  │  🔴 RDS db.t3.small → 2.5k req/s (saturado)          │      │
│  │  🟡 EC2 Web t3.medium → 74% CPU (ok)                 │      │
│  │  🟢 S3 Bucket → sem impacto (escala horizontal)      │      │
│  │  🟢 Lambda fn-1 → 100ms (cold start +50ms)           │      │
│  └────────────────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────────────────┘
```

### Module Structure (Backend — Hexagonal)

```
backend/src/main/java/com/cloudbuilder/simulation/
├── domain/
│   ├── model/
│   │   ├── ScenarioType.java              # Enum: TRAFFIC_SPIKE, COMPONENT_FAILURE, LATENCY_INJECTION, BUG_REGRESSION
│   │   ├── SimulationInput.java           # Canvas nodes + edges + scenario params
│   │   ├── SimulationResult.java          # GoldenSignals + per-resource breakdown
│   │   └── GoldenSignals.java             # latency/traffic/errors/saturation records
│   ├── port/
│   │   └── PerformanceProfileRepository.java  # Interface for profile lookup
│   └── service/
│       ├── SimulationEngine.java          # Orchestrator: parse → baseline → apply → compute
│       ├── SignalComputer.java            # Per-resource golden signal computation
│       └── ScenarioApplier.java           # Modifies baseline per scenario
├── application/
│   └── dto/
│       ├── SimulationRequest.java         # REST request DTO
│       └── SimulationResponse.java        # REST response DTO
└── infrastructure/
    ├── web/
    │   └── SimulationController.java      # REST endpoints
    └── store/
        └── PerformanceProfileStore.java   # In-memory profile table
```

### Frontend — New Files

```
frontend/src/
├── modules/canvas/components/
│   └── SimulationPanel/
│       ├── SimulationPanel.tsx            # Main panel component
│       ├── GoldenSignalCard.tsx           # Single golden signal card
│       ├── ResourceBreakdown.tsx          # Per-resource breakdown table
│       └── ScenarioSelector.tsx           # Scenario selection controls
├── store/
│   └── simulationStore.ts                 # Zustand store for simulation state
└── services/
    └── simulationEngine.ts                # Client-side simulation computation
```

### Simulation Engine Algorithm

```
1. PARSE: Extrair nodes + properties + edges do canvas
2. PROFILE: Para cada node, lookup PerformanceProfile (por provider + resourceType)
3. BASELINE: Computar golden signals sem modificações (cenário "normal")
4. APPLY: Aplicar modificações do cenário escolhido:
   - TrafficSpike: multiplicar tráfego em todos ou nodes específicos
   - ComponentFailure: marcar node como "down", suas dependências perdem throughput
   - LatencyInjection: adicionar latência extra em nodes/edges específicos
   - BugRegression: adicionar % de erro em nodes específicos
5. COMPUTE: Para cada node, recalcular 4 sinais após modificações
6. PROPAGATE: Propagar impacto através das edges (dependências)
7. AGGREGATE: Sumarizar por node e total
8. RETURN: SimulationResult com baseline + simulated + breakdown
```

### Propagation Model

Simulações consideram dependências entre recursos via edges:

- Se um **RDS falha**, serviços upstream (EC2 que dependem dele) perdem acesso a dados
- Se um **API Gateway** satura, requisições são throttled (429) → erro no cliente
- Se **ECS tasks** estão em 92% CPU, e chega um spike, latency aumenta e eventualmente errors
- **S3** escala horizontalmente — menos suscetível a spikes de throughput
- **Lambda** com cold start adiciona latência mas escala horizontal com并发

### Performance Profiles (Sample — 15 entradas iniciais)

| Resource | Latency (ms) | Max TPS | vCPU | Mem (GB) | Max Conn | Notes |
|----------|-------------|---------|------|----------|----------|-------|
| aws_instance.t3.medium | 50 | 100 | 2 | 4 | 30 | Burstable |
| aws_instance.m5.large | 30 | 500 | 2 | 8 | 50 | Compute optimized |
| aws_db_instance.t3.small | 5 | 200 | 2 | 2 | 100 | Burstable |
| aws_db_instance.r5.large | 2 | 2000 | 2 | 16 | 600 | Memory optimized |
| aws_s3_bucket | 50 | 5500 | ∞ | ∞ | ∞ | Unlimited scale |
| aws_lambda_function | 100 | 1000 | 1 | 0.5 | 1000 | Cold start +500ms |
| aws_ecs_service (per task) | 10 | 500 | 1 | 2 | 250 | Scales with tasks |
| aws_api_gateway | 50 | 10000 | - | - | - | Throttle at limit |
| aws_sqs_queue | 25 | 300 | - | - | - | Standard queue |
| aws_elasticache.redis | 1 | 25000 | 2 | 13 | 65000 | In-memory |
| azurerm_linux_vm | 50 | 200 | 2 | 4 | 30 | General purpose |
| azurerm_sql_database | 5 | 500 | 2 | 5 | 100 | DTU-based |
| google_compute_instance | 50 | 200 | 2 | 4 | 30 | E2 standard |
| google_cloud_run | 100 | 1000 | 1 | 2 | 250 | Auto-scale |
| kubernetes_deployment | 10 | 500 | 1 | 2 | 250 | Per pod |

### REST API

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/simulation/run` | Authenticated | Run simulation (body: `SimulationRequest`) |
| GET | `/api/v1/simulation/scenarios` | Authenticated | List predefined scenario types |
| GET | `/api/v1/simulation/profiles` | Authenticated | List performance profiles |

### Frontend State (simulationStore.ts)

```typescript
interface SimulationState {
  activeScenario: ScenarioType | null
  scenarioParams: ScenarioParams
  baselineSignals: GoldenSignals | null
  simulatedSignals: GoldenSignals | null
  resourceBreakdown: ResourceSignal[]
  isRunning: boolean
  isVisible: boolean

  runSimulation: (nodes: Node[], edges: Edge[], type: ScenarioType, params: ScenarioParams) => void
  setScenario: (type: ScenarioType, params: ScenarioParams) => void
  toggleVisibility: () => void
  clearResults: () => void
}
```

## Consequences

### Positive

1. **Previsibilidade pré-deploy**: Usuários identificam gargalos antes de gastar em infra
2. **Shift-left de confiabilidade**: Problemas encontrados na simulação, não em incidentes
3. **Diferencial competitivo**: Nenhum concorrente (Cloudcraft, Hava.io, LucidChart) oferece simulação de performance integrada ao diagrama
4. **Extensível**: Performance Profiles podem ser alimentados por dados reais via Observability Module
5. **Zero novas dependências**: Cálculo roda in-process no Java ou no frontend, sem containers extras

### Negative

1. **Estimativas ≠ Realidade**: Performance profiles são aproximações — a simulação não substitui load testing real
2. **Manutenção das Profiles**: Tabelas precisam ser atualizadas conforme novos services/sizes da cloud
3. **Propagação simplificada**: Modelo de dependências linear — não captura circuit breakers, retries, backpressure real

### Trade-offs

1. **Client-side vs Server-side**: MVP pode rodar 100% no frontend (cálculo local + profiles embutidos). Version 2 migra para backend para persistência e perfis mais complexos
2. **Performance Profiles embutidos vs API externa**: Embutidos (MVP) vs lookup de Pricing API (V2)
3. **Simulação determinística vs probabilística**: Determinística (MVP) — mesmas entradas produzem mesmos resultados. Probabilística (V3) — distribuições de Monte Carlo

### Risks

1. **Falsa confiança**: Usuários podem tratar simulação como garantia de produção — mitigado com disclaimer no UI
2. **Manutenção dos perfis**: Cloud providers mudam specs frequentemente — mitigado com profiles versionadas + data de última atualização
3. **Performance do frontend**: Canvas com 500+ nodes pode travar no cálculo local — mitigado com Web Worker ou backend API

## References

1. **Google SRE Book** — The Four Golden Signals (Latency, Traffic, Errors, Saturation)
2. **Netflix Chaos Monkey** — Failure injection philosophy
3. **AWS Well-Architected Framework** — Reliability Pillar design principles
4. **Gremlin** — Attack scenarios (CPU stress, blackhole, latency, DNS failure)
5. **Azure Chaos Studio** — Fault injection models
6. **ADR-011** — Cost estimation patterns (TerraformCostEstimator.java, WhatIfCost.tsx)
7. **ADR-034/035** — Event-driven architecture for async simulation results
8. **Google SRE: The Four Golden Signals** — https://sre.google/sre-book/monitoring-distributed-systems/

## Appendix: MVP vs V2 vs V3

| Feature | MVP | V2 | V3 |
|---------|-----|----|----|
| Simulation Engine | 100% frontend | Backend API | Backend + GPU? |
| Profiles | 15 entries, hardcoded | 80+ entries, JSON config | API-driven, real data |
| Scenarios | TrafficSpike, Failure, Latency | + Bug, Cost, Scale | + Composite scenarios |
| Propagation | Direct deps only | + Network topology | Full dependency graph |
| Persistence | — | Save results to backend | Compare runs |
| UI | GoldenSignalCard + Breakdown | + Charts + History | + Timeline animation |
| Accuracy | Deterministic approximations | + Statistical distributions | + ML-calibrated |
