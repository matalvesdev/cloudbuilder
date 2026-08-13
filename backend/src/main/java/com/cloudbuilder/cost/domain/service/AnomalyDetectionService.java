package com.cloudbuilder.cost.domain.service;

import com.cloudbuilder.cost.application.dto.CostAnomaly;
import com.cloudbuilder.cost.domain.model.CostAnomalyResult;
import com.cloudbuilder.cost.domain.model.CostRecord;
import com.cloudbuilder.cost.domain.port.CostAnomalyResultRepository;
import com.cloudbuilder.cost.domain.port.CostRecordRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class AnomalyDetectionService {

    private final CostRecordRepository costRecordRepository;
    private final CostAnomalyResultRepository costAnomalyResultRepository;

    public AnomalyDetectionService(CostRecordRepository costRecordRepository,
                                   CostAnomalyResultRepository costAnomalyResultRepository) {
        this.costRecordRepository = costRecordRepository;
        this.costAnomalyResultRepository = costAnomalyResultRepository;
    }

    /**
     * Detecta anomalias de custo por servico usando media movel de 7 dias
     * e desvio padrao das deviacoes. Persiste resultados na tabela cost_anomaly_results.
     */
    public List<CostAnomaly> detectAnomalies(String environmentId, int lookbackDays) {
        var today = LocalDate.now();
        var lookbackStart = today.minusDays(lookbackDays);
        // Busca janela extra de 7 dias para calcular a media movel
        var movingAvgStart = lookbackStart.minusDays(6);

        var records = costRecordRepository.findByEnvironmentIdAndDateBetween(
                environmentId, movingAvgStart, today);

        // Agrupa por servico e ordena por data
        var recordsByService = records.stream()
                .collect(Collectors.groupingBy(
                        CostRecord::getServiceName,
                        TreeMap::new,
                        Collectors.toCollection(ArrayList::new)
                ));

        List<CostAnomaly> anomalies = new ArrayList<>();
        List<CostAnomalyResult> persistedResults = new ArrayList<>();

        for (var entry : recordsByService.entrySet()) {
            var serviceName = entry.getKey();
            var serviceRecords = entry.getValue();
            if (serviceRecords.size() < 14) {
                continue; // dados insuficientes para anomalia
            }

            var deviations = new ArrayList<Double>();
            var anomalyCandidates = new ArrayList<CostRecord>();

            // Calcula media movel de 7 dias e desvio para cada registro
            for (int i = 6; i < serviceRecords.size(); i++) {
                double sum = 0;
                for (int j = i - 6; j <= i; j++) {
                    sum += serviceRecords.get(j).getAmount();
                }
                double movingAvg = sum / 7.0;
                var record = serviceRecords.get(i);

                // So considera registros dentro da janela de analise
                if (!record.getDate().isBefore(lookbackStart)) {
                    double deviation = (record.getAmount() - movingAvg) / movingAvg * 100;
                    deviations.add(deviation);
                    anomalyCandidates.add(record);
                }
            }

            if (deviations.size() < 2) {
                continue;
            }

            // Calcula media e desvio padrao das deviacoes
            double meanDev = deviations.stream().mapToDouble(Double::doubleValue).average().orElse(0);
            double stdDev = Math.sqrt(deviations.stream()
                    .mapToDouble(d -> Math.pow(d - meanDev, 2))
                    .sum() / (deviations.size() - 1));

            if (stdDev == 0) {
                continue;
            }

            double threshold = 1.5 * stdDev;

            // Flag registros com desvio > 1.5 * stdDev
            for (int i = 0; i < anomalyCandidates.size(); i++) {
                var record = anomalyCandidates.get(i);
                double deviation = deviations.get(i);

                if (Math.abs(deviation) > threshold) {
                    double expectedAmount = record.getAmount() / (1 + deviation / 100);
                    String severity = classifySeverity(Math.abs(deviation));

                    anomalies.add(new CostAnomaly(
                            UUID.randomUUID().toString(),
                            serviceName,
                            record.getDate(),
                            record.getAmount(),
                            Math.round(expectedAmount * 100.0) / 100.0,
                            Math.round(deviation * 100.0) / 100.0,
                            severity
                    ));

                    // Persist result
                    var result = new CostAnomalyResult(
                            environmentId, serviceName, record.getDate(),
                            record.getAmount(), Math.round(expectedAmount * 100.0) / 100.0,
                            Math.round(deviation * 100.0) / 100.0, severity);
                    persistedResults.add(result);
                }
            }
        }

        if (!persistedResults.isEmpty()) {
            costAnomalyResultRepository.saveAll(persistedResults);
        }

        anomalies.sort(Comparator.comparing(CostAnomaly::date).reversed());
        return anomalies;
    }

    /**
     * Retrieves persisted anomaly results for an environment.
     */
    @Transactional(readOnly = true)
    public List<CostAnomalyResult> getPersistedAnomalies(String environmentId) {
        return costAnomalyResultRepository.findByEnvironmentIdOrderByDetectedAtDesc(environmentId);
    }

    /**
     * Classifica severidade com base no percentual de desvio absoluto.
     * LOW: < 20%, MODERATE: 20-50%, HIGH: 50-100%, CRITICAL: >= 200%
     */
    private String classifySeverity(double absDeviationPct) {
        if (absDeviationPct >= 200) return "CRITICAL";
        if (absDeviationPct >= 100) return "HIGH";
        if (absDeviationPct >= 50) return "MODERATE";
        if (absDeviationPct >= 20) return "LOW";
        return "LOW";
    }
}
