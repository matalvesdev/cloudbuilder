# SRE Competitor Research & Implementation Recommendations

**Data**: 2026-06-24  
**Autor**: SRE Agent (FAANg)  
**Contexto**: CloudBuilder Native Observability Subsystem (ADR-008)  
**Objetivo**: Recomendar implementacoes de SRE baseadas em analise de 11 ferramentas

---

## 1. Executive Summary

Este relatorio analisa 11 ferramentas/plataformas de SRE e observabilidade para extrair padroes de implementacao que o CloudBuilder pode adotar nativamente.

### Areas Criticas Identificadas

| Area | Prioridade | Esforco | Referencias |
|------|-----------|---------|-------------|
| Multi-window burn rate alerts | CRITICA | Medio | Google SRE, Datadog, Grafana |
| Error budget policy & enforcement | CRITICA | Medio | Datadog, Dynatrace, Google SRE |
| Runbook automation & auto-remediation | CRITICA | Alto | PagerDuty, Dynatrace, New Relic |
| Apdex & reliability scoring | ALTA | Baixo | New Relic, Dynatrace, Google SRE |
| Synthetic monitoring (Playwright) | ALTA | Medio | Checkly, Better Uptime, New Relic |
| Chaos engineering integration | MEDIA | Alto | LitmusChaos, Gremlin, Chaos Mesh |
| Status pages & stakeholder comms | MEDIA | Baixo | Better Uptime, PagerDuty, Datadog |

---

## 2. Ferramentas Analisadas

| # | Ferramenta | Categoria | Diferencial Principal |
|---|-----------|-----------|----------------------|
| 1 | **Datadog SLO** | SLO/Alerting | Multi-window burn rate + error budget tracking |
| 2 | **Grafana SLO Plugin** | SLO/Alerting | Prometheus-based SLI recording rules |
| 3 | **Dynatrace SLO** | SLO/AI-Alerting | Davis AI para anomaly detection + SLO |
| 4 | **New Relic SLO** | SLO/NRQL | NRQL-based SLO com faceting por dimensao |
| 5 | **PagerDuty** | Incident Management | Runbook automation + on-call scheduling |
| 6 | **Checkly** | Synthetic Monitoring | Playwright-based browser checks + API checks |
| 7 | **Better Uptime** | Status Pages | Status pages + heartbeat monitoring + incident |
| 8 | **Gremlin** | Chaos Engineering | Attack library + safe blast radius controls |
| 9 | **Chaos Mesh** | Chaos Engineering | K8s-native fault injection + CRD-based |
| 10 | **LitmusChaos** | Chaos Engineering | ChaosHub + workflow orchestration |
| 11 | **Google SRE Book** | Framework | Multi-window, Multi-burn rate, Error Budget |

---

## 3. SLO/SLI Analysis

### 3.1 Datadog SLO — Burn Rate Algorithm

**Algoritmo de Burn Rate:**

Burn Rate = (1 - SLI) / (1 - SLO_target)

- Burn rate = 1: exatamente no target
- Burn rate > 1: consumindo budget mais rapido que o esperado
- Burn rate < 1: abaixo do budget

**Alert thresholds:**
- Critical: burn rate > 14.4 (esgota 30d em 2d) -> P0 page
- Warning: burn rate > 6 (esgota 30d em 5d) -> P1 alert
- Info: burn rate > 1 -> P2 ticket

**Error Budget tracking:**
Error Budget = (1 - SLO_target) * total_events
Remaining Budget = (Error Budget - bad_events) / Error Budget * 100

### 3.2 Grafana SLO Plugin — Composite SLOs

SLI composite = SUM(good_events_weighted) / SUM(total_events_weighted)

Suporte a composite SLOs (ex: latencia P95 + error rate combinados em 1 SLO).

### 3.3 Dynatrace SLO — AI-Powered Degradation

1. Davis AI detecta baseline de performance
2. Desvio > 3sigma do baseline -> dispara SLO degradation
3. SLO degradation alert com contexto de metricas
4. Auto-remediation: scaling, restart, rollback

### 3.4 New Relic SLO — NRQL Faceting

NRQL-based SLO: qualquer query NRQL pode virar SLI
Faceting por dimensao: SLO por region, service, host, tenant

