package com.cloudbuilder.observability.domain.service;

import com.cloudbuilder.observability.application.dto.MetricQueryRequest;
import com.cloudbuilder.observability.application.dto.MetricQueryResult;
import com.cloudbuilder.observability.domain.model.MetricsTsEntity;
import com.cloudbuilder.observability.domain.port.MetricsTsRepository;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Real metrics service that persists to PostgreSQL.
 * Maintains dual-write to Micrometer during migration period.
 */
@Service("observabilityMetricsService")
public class MetricsService {

    private final MetricsTsRepository repository;
    private final MeterRegistry meterRegistry;

    public MetricsService(MetricsTsRepository repository, MeterRegistry meterRegistry) {
        this.repository = repository;
        this.meterRegistry = meterRegistry;
    }

    @Async
    public void record(String metricName, double value, String tenantId, Map<String, String> tags) {
        String tagsJson = tags != null && !tags.isEmpty() ? toJson(tags) : "{}";
        MetricsTsEntity entity = new MetricsTsEntity(tenantId, metricName, tagsJson, value, Instant.now());
        repository.save(entity);

        // Dual-write to Micrometer for backward compatibility
        meterRegistry.counter(metricName + ".total", "tenant", tenantId).increment();
    }

    @Async
    public void record(String metricName, double value, String tenantId) {
        record(metricName, value, tenantId, Map.of());
    }

    public List<MetricQueryResult> query(MetricQueryRequest req) {
        List<MetricsTsEntity> entities = repository.findByTenantIdAndMetricNameAndTimeRange(
            req.tenantId(), req.metricName(), req.startTime(), req.endTime());

        return entities.stream()
            .map(e -> new MetricQueryResult(e.getTimestamp(), e.getValue(), Map.of()))
            .collect(Collectors.toList());
    }

    public double getAggregation(String metricName, String tenantId, Instant start, Instant end, String aggregation) {
        return switch (aggregation != null ? aggregation.toUpperCase() : "AVG") {
            case "SUM" -> {
                Double val = repository.sumValue(tenantId, metricName, start, end);
                yield val != null ? val : 0.0;
            }
            case "P50" -> {
                Double val = repository.percentile(tenantId, metricName, start, end, 0.5);
                yield val != null ? val : 0.0;
            }
            case "P95" -> {
                Double val = repository.percentile(tenantId, metricName, start, end, 0.95);
                yield val != null ? val : 0.0;
            }
            case "P99" -> {
                Double val = repository.percentile(tenantId, metricName, start, end, 0.99);
                yield val != null ? val : 0.0;
            }
            default -> {
                Double val = repository.averageValue(tenantId, metricName, start, end);
                yield val != null ? val : 0.0;
            }
        };
    }

    public void deleteOlderThan(Instant cutoff) {
        repository.deleteByTimestampBefore(cutoff);
    }

    private String toJson(Map<String, String> map) {
        return map.entrySet().stream()
            .map(e -> "\"" + escapeJson(e.getKey()) + "\":\"" + escapeJson(e.getValue()) + "\"")
            .collect(Collectors.joining(",", "{", "}"));
    }

    private String escapeJson(String s) {
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n");
    }
}
