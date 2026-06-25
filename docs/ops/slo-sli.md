# CloudBuilder — SLO / SLI Framework

**Documento**: SRE — Service Level Objectives & Indicators  
**Versão**: 1.0.0  
**Data**: 2026-06-22  
**Autor**: SRE Agent — FAANg  

Referências: Google SRE Book, Google CRE — Service Level Indicator Patterns

---

## 1. Premissas de Tráfego (Phase GO — Beta Público)

| Métrica | Valor Estimado | Fonte |
|---------|---------------|-------|
| Usuários ativos diários (DAU) | 500–2.000 | Projeção marketing |
| Requisições por usuário/sessão | ~80 (média) | Estimativa design + provision |
| Requisições/mês | **500.000** | 2.500 req/dia x 20 dias x 10 users |
| Pico de tráfego esperado | 50 req/s | Rajadas de salvamento + code gen |
| Budget mensal de erros (1%) | **5.000 erros** | 500.000 x 1% |
| Custo infra AWS | $3,07/h | Estimativa pré-existente |

> **Nota**: SLOs calibrados para este volume. Revisar quando DAU > 5.000 ou req/mês > 2M.

---

## 2. Service Tiers

### Tier 1 — Critical (99,5% SLO)

Serviços cuja indisponibilidade impede o uso da plataforma.

| Serviço | Endpoints-chave | Dependências |
|---------|----------------|-------------|
| **Auth/Login** | POST /api/v1/auth/login, POST /api/v1/auth/register, GET /api/v1/auth/me | PostgreSQL, JWT, OPA |
| **Canvas Design** | GET /api/v1/canvases, POST .../nodes, POST .../validate | PostgreSQL, OPA |
| **Code Generation** | POST /api/v1/canvases/{id}/generate | PostgreSQL, Go Engine |

### Tier 2 — Important (99,0% SLO)

| Serviço | Endpoints-chave | Dependências |
|---------|----------------|-------------|
| **Cost Estimation** | GET /api/v1/cost/overview/{envId} | PostgreSQL |
| **Provision/Deploy** | POST .../sync, POST .../deploy | PostgreSQL, Go Engine |
| **Platform Templates** | GET /api/v1/platform/catalog | PostgreSQL |
| **Drift Detection** | GET /api/v1/environments/{id}/drift | PostgreSQL, Go Engine |

### Tier 3 — Best-Effort (98,0% SLO)

