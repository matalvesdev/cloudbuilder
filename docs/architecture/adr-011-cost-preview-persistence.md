# ADR-011: What-if Cost + Preview Workflow Backend Persistence

**Data**: 2026-06-19
**Status**: Accepted
**Decisão**: `CostScenario` e `DeployPlan` como entidades JPA independentes nos respectivos módulos (cost e provision), com serviços CRUD dedicados e endpoints REST no controlador existente.

---

## Contexto

O MVP report identificou três pendências de média prioridade:

1. **What-if Cost** — Cálculo de custo 3-tier (min/avg/max) existia apenas no frontend (cálculo local a partir dos nodes do canvas). Sem persistência, cenários eram perdidos ao recarregar a página.
2. **Preview Workflow** — Plan diff (add/change/destroy) era calculado e exibido inline no ProvisionModule, mas sem backend para armazenar resultados de planos para auditoria e comparação histórica.
3. **Service Map + Scorecards** — Já implementados no backend (ServiceMapController, ScorecardController) e frontend, mas sem testes JUnit.

---

## Problema

Sem persistência:
- Cenários de what-if cost são voláteis — usuário não pode comparar cenários entre sessões
- Planos de deploy não têm rastro de auditoria — não é possível verificar quem aplicou o quê e quando
- Diferença entre "planned" e "applied" depende apenas do frontend

---

## Alternativas Consideradas

### Alternativa A — Embedding nos serviços existentes (CostService)

Adicionar métodos de scenario no `CostService` existente, usando a mesma entidade `CostRecord`.

**Prós**: Menos arquivos, lógica centralizada.
**Contras**: Mistura conceitos diferentes (custo real vs simulação), viola SRP.

### Alternativa B — Entidades JPA separadas nos módulos corretos

`CostScenario` no módulo cost, `DeployPlan` no módulo provision.

**Prós**: Respeita boundaries do Spring Modulith, cada módulo gerencia seu domínio.
**Contras**: Mais arquivos (entity + repository + service por módulo).

### Alternativa C — Document-based storage (JSON no PostgreSQL)

Armazenar cenários como JSONB em tabela genérica, sem schema fixo.

**Prós**: Máxima flexibilidade para evolução do schema.
**Contras**: Perde type safety do JPA, queries complexas exigem JSONB functions, sem índices nativos.

---

## Decisão

**Alternativa B** — Entidades JPA separadas nos módulos cost e provision.

### CostScenario (`backend/src/main/java/.../cost/domain/model/CostScenario.java`)
- JPA entity com `id`, `tenantId`, `environmentId`, `canvasId`, `name`, `description`
- `minCost`/`avgCost`/`maxCost` — valores calculados dos 3 tiers
- `breakdownJson` — TEXT com JSON detalhado por serviço
- `status` — draft → review → applied
- Endpoints via `CostController` existente

### DeployPlan (`backend/src/main/java/.../provision/domain/model/DeployPlan.java`)
- JPA entity com `id`, `tenantId`, `environmentId`, `canvasId`
- `addCount`/`changeCount`/`destroyCount` — contagem de recursos
- `resourcesJson` — TEXT com JSON detalhado dos recursos e ações
- `status` — planned → applied / failed
- `createdAt`/`appliedAt` — timestamps de auditoria
- Endpoints via `CodeGeneratorController` existente (rota `/api/v1/canvases/{id}/generate/plan/**`)

### Controllers reutilizados (não criados novos)
- `CostController.java` — 3 novos endpoints (POST/GET/DELETE scenarios)
- `CodeGeneratorController.java` — 5 novos endpoints (POST plan, GET, list, apply, fail)

Razão: Novos controllers seriam redundantes — os endpoints são semanticamente próximos aos controladores existentes. `CodeGeneratorController` já gerencia `/generate`, fazer parte do fluxo de preview de código.

---

## Consequências

### Positivas
- ✅ Cenários de custo sobrevivem a refresh — usuário pode comparar entre sessões
- ✅ Planos de deploy têm trilha de auditoria completa (quando criado, quando aplicado, status)
- ✅ Status transition (planned → applied/failed) permite rastrear execução
- ✅ 0 novos controllers — endpoints nos controladores existentes
- ✅ Módulo cost e provision permanecem com domínios isolados

### Negativas
- ❌ 6 novos arquivos Java (3 entities + 3 services/repositories)
- ❌ DeployPlan endpoints no CodeGeneratorController misturam responsabilidades (geração de código + gestão de planos)
- ❌ Sem testes JUnit para os novos services (cobertura será adicionada em sessão futura)

### Mitigações
- Novo controller dedicado (`DeployPlanController`) pode ser extraído se o `CodeGeneratorController` crescer além de 5 endpoints de plan
- Testes JUnit para `CostScenarioService` e `DeployPlanService` seguem no backlog técnico

---

## Referências

- **ADR-010**: Backend Quality Gate (test coverage + UUID→String migration)
- **mvp-readiness-report.md**: Seção 15 — pendências de média prioridade resolvidas
- **Spring Modulith Documentation**: Domain boundaries entre módulos cost → provision
- **Martin Fowler — Patterns of Enterprise Application Architecture**: Domain Model vs Active Record
