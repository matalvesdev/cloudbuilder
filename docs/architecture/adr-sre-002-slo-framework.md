# ADR-SRE-002: SLO Framework with Error Budget Policy

## Status
Proposto — 2026-06-24

## Contexto

O CloudBuilder possui um sistema basico de SLO (SloDashboard.tsx, tabela slo_definitions) que calcula SLI e error budget,
mas nao possui um framework completo de SLO lifecycle, error budget enforcement, ou faceting por dimensao.
A experiencia do Google SRE Book, Datadog e Dynatrace mostra que SLOs precisam de governanca ativa,
nao apenas visualizacao passiva.

### Problema
1. Sem error budget policy, o budget e apenas informativo — nao impede acoes que consomem mais budget
2. Sem faceting por dimensao, nao e possivel identificar qual componente (regiao, servico, tenant) esta degradando o SLO
3. O schema atual nao suporta composite SLOs ou SLOs hierarquicos (ex: SLO de servico agregando SLOs de endpoint)
4. Sem SLO lifecycle, nao ha distincao entre SLOs em draft, ativos, ou aposentados

## Decisao

Implementar um framework completo de SLO com 3 componentes principais: SLO Lifecycle, Error Budget Policy e Faceting.

### 1. SLO Lifecycle

| Estado | Descricao | Acoes Permitidas |
|--------|-----------|------------------|
| DRAFT | SLO sendo configurado | Editar, ativar |
| ACTIVE | SLO em producao, tracking ativo | Visualizar, alertar |
| AT_RISK | Error budget abaixo de 50% | Alertas intensificados, revisao |
| BREACHED | SLO violado (error budget exaurido) | Incidente automatico, bloqueios |
| RETIRED | SLO desativado, apenas historico | Arquivo, consulta |

### 2. Error Budget Policy

4 estados de budget com acoes progressivas:

| Estado | Budget | Efeito | Cor |
|--------|--------|--------|-----|
| NORMAL | > 50% | Deploys liberados, features normais | Verde |
| WARNING | 20-50% | Congelar deploys de risco, alertas P2 | Amarelo |
| CRITICAL | < 20% | Congelar deploys, bloquear features novas | Laranja |
| EXHAUSTED | 0% | Bloquear deploys, bloquear features, page on-call | Vermelho |

Enforcement Levels (configuravel por SLO):
| Modo | Efeito | Uso |
|------|--------|-----|
| INFORMATIONAL | Apenas notificar, sem bloqueio | Default (adocao gradual) |
| WARNING | Notificar + alertas intensificados | Times maduros |
| BLOCKING | Bloquear deploys/features automaticamente | SLOs criticos |

### 3. Faceting por Dimensao

Faceting permite quebrar SLOs por dimensoes para identificar qual componente esta degradando:
- **Por servico**: SLO de API gateway desagregado por servico downstream
- **Por regiao**: SLO de latencia por regiao (us-east-1 vs eu-west-1)
- **Por tenant**: SLO por cliente (multi-tenant nativo)
- **Por endpoint**: SLO por rota especifica (ex: /api/v1/login)

### Schema de Dados

```sql
-- Extensao da tabela slo_definitions existente (ADR-008)
ALTER TABLE slo_definitions ADD COLUMN IF NOT EXISTS
  status VARCHAR(16) DEFAULT 'DRAFT';
ALTER TABLE slo_definitions ADD COLUMN IF NOT EXISTS
  enforcement_mode VARCHAR(16) DEFAULT 'INFORMATIONAL';
ALTER TABLE slo_definitions ADD COLUMN IF NOT EXISTS
  dimensions JSONB DEFAULT '[]';
ALTER TABLE slo_definitions ADD COLUMN IF NOT EXISTS
  composite_sli_config JSONB;

-- Nova tabela para dimension slices
CREATE TABLE sli_snapshot_dimensions (
    id UUID DEFAULT gen_random_uuid(),
    snapshot_id UUID NOT NULL REFERENCES sli_snapshots(id),
    tenant_id VARCHAR(64) NOT NULL,
    dimension_name VARCHAR(64) NOT NULL,
    dimension_value VARCHAR(256) NOT NULL,
    good_count BIGINT NOT NULL,
    total_count BIGINT NOT NULL,
    sli_pct DOUBLE PRECISION NOT NULL
);
CREATE INDEX idx_dimensions_snapshot ON sli_snapshot_dimensions (snapshot_id);
CREATE INDEX idx_dimensions_lookup ON sli_snapshot_dimensions (tenant_id, dimension_name, dimension_value);
```

### API REST

| Metodo | Path | Descricao |
|--------|------|-----------|
| GET | /api/v1/slos | Listar SLOs com filtros (status, tipo) |
| POST | /api/v1/slos | Criar SLO com config completa |
| PUT | /api/v1/slos/{id} | Atualizar SLO |
| DELETE | /api/v1/slos/{id} | Remover SLO |
| GET | /api/v1/slos/{id}/status | Status detalhado + error budget |
| GET | /api/v1/slos/{id}/dimensions | SLO desagregado por dimensoes |
| POST | /api/v1/slos/{id}/enforcement | Alterar modo de enforcement |
| GET | /api/v1/slos/{id}/history | Historico de SLI + budget |

### Frontend (SloDashboard.tsx extension)
- Tabela de SLOs com filtros por status, tipo, dimensao
- Error Budget gauge circular (verde/amarelo/laranja/vermelho)
- Dimensoes: toggle para ver SLO por regiao/servico/tenant
- Status badge: DRAFT/ACTIVE/AT_RISK/BREACHED/RETIRED
- Enforcement toggle: INFORMATIONAL/WARNING/BLOCKING
- Insight: qual dimensao esta consumindo mais budget

## Alternativas Consideradas

### A — Sem Enforcement (Status Quo)
- Error budget apenas informativo, sem bloqueio
- **Rejeitada** — nao previne consumo excessivo de budget

### B — Enforcement Rigido
- Bloquear deploys sempre que budget < 50%, sem excecoes
- **Rejeitada** — contraproducente em cenarios de baixo risco

### C — Enforcement Gradual por Estados (ESCOLHIDA)
- 4 estados com acoes progressivas
- Modo configuravel (informational/warning/blocking)
- Balance entre seguranca e agilidade

## Consequencias

### Positivas
- Error budget vira ferramenta de governanca, nao apenas metrica
- Faceting permite identificar causas de degradacao
- SLO lifecycle completo (do draft ao retired)
- Enforcement configuravel por SLO e por modo

### Negativas
- Complexidade adicional no schema (4 novas colunas + 1 tabela)
- Enforcement pode bloquear acoes legitimas se mal configurado
- Faceting aumenta volume de dados (N dimension slices por snapshot)

### Riscos
- Adocao: times podem rejeitar enforcement agressivo
  - Mitigacao: default INFORMATIONAL, equipe opta por WARNING/BLOCKING
- Performance: faceting gera muitas linhas
  - Mitigacao: batch insert + agregacao horaria

## Referencias
- Google SRE Book — Chapter 4: Service Level Objectives
- Datadog SLO Documentation — Error Budget
- Dynatrace SLO — Service-Level Objectives
- ADR-008: Native Observability Subsystem
- ADR-SRE-001: Multi-Window Burn Rate Alerting
