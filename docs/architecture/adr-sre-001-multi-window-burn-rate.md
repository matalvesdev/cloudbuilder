# ADR-SRE-001: Multi-Window, Multi-Burn Rate Alerting

## Status
Proposto — 2026-06-24

## Contexto

O CloudBuilder atualmente possui um sistema basico de alertas baseado em thresholds simples (AlertEvaluationService).
Alertas de threshold simples geram alta taxa de falsos positivos e nao refletem a urgencia real de consumo de error budget.
A experiencia do Google SRE Book, Datadog e Grafana mostra que multi-window burn rate e o padrao ouro para alertar em SLOs.

### Problema
Alertas baseados em threshold simples tem 3 problemas fundamentais:
1. **Falsa urgencia**: Um pico curto de erros dispara alerta mesmo sem consumir budget significativo
2. **Falsa seguranca**: Uma taxa de erro baixa mas sustentada (ex: 0.05% por 24h) pode esgotar o budget sem disparar alerta
3. **Falta de contexto**: Um alerta nao informa se o erro esta acelerando ou desacelerando

## Decisao

Adotar multi-window, multi-burn rate alerting com 3 janelas simultaneas, conforme especificado abaixo.

### Arquitetura

**Burn Rate Formula:**
Burn Rate = (1 - SLI) / (1 - SLO_target)

Onde:
- Burn Rate = 1: exatamente no target
- Burn Rate > 1: consumindo budget mais rapido que o esperado
- Burn Rate < 1: abaixo do budget (folga)

**3 Janelas Simultaneas:**

| Janela | Burn Rate | Budget Esgota | Severidade | Acao |
|--------|-----------|---------------|------------|------|
| Fast (1h) | > 14.4x | ~2 dias | P0 - Critical | Page on-call imediatamente |
| Slow (6h) | > 6.0x | ~5 dias | P1 - Warning | Criar incidente + notificar |
| Review (3d) | > 1.0x | ~30 dias | P2 - Info | Ticket + revisao semanal |

**Logica de Disparo:**
- Se QUALQUER janela exceder o threshold -> alertar
- A severidade e determinada pela JANELA MAIS RAPIDA que disparou
- Se multiplas janelas dispararem, usar a maior severidade
- Alertas sao CONSOLIDADOS: 1 alerta por SLO, nao 3

### Schema de Dados

Extensao do schema slo_definitions existente (ADR-008):

ALTER TABLE slo_definitions ADD COLUMN IF NOT EXISTS
  fast_burn_rate FLOAT DEFAULT 14.4;
ALTER TABLE slo_definitions ADD COLUMN IF NOT EXISTS
  slow_burn_rate FLOAT DEFAULT 6.0;
ALTER TABLE slo_definitions ADD COLUMN IF NOT EXISTS
  review_burn_rate FLOAT DEFAULT 1.0;
ALTER TABLE slo_definitions ADD COLUMN IF NOT EXISTS
  fast_window_min INTEGER DEFAULT 60;
ALTER TABLE slo_definitions ADD COLUMN IF NOT EXISTS
  slow_window_min INTEGER DEFAULT 360;
ALTER TABLE slo_definitions ADD COLUMN IF NOT EXISTS
  review_window_min INTEGER DEFAULT 4320;

### Algoritmo de Avaliacao

BurnRateAlertService com @Scheduled(fixedRate=60000):

1. Para cada SLO habilitado:
2.   Para cada janela (fast, slow, review):
3.     Query metrics_ts dos ultimos N minutos
4.     Calcular good_events / total_events = SLI
5.     Calcular burn_rate = (1 - SLI) / (1 - target)
6.     Se burn_rate > threshold_da_janela:
7.       Marcar severidade = max(severidade_atual, janela_severidade)
8.   Se severidade > NONE:
9.     Consolidar em 1 alerta por SLO
10.    Atualizar incidente existente ou criar novo

### API REST

| Metodo | Path | Descricao |
|--------|------|-----------|
| GET | /api/v1/slos/{id}/burn-rate | Burn rate atual (3 janelas) |
| GET | /api/v1/slos/{id}/burn-rate/history | Historico de burn rate |
| PUT | /api/v1/slos/{id}/burn-rate-config | Configurar thresholds |

### Frontend

Extensao do SloDashboard.tsx com:
- 3 abas de burn rate (Fast, Slow, Review)
- Gauge chart por janela (verde/amarelo/vermelho)
- Timeline de burn rate historico (Recharts AreaChart)
- Indicador de severidade atual

## Alternativas Consideradas

### A — Threshold Simples (Status Quo)
- Prós: Simples de implementar, baixo custo computacional
- Contras: Alta taxa de falsos positivos, nao reflete consumo de budget
- **Rejeitada** por nao atender aos requisitos de SRE

### B — Single-Window Burn Rate
- Prós: Melhor que threshold, media complexidade
- Contras: Janela unica nao diferencia urgencia real vs pico temporario
- **Rejeitada** por perder o beneficio de multi-janela

### C — Machine Learning Anomaly Detection (Escolhida como futura)
- Prós: Detecta anomalias que burn rate nao cobre (ex: degradacao lenta)
- Contras: Maior complexidade, requer dados historicos para treino
- **Adiada** para Fase 3, apos baseline de dados

## Consequencias

### Positivas
- Reducao significativa de falsos positivos (estimativa: 70% menos alertas)
- Alertas com contexto claro de urgencia (severidade por janela)
- Alinhamento com padrao Google SRE / Datadog / Grafana
- Error budget tracking preciso com 3 perspectivas temporais

### Negativas
- Maior custo computacional (3 queries por SLO a cada 60s)
- Complexidade adicional no schema e servico
- Requer tuning inicial dos thresholds (defaults do Google SRE podem nao ser ideais)

### Riscos
- **Performance**: 3 queries por SLO * N SLOs pode ser custoso
  - Mitigacao: Caffeine cache com TTL de 30s para as queries
- **Tuning**: Thresholds padrao podem ser muito sensiveis
  - Mitigacao: Thresholds configuraveis por SLO, com defaults comprovados
- **Alert fatigue**: Mesmo com melhoria, ainda pode gerar alertas em excesso
  - Mitigacao: Alert consolidation + evaluation delay

## Referencias
- Google SRE Workbook — Alerting on SLOs
- Burns et al. — Multi-window, Multi-burn-rate alerting
- Datadog SLO Documentation — Burn Rate Alerts
- Grafana SLO Plugin Architecture
- ADR-008: Native Observability Subsystem
