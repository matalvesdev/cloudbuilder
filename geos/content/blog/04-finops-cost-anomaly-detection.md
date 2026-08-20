# FinOps Integrado: Como Detectar Anomalias de Custo Automaticamente no GCP

**Autor**: CloudBuilder Team | **Leitura**: 8 min | **Categoria**: FinOps

---

## O problema

Uma fatura do GCP chega com R$ 45.000. Mês anterior: R$ 30.000. Aumento de 50%. Ninguém sabe por quê.

Você abre o Console do GCP, filtra por projeto, serviço, região... e gasta 2 horas tentando descobrir que um desenvolvedor provisionou 5 instâncias `n2-standard-8` para testes e esqueceu de deletar.

**FinOps não é sobre ver custos. É sobre detectar problemas antes que explodam.**

## O que o CloudBuilder faz diferente

A maioria das ferramentas FinOps mostra dashboards de custo. O CloudBuilder **detecta anomalias automaticamente** usando detecção estatística em tempo real.

### Arquitetura

```
Cloud Billing Export (GCP)
    ↓
Metrics Service (Java)
    ↓
Anomaly Detection Engine
    ↓
┌──────────────────┬──────────────────┐
│  Normal          │  Anomaly detected │
│  → Dashboard     │  → Alert + Action │
└──────────────────┴──────────────────┘
```

## Como funciona a detecção de anomalias

### 1. Coleta de métricas

O CloudBuilder coleta métricas de custo por serviço, região e projeto:

```java
// MetricsService.java
public void recordCostMetric(String tenantId,
                              String serviceName,
                              double value,
                              Instant timestamp) {
    MetricsTsEntity entity = new MetricsTsEntity(
        tenantId,
        "cost." + serviceName,  // ex: "cost.compute.googleapis.com"
        "{\"provider\":\"gcp\",\"region\":\"us-central1\"}",
        value,
        timestamp
    );
    metricsTsRepository.save(entity);
}
```

### 2. Cálculo de moving average

A detecção usa média móvel de 7 dias:

```java
private double calculateMovingAverage(String metricName, int windowDays) {
    Instant since = Instant.now().minus(Duration.ofDays(windowDays));
    List<MetricsTsEntity> recent = metricsTsRepository
        .findByMetricNameAndTimestampAfter(metricName, since);

    return recent.stream()
        .mapToDouble(MetricsTsEntity::getValue)
        .average()
        .orElse(0.0);
}
```

### 3. Cálculo de desvio padrão

```java
private double calculateStdDev(String metricName, int windowDays) {
    double avg = calculateMovingAverage(metricName, windowDays);
    List<MetricsTsEntity> recent = metricsTsRepository
        .findByMetricNameAndTimestampAfter(metricName,
            Instant.now().minus(Duration.ofDays(windowDays)));

    double variance = recent.stream()
        .mapToDouble(e -> Math.pow(e.getValue() - avg, 2))
        .average()
        .orElse(0.0);

    return Math.sqrt(variance);
}
```

### 4. Detecção de anomalia (2σ)

```java
public boolean detectAnomaly(String metricName, double currentValue) {
    double movingAvg = calculateMovingAverage(metricName, 7);
    double stdDev = calculateStdDev(metricName, 7);
    double threshold = movingAvg + (2 * stdDev);  // 2 desvios padrão

    if (currentValue > threshold) {
        createAnomalyAlert(metricName, currentValue, threshold);
        return true;
    }
    return false;
}
```

### Por que 2σ?

| Limiar | Sensibilidade | Falso positivo |
|--------|---------------|----------------|
| 1σ | Alta | ~32% das leituras |
| **2σ** | **Equilibrada** | **~5% das leituras** |
| 3σ | Baixa | ~0.3% das leituras |

2σ é o sweet spot: detecta problemas reais sem spam de alertas.

## Exemplo prático

### Cenário normal

```
Dia 1: R$ 1.000 (compute)
Dia 2: R$ 1.050
Dia 3: R$ 980
Dia 4: R$ 1.020
Dia 5: R$ 1.100
Dia 6: R$ 950
Dia 7: R$ 1.000

Média: R$ 1.014
Desvio: R$ 48
Threshold (2σ): R$ 1.110
```

### Anomalia detectada

```
Dia 8: R$ 2.500  ← ANOMALIA!
```

