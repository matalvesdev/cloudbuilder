# ADR-SRE-003: Incident Management with Runbook Automation

## Status
Proposto — 2026-06-24

## Contexto

O CloudBuilder possui sistema basico de incidentes (IncidentsView.tsx) com status OPEN/ACKNOWLEDGED/RESOLVED.
Nao possui runbook automation, auto-remediation, post-mortem tracking, ou escalation policies.

### Problema
1. Incidentes sao manuais — sem runbooks automatizados
2. Sem auto-remediation, todo incidente requer intervencao humana
3. Sem post-mortem tracking, lessons learned nao sao capturadas
4. Sem escalation policies, incidentes podem ficar sem dono

## Decisao

Implementar Incident Management framework com 4 componentes:
1. Incident Lifecycle estendido
2. Runbook Automation Engine
3. Post-mortem Tracking
4. Escalation Policies

### 1. Incident Lifecycle Estendido

| Stage | Status | TTL | Descricao |
|-------|--------|-----|-----------|
| 1. Triggered | TRIGGERED | - | Alert rule breached |
| 2. Ack | ACKNOWLEDGED | 15min | Engineer assigned |
| 3. Diagnosing | DIAGNOSING | 30min | Runbook execution |
| 4. Resolving | RESOLVING | - | Fix applied |
| 5. Resolved | RESOLVED | - | All clear |
| 6. Post-mortem | POSTMORTEM | 72h | Root cause + items |

### 2. Runbook Automation Engine

Runbook steps suportados:
- ssh: comando remoto em instancia
- webhook: chamada HTTP para API externa
- slack: notificacao em canal
- script: execucao de script local
- rollback: acao de reversao

### 3. Post-mortem Tracking

Schema de postmortems:
- incident_id, title, summary, root_cause
- timeline (JSON): eventos do incidente
- action_items (JSON): acoes corretivas
- severity, is_private

### 4. Escalation Policies

Level 1 (5min ack) -> Level 2 (10min) -> Level 3 (15min)
Targets: user, team, schedule
Notifications: email, slack, webhook

## Alternativas Consideradas

A - Status Quo: incidentes manuais sem automacao (rejeitada)
B - Runbooks only: sem post-mortem tracking (rejeitada)
C - Framework completo: lifecycle + runbook + post-mortem + escalation (escolhida)

## Consequencias

Positivas:
- Runbooks aceleram resolucao de incidentes (~60% mais rapido)
- Post-mortems capturam lessons learned
- Escalation policies garantem coverage 24/7

Negativas:
- Complexidade de implementacao (runbook executor)
- Risco de runbook causar danos adicionais se mal configurado
- Post-mortem requer disciplina do time

## Referencias
- PagerDuty Runbook Automation
- PagerDuty Incident Response
- Google SRE Book Chapter 5: Eliminating Toil
- ADR-008: Native Observability
- ADR-SRE-001: Burn Rate Alerting