| Serviço | Endpoints-chave | Dependências |
|---------|----------------|-------------|
| **AIOps Assistant** | POST /api/v1/aiops/query | LLM, Circuit breaker |
| **Docs Module** | GET /api/v1/docs/* | PostgreSQL |
| **Audit Trail** | GET /api/v1/audit/events | PostgreSQL |
| **Analytics/Metrics** | GET /api/v1/metrics/* | PostgreSQL, Micrometer |

---

## 3. Service Level Indicators (SLIs)

### 3.1 Availability (Disponibilidade)

SLI = successful_requests / total_requests x 100

- Janela: Rolling 28 dias
- Inclui: HTTP 2xx/4xx (exceto 401/403 auth)
- Exclui: Health checks, rate-limit (429), auth errors
- Coleta: Micrometer http_server_requests_seconds_count

| Tier | Alvo (mensal) | Budget (500k req/mês) |
|-----|--------------|----------------------|
| Tier 1 | **99,5%** | <= 2.500 falhas |
| Tier 2 | **99,0%** | <= 5.000 falhas |
| Tier 3 | **98,0%** | <= 10.000 falhas |
| **Geral** | **99,0%** | **<= 5.000 falhas** |

### 3.2 Latency (Latência p95)

SLI = p95(tempo_de_resposta) para requests bem-sucedidas

| Operação | Target p95 | Justificativa |
|----------|-----------|---------------|
| Auth/Login | **< 300 ms** | Login instantâneo |
| Canvas render | **< 500 ms** | Tempo real (ReactFlow) |
| Salvar canvas | **< 1 s** | Operação síncrona |
| Code Generation | **< 5 s** | Geração HCL via Go Engine |
| Cost/Provision | **< 2 s** | Operações batch |
| AIOps/Docs | **< 10 s** | Chamadas LLM externo |

### 3.3 Error Rate (Taxa de Erro)

SLI = (http_5xx + timeout) / total_requests x 100

| Tier | Target | Gatilho Alerta |
|-----|--------|----------------|
| Tier 1 | **< 1%** | > 0,5% / 5min warning; > 1% critical |
| Tier 2 | **< 3%** | > 1,5% / 5min warning; > 3% critical |
| Tier 3 | **< 5%** | > 3% / 10min warning; > 5% critical |

### 3.4 Freshness (Atualidade de Dados)

| Operação | Target | Medição |
|----------|--------|---------|
| Sync canvas -> estado real | **<= 5 s** | Diff timestamps |
| Drift detection | **<= 60 s** | Polling Go Engine 30s |
| Notificações deploy | **<= 10 s** | SSE/pooling status |

### 3.5 Durability (Durabilidade)

SLI = registros_persistidos / registros_confirmados x 100

- Target: **99,9999%** (6 noves) — PostgreSQL 16 + WAL + backups

---

## 4. Service Level Objectives (SLOs)

### 4.1 Disponibilidade (Mensal)

| Tier | SLO | Downtime/mês | Budget (500k req) |
|------|-----|-------------|-------------------|
| Tier 1 | **99,5%** | 3h 39min | 2.500 |
| Tier 2 | **99,0%** | 7h 18min | 5.000 |
| Tier 3 | **98,0%** | 14h 36min | 10.000 |
| **Geral** | **99,0%** | **7h 18min** | **5.000** |

### 4.2 SLOs Compostos

| Fluxo | SLIs | SLO | Cálculo |
|-------|------|-----|---------|
| Login -> Canvas -> CodeGen | Auth x Canvas x CodeGen | **98,5%** | 0,995^3 |
| Login -> Provision | Auth x Provision | **98,5%** | 0,995 x 0,99 |
| Login -> Cost -> Platform | Auth x Cost x Platform | **97,5%** | 0,995 x 0,99^2 |

### 4.3 SLOs de Latência (p95)

| Operação | SLO p95 | Endpoint |
|----------|---------|----------|
| Login/Registro | **< 300 ms** | POST /api/v1/auth/* |
| Listar canvases | **< 500 ms** | GET /api/v1/canvases |
| Salvar canvas | **< 1 s** | PUT /api/v1/canvases/{id} |
| Gerar código | **< 5 s** | POST .../generate |
| Consultar custo | **< 2 s** | GET .../cost/overview/{envId} |
| Consulta AIOps | **< 10 s** | POST /api/v1/aiops/query |

---

## 5. Error Budget (Detalhado em error-budget-policy.md)

### 5.1 Alocação por Tier (500k req/mês)

| Tier | % | Erros/mês |
|------|---|-----------|
| Tier 1 | 0,5% | 2.500 |
| Tier 2 | 1,0% | 5.000 |
| Tier 3 | 2,0% | 10.000 |
| **Total** | **1,0% médio** | **5.000** |

### 5.2 Burn Rate

| Taxa | Ação |
|------|------|
| < 1x | Nenhuma |
| 1–2x | Monitorar |
| 2x–5x | Alerta PagerDuty |
| 5x–10x | Página on-call (SEV2) |
| > 10x | Incidente SEV1 — stop deploys |

### 5.3 MWMBR Alerts

| Janela Rápida | Janela Longa | Burn Rate | Severidade |
|--------------|-------------|-----------|------------|
| 1 min | 1 hora | >= 14,4x | Critical |
| 5 min | 6 horas | >= 6x | Warning |
| 30 min | 3 dias | >= 2x | Info |

---

## 6. Dependências Críticas

| Dependência | Impacto | Mitigação |
|-------------|---------|-----------|
| PostgreSQL 16 | Todos indisponíveis | HikariCP (20), PITR, WAL |
| OPA | Mutações bloqueadas | Circuit breaker + fallback Java |
| Go Engine | Code gen + drift falham | Timeout 30s + retry 3x |
| LLM (AIOps) | AIOps degradado | Circuit breaker 40%/60s |

---

## 7. Revisão

| Evento | Ação |
|--------|------|
| Mensal | Review SLOs no SRE meeting |
| Trimestral | Recalibrar targets |
| Após SEV1 | Revisar SLOs violados |
| DAU > 5.000 | Recalcular budgets |

---

## 8. Referências

1. Google SRE Book — Service Level Objectives
2. Google SRE Book — Practical Alerting
3. Google CRE — SLI Patterns
4. ADR-023: Circuit Breaker Patterns (Resilience4j)