**Motivo:** R$ 2.500 > R$ 1.110 (threshold) → Alerta criado automaticamente.

### O que acontece

```
1. Anomaly detected: cost.compute.googleapis.com
   - Valor atual: R$ 2.500
   - Threshold: R$ 1.110
   - Desvio: 3.1σ

2. Alerta criado no CloudBuilder
   - Severidade: HIGH
   - Descrição: "Compute cost 147% above 7-day average"
   - Ação sugerida: "Review recent resource provisioning"

3. Usuário notificado via:
   - Dashboard (in-app)
   - Webhook (Slack/Teams)
   - Email (se configurado)
```

## Alert Rules configuráveis

O usuário pode criar regras customizadas:

```bash
# Criar regra de alerta via API
curl -X POST http://localhost:8080/api/v1/observability/alert-rules \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "GCP Cost Spike",
    "metricName": "cost.compute.googleapis.com",
    "condition": "GT",
    "threshold": 1.5,
    "durationSec": 300,
    "severity": "HIGH",
    "enabled": true
  }'
```

### Condições suportadas

| Condição | Descrição | Exemplo |
|----------|-----------|---------|
| `GT` | Maior que | Custo > R$ 1.500 |
| `LT` | Menor que | Utilização < 20% |
| `GTE` | Maior ou igual | Instâncias >= 10 |
| `LTE` | Menor ou igual | Latência <= 100ms |
| `EQ` | Igual a | Status = "ERROR" |
| `NE` | Diferente de | Status != "HEALTHY" |

## Dashboard em tempo real

O CloudBuilder mostra métricas de custo em dashboard:

```
┌─────────────────────────────────────────┐
│  Custo Total — Últimos 30 dias          │
│  ┌─────────────────────────────────┐    │
│  │  📈 R$ 45.230 (+50% vs mês     │    │
│  │     anterior)                    │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Por Serviço:                           │
│  Compute:    R$ 28.000 (62%)  ⚠️ ANOMALIA │
│  Storage:    R$  8.500 (19%)           │
│  Networking: R$  5.230 (12%)           │
│  SQL:        R$  3.500 (7%)            │
│                                         │
│  Anomalias Detectadas: 1               │
│  ┌─────────────────────────────────┐    │
│  │  ⚠️ Compute cost 147% above avg │    │
│  │  Detectado: 2026-08-14 10:30    │    │
│  │  Valor: R$ 2.500 (avg: R$ 1.014)│    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

## Integração com Canvas

A parte poderosa é que o custo está **ligado ao canvas**:

```
Canvas Design (4 recursos)
    ↓
CodeGeneratorService
    ↓
Cost Estimation per resource
    ↓
┌──────────────────────────────────────┐
│  🖥️ web-server (e2-medium)           │
│  💰 ~R$ 120/mês                      │
├──────────────────────────────────────┤
│  🗄️ app-db (db-f1-micro)            │
│  💰 ~R$ 95/mês                       │
├──────────────────────────────────────┤
│  🌐 main-vpc (networking)            │
│  💰 ~R$ 0/mês (sem custo fixo)       │
├──────────────────────────────────────┤
│  📍 main-subnet (networking)         │
│  💰 ~R$ 0/mês (sem custo fixo)       │
└──────────────────────────────────────┘
  Total estimado: ~R$ 215/mês
```

O desenvolvedor vê o custo **antes de provisionar**. Não depois.

## Métricas de FinOps

| Métrica | O que mede | Target |
|---------|-----------|--------|
| Anomalias detectadas/mês | Cobertura de detecção | > 95% |
| Falsos positivos | Precisão | < 5% |
| Tempo de detecção | Latência da anomalia | < 5 min |
| Custo economizado | Impacto financeiro | > 20%/mês |
| Budget overrun | Orçamento estourado | 0/mês |

## Conclusão

FinOps não é sobre dashboards bonitos. É sobre **detectar problemas antes que custem dinheiro**.

O CloudBuilder implementa detecção de anomalias com estatística simples (moving average + 2σ), integrada ao canvas (custo visível antes de provisionar), e automatizada (alertas sem intervenção manual).

Simples. Eficaz. Automatizado.

**Quer experimentar?** [cloudbuilder.io](https://cloudbuilder.io)

---

## Tags

`#FinOps` `#CostOptimization` `#GCP` `#AnomalyDetection` `#CloudCost` `#Observability` `#Metrics` `#PlatformEngineering`