SELECT count(*) as total FROM Transaction FACET region, host SINCE 30 days ago

### 3.5 Google SRE Book — Multi-Window, Multi-Burn Rate

**Estrategia canonica:**

| Janela | Burn Rate | Budget Consumido | Exemplo (99.9% SLO, 30d) |
|--------|-----------|-----------------|--------------------------|
| 1h | 14.4x | ~100% em 2 dias | 0.14% erro sustentado por 1h |
| 6h | 6x | ~100% em 5 dias | 0.06% erro sustentado por 6h |
| 3d | 1x | ~100% em 30 dias | 0.01% erro sustentado por 3d |

---

## 4. Alerting Best Practices

### 4.1 Datadog — Alert Fatigue Reduction

1. Multi-condition alerts: AND/OR/NOT combinando multiplas metricas
2. Evaluation delay: Aguardar N avaliacoes consecutivas antes de alertar
3. Group by: Agregar alertas por host/service/cluster
4. Alert deduplication: mesmo alerta nao dispara multiplas vezes
5. No-data handling: configurar acao quando metrica nao reporta

### 4.2 PagerDuty — On-Call & Escalation

**Escalation policy:** Level 1 (5min ack) -> Level 2 (10min) -> Level 3 (15min)
**On-call schedules:** Weekly/rotating/overrides
**Notification rules:** Email, SMS, phone, push, Slack

---

## 5. Incident Management

### 5.1 PagerDuty Runbook Automation

Runbook steps model:
- id: step-1, action: ssh, command: top -b -n1 | head -20
- id: step-2, action: webhook, url: /api/auto-scale
- id: step-3, action: slack, message: notification to channel
- rollback: ssh, command: systemctl restart app

### 5.2 Incident Lifecycle

| Stage | Status | TTL | Action |
|-------|--------|-----|--------|
| 1. Triggered | TRIGGERED | - | Alert rule breached |
| 2. Acknowledged | ACKNOWLEDGED | 15min | Engineer assigned |
| 3. Diagnosing | DIAGNOSING | 30min | Runbook execution |
| 4. Resolving | RESOLVING | - | Fix applied |
| 5. Resolved | RESOLVED | - | All clear |
| 6. Post-mortem | POSTMORTEM | 72h | Root cause + action items |

---

## 6. Apdex & Reliability Metrics

### 6.1 New Relic Apdex

Apdex_T = (Satisfied + Tolerating/2) / Total Samples

Where:
- Satisfied = count(response_time <= T)
- Tolerating = count(T < response_time <= 4T)
- Frustrated = count(response_time > 4T)
- T = threshold (ex: 500ms for web, 5s for API)

Example with T=500ms:
- 1000 requests <= 500ms -> Satisfied
- 200 requests 500ms-2s -> Tolerating
- 50 requests > 2s -> Frustrated
- Apdex = (1000 + 200/2) / 1250 = 1100/1250 = 0.88

### 6.2 Dynatrace Reliability Score

Reliability = weighted_combination(
  Apdex_score * 0.3,
  Error_rate_score * 0.3,
  Latency_P95_score * 0.2,
  Availability_score * 0.2
)

### 6.3 CloudBuilder Apdex Recommendation

Implementar ApdexService com:
- ApdexConfig: service name, thresholdMs, satisfied/tolerating limits
- ApdexScore: value, counts, trend
- Computation @Scheduled a cada 5min
- Dashboard trend chart integrado ao Scorecard

---

## 7. Chaos Engineering

### 7.1 Gremlin — Attack Library

| Categoria | Ataques | Use Case |
|-----------|---------|----------|
| Compute | CPU burn, memory fill, IO stress | Resource exhaustion |
| Network | Latency, packet loss, blackhole | Network degradation |
| State | Process kill, shutdown, time travel | Instance failure |
| DNS | Blackhole, timeout | DNS dependency failure |
| HTTP | Latency, error, blackhole | API dependency failure |
| AWS | EC2 stop, terminate, ASG resize | Cloud provider failure |

**Blast Radius Controls:**
- teams: [platform-sre] - who can run
- environments: [staging] - where it runs
- targets: host count 1, container max 10%
- auto_stop: if error_rate > 5%

