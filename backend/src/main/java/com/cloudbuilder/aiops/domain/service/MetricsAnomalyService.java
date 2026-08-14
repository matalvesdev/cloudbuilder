package com.cloudbuilder.aiops.domain.service;

import com.cloudbuilder.aiops.domain.service.llm.LlmClient;
import com.cloudbuilder.observability.application.dto.MetricQueryRequest;
import com.cloudbuilder.observability.application.dto.MetricQueryResult;
import com.cloudbuilder.observability.domain.service.MetricsService;
import java.util.ArrayList;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * LLM-powered anomaly detection for infrastructure metrics.
 *
 * Queries recent metrics from the Observability module, computes statistical
 * indicators (mean, stddev, trend), and delegates to the LLM for pattern
 * analysis and anomaly classification.
 *
 * Sprint 15 — AI Assistant: Anomaly detection from metrics.
 */
@Service
@Transactional(readOnly = true)
public class MetricsAnomalyService {

    private static final Logger log = LoggerFactory.getLogger(MetricsAnomalyService.class);

    private final MetricsService metricsService;
    private final LlmClient llmClient;

    public MetricsAnomalyService(MetricsService metricsService, LlmClient llmClient) {
        this.metricsService = metricsService;
        this.llmClient = llmClient;
    }

    /**
     * Analyze a metric for anomalies over a time window.
     *
     * @param tenantId    Tenant scope
     * @param metricName  Metric to analyze (e.g. "cpu_utilization")
     * @param windowMinutes  Lookback window in minutes (default 60)
     * @param threshold   Configured threshold for this metric
     * @return Analysis result with anomaly detection and recommendations
     */
    public MetricAnomalyResult analyzeMetric(String tenantId, String metricName,
                                              int windowMinutes, double threshold) {
        Instant end = Instant.now();
        Instant start = end.minusSeconds(windowMinutes * 60L);

        // Query recent metric data points
        var query = new MetricQueryRequest(metricName, tenantId, start, end, "AVG", new ArrayList<>());
        List<MetricQueryResult> dataPoints = metricsService.query(query);

        if (dataPoints.isEmpty()) {
            return new MetricAnomalyResult(
                metricName, windowMinutes, threshold,
                "NO_DATA", 0.0, 0.0, 0.0,
                "Sem dados disponíveis para a métrica '" + metricName + "' no período de " + windowMinutes + " minutos.",
                List.of()
            );
        }

        // Extract values for statistical analysis
        List<Double> values = dataPoints.stream()
            .map(MetricQueryResult::value)
            .toList();

        // Compute statistical indicators
        double mean = values.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
        double max = values.stream().mapToDouble(Double::doubleValue).max().orElse(0.0);
        double min = values.stream().mapToDouble(Double::doubleValue).min().orElse(0.0);
        double stddev = computeStdDev(values, mean);
        double latestValue = values.get(values.size() - 1);

        // Compute trend (simple linear regression slope)
        double trend = computeTrend(values);

        // Build context for LLM analysis
        Map<String, Object> context = new LinkedHashMap<>();
        context.put("metricName", metricName);
        context.put("threshold", threshold);
        context.put("dataPoints", values.size());
        context.put("windowMinutes", windowMinutes);
        context.put("statistics", Map.of(
            "mean", round(mean),
            "max", round(max),
            "min", round(min),
            "stddev", round(stddev),
            "latest", round(latestValue),
            "trend", round(trend)
        ));
        context.put("recentValues", values.stream()
            .map(v -> round(v))
            .collect(Collectors.toList()));

        // Determine preliminary anomaly status
        String preliminaryStatus;
        if (latestValue > threshold) {
            preliminaryStatus = "THRESHOLD_BREACH";
        } else if (stddev > 0 && Math.abs(latestValue - mean) > 2 * stddev) {
            preliminaryStatus = "STATISTICAL_OUTLIER";
        } else if (Math.abs(trend) > 5) {
            preliminaryStatus = "SIGNIFICANT_TREND";
        } else {
            preliminaryStatus = "NORMAL";
        }

        // Delegate to LLM for deep analysis
        String analysis = llmClient.analyzeMetric(metricName, values, threshold);

        // Extract recommendations from the LLM response
        List<String> recommendations = extractRecommendations(analysis);

        log.info("Metric anomaly analysis: {} status={} mean={} stddev={} trend={}",
            metricName, preliminaryStatus, round(mean), round(stddev), round(trend));

        return new MetricAnomalyResult(
            metricName, windowMinutes, threshold,
            preliminaryStatus, round(mean), round(stddev), round(trend),
            analysis, recommendations
        );
    }

    /**
     * Batch-analyze multiple metrics for anomalies.
     */
    public List<MetricAnomalyResult> analyzeMultipleMetrics(
            String tenantId, List<MetricConfig> metrics, int windowMinutes) {
        return metrics.stream()
            .map(m -> analyzeMetric(tenantId, m.name(), windowMinutes, m.threshold()))
            .toList();
    }

    private double computeStdDev(List<Double> values, double mean) {
        if (values.size() < 2) return 0.0;
        double variance = values.stream()
            .mapToDouble(v -> Math.pow(v - mean, 2))
            .sum() / (values.size() - 1);
        return Math.sqrt(variance);
    }

    /**
     * Simple linear regression slope to detect trend direction.
     * Positive = increasing, negative = decreasing.
     */
    private double computeTrend(List<Double> values) {
        if (values.size() < 2) return 0.0;
        int n = values.size();
        double sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        for (int i = 0; i < n; i++) {
            sumX += i;
            sumY += values.get(i);
            sumXY += i * values.get(i);
            sumX2 += (double) i * i;
        }
        double denominator = n * sumX2 - sumX * sumX;
        if (Math.abs(denominator) < 0.0001) return 0.0;
        return (n * sumXY - sumX * sumY) / denominator;
    }

    private List<String> extractRecommendations(String analysis) {
        if (analysis == null || analysis.isBlank()) return List.of();
        // Extract bullet points or numbered recommendations
        return java.util.Arrays.stream(analysis.split("\n"))
            .map(String::trim)
            .filter(line -> line.startsWith("- ") || line.startsWith("* ") || line.startsWith("• ")
                || line.matches("^\\d+\\..*"))
            .map(line -> line.replaceFirst("^[-*•]\\s*", "").replaceFirst("^\\d+\\.\\s*", ""))
            .filter(s -> !s.isBlank())
            .limit(5)
            .toList();
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    // ─── DTOs ──────────────────────────────────────────────────────────

    public record MetricConfig(String name, double threshold) {}

    public record MetricAnomalyResult(
        String metricName,
        int windowMinutes,
        double threshold,
        String status,
        double mean,
        double stddev,
        double trend,
        String analysis,
        List<String> recommendations
    ) {}
}