### 7.2 Chaos Mesh — K8s-Native (CNCF)

CRD-based fault injection:
kind: PodChaos, action: pod-kill, mode: one
selector: namespaces [cloudbuilder], labels role: worker
duration: 60s, scheduler: @every 30m

### 7.3 LitmusChaos — ChaosHub (CNCF)

Workflow-based:
kind: ChaosEngine
experiments:
  - name: pod-delete (rank 1)
    probe: httpProbe, url: http://service:80, expected: 200
  - name: container-kill (rank 2)
    probe: httpProbe

### 7.4 CloudBuilder Chaos Engine (Recomendacao)

CloudBuilder nao gerencia K8s diretamente (e platform engineering, nao runtime).
Foco em simulacao de falhas via API:

1. **Simulacao via API**: latencia, erro, timeout em chamadas de API
2. **Chaos experiments como canvas designs**: usar Design Module
3. **Probes de resiliencia**: health antes/durante/depois
4. **SLO compliance durante experimento**

---

## 8. Synthetic Monitoring

### 8.1 Checkly — Playwright-based Browser Checks

- Browser checks: Scripts Playwright em schedule
- API checks: HTTP requests with assertions
- Heartbeat checks: Ping simples para endpoints
- Multi-location: Execucao de checks de multiplas regioes
- Alerting: SLO-based alerting on check results

Playwright check example:
  const start = Date.now();
  await page.goto(https://app.cloudbuilder.io/login);
  await page.fill([name=email], test@example.com);
  await page.click(button[type=submit]);
  await expect(page.locator(.dashboard)).toBeVisible({ timeout: 10000 });
  // Report metrics to CloudBuilder
  await fetch(/api/v1/metrics/record, { method: POST, body: JSON.stringify({
    metricName: synthetic.login.duration,
    value: Date.now() - start,
    tags: { check: login-flow, region: us-east-1 }
  })});

### 8.2 Better Uptime — Heartbeat Monitoring

Heartbeat: GET /api/v1/heartbeat/{checkId}
Se nao recebido em N minutos -> incident
Ideal para: cron jobs, workers, batch processes

---

## 9. Gap Analysis vs CloudBuilder ObserveModule

### 9.1 Current CloudBuilder ObserveModule Assets

| Componente | Status | Arquivo |
|-----------|--------|---------|
| SloDashboard | Basico | SloDashboard.tsx (120 linhas) |
| AlertRulesView | Basico | AlertRulesView.tsx |
| IncidentsView | Basico | IncidentsView.tsx |
| ServiceMapView | Completo | ServiceMapView.tsx |
| ScorecardView | Completo | ScorecardView.tsx |
| MetricsDashboard | Completo | MetricsDashboard.tsx |
| TraceExplorer | Completo | TraceExplorer.tsx |
| LogViewer | Completo | LogViewer.tsx |
| DisasterRecovery | Completo | DisasterRecovery.tsx |
| DriftDetection | Completo | DriftDetection.tsx |

### 9.2 Gap Matrix

| Feature | CB | DD | GF | DT | NR | Prioridade |
|---------|----|----|----|----|----|-----------|
| Multi-window burn rate | N | Y | Y | Y | Y | CRITICA |
| Error budget policy | N | Y | Y | Y | N | CRITICA |
| Burn rate alerts | N | Y | Y | Y | Y | CRITICA |
| Runbook automation | N | N | N | Y | N | CRITICA |
| Anomaly detection | N | Y | Y | Y | N | ALTA |
| Apdex scoring | N | Y | N | Y | Y | ALTA |
| Synthetic monitoring | N | Y | N | Y | Y | ALTA |
| Post-mortem tracking | N | N | N | N | N | MEDIA |
| Chaos experiments | N | N | N | N | N | BAIXA |
| Status pages | N | Y | N | N | N | BAIXA |

CB=CloudBuilder, DD=Datadog, GF=Grafana, DT=Dynatrace, NR=NewRelic

---

## 10. Implementation Recommendations

### P0 — Critico (8 dias)

**1. Multi-window burn rate (3 dias)**
- Adicionar colunas ao schema slo_definitions (fast/slow/review burn rate)
- Criar BurnRateAlertService com @Scheduled(fixedRate=60000)
- Avaliar 3 janelas para cada SLO simultaneamente
- Alertas consolidados (nao 3 alertas para o mesmo SLO)
- UI: abas de burn rate no SloDashboard

**2. Error budget policy (2 dias)**
- 4 estados: NORMAL(>50%), WARNING(20-50%), CRITICAL(<20%), EXHAUSTED(0%)
- Acoes config: freeze deploys, block features, page on-call
- Integrar com Provision Module para enforcement

**3. Burn rate alerts (3 dias)**
- AlertEvaluationService estendido
- 3 janelas simultaneas com severidade por janela
- Alert consolidation

### P1 — Alto (10 dias)

**4. Runbook automation (6 dias)**
- Schema runbooks + runbook_executions
- RunbookEngine: executor de steps (SSH, webhook, Slack)
- Trigger automatico (incidente) ou manual
- Rollback support
- UI: steps editor

**5. Apdex service (2 dias)**
- ApdexConfig + ApdexScore entidades
- ApdexComputationService @Scheduled a cada 5min
- Dashboard trend chart
- Scorecard integration

**6. Synthetic monitoring (2 dias)**
- SyntheticCheck + SyntheticCheckResult schemas
- Playwright executor (processo separado)
- API checks + heartbeat checks
- SLO computation on synthetic results

### P2 — Medio (11 dias)

**7. Chaos experiments (8 dias)**
- ChaosExperiment + ChaosExecution schemas
- Canvas design para experimentos (Design Module)
- Fault injection via API (latency, error, timeout)
- Probes de resiliencia

**8. Status pages (3 dias)**
- StatusPageConfig entidade
- Pagina publica (/status)
- Componentes de status (API, Web, DB)
- Subscribers (email, webhook)
- Incident updates automaticos

---

## 11. Proposed ADRs

| ADR | Titulo | Foco |
|-----|--------|------|
| SRE-001 | Multi-Window Burn Rate Alerting | Algoritmo de burn rate, 3 janelas, severidade |
| SRE-002 | SLO Framework with Error Budget Policy | SLO lifecycle, error budget enforcement, faceting |
| SRE-003 | Incident Management with Runbook Automation | Incident lifecycle, runbook engine, post-mortem |

---

## 12. Implementation Roadmap

### Sprint 1-2: Foundation (8 dias)
- Schema migration slo_definitions (burn rate columns) - 1d
- BurnRateAlertService (3 windows) - 2d
- Burn rate dashboard UI - 1d
- Error Budget Policy Engine - 2d
- Apdex Service + UI - 2d

### Sprint 3-4: Automation (11 dias)
- Runbook engine + schema - 3d
- Runbook executor service - 3d
- Runbook UI (steps editor) - 2d
- Post-mortem schema + UI - 1d
- Synthetic checks + browser runner - 2d

### Sprint 5-6: Advanced (11 dias)
- Chaos experiment schema + API - 3d
- Chaos canvas design + executor - 3d
- Status page engine + UI - 2d
- Anomaly detection (baseline) - 3d

---

## 13. References

### Google SRE
- Google SRE Book — Chapter 4: Service Level Objectives
- Google SRE Book — Chapter 5: Eliminating Toil
- Google SRE Workbook — Alerting on SLOs
- Burns et al. — Multi-window, Multi-burn-rate alerting

### Datadog
- Datadog SLO Documentation
- Datadog Error Budget Tracking
- Datadog Multi-Window Burn Rate Alerting

### Grafana
- Grafana SLO Plugin
- Grafana Alerting
- Prometheus SLO Recording Rules

### Chaos Engineering
- Gremlin Documentation
- Chaos Mesh Documentation
- LitmusChaos Documentation
- Principles of Chaos

### Synthetic Monitoring
- Checkly Documentation
- Better Uptime Documentation
- Playwright Documentation

### Academic
- Apdex Specification (apdex.org)

---

*Documento gerado pelo SRE Agent (FAANg) em 2026-06-24.*
*Baseado em analise de documentacao oficial, engineering blogs e documentacao tecnica de 11 ferramentas.*
