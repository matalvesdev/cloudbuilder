package com.cloudbuilder.aiops.domain.service;

import com.cloudbuilder.aiops.domain.service.llm.LlmClient;
import com.cloudbuilder.observability.application.dto.MetricQueryRequest;
import com.cloudbuilder.observability.application.dto.MetricQueryResult;
import com.cloudbuilder.observability.domain.service.MetricsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MetricsAnomalyServiceTest {

    @Mock
    private MetricsService metricsService;

    @Mock
    private LlmClient llmClient;

    private MetricsAnomalyService service;

    @BeforeEach
    void setUp() {
        service = new MetricsAnomalyService(metricsService, llmClient);
    }

    @Test
    void analyzeMetric_WithDataPoints_ShouldReturnAnalysis() {
        // Arrange: simulate 10 metric data points with some variation
        var now = Instant.now();
        var dataPoints = List.of(
            new MetricQueryResult(now.minusSeconds(500), 45.0, Map.of()),
            new MetricQueryResult(now.minusSeconds(400), 48.0, Map.of()),
            new MetricQueryResult(now.minusSeconds(300), 52.0, Map.of()),
            new MetricQueryResult(now.minusSeconds(200), 47.0, Map.of()),
            new MetricQueryResult(now.minusSeconds(100), 50.0, Map.of()),
            new MetricQueryResult(now, 49.0, Map.of())
        );

        when(metricsService.query(any(MetricQueryRequest.class))).thenReturn(dataPoints);
        when(llmClient.analyzeMetric(eq("cpu_utilization"), anyList(), anyDouble()))
            .thenReturn("CPU estável com média de 49.8%. Nenhuma anomalia detectada.");

        // Act
        var result = service.analyzeMetric("tenant-1", "cpu_utilization", 60, 80.0);

        // Assert
        assertNotNull(result);
        assertEquals("cpu_utilization", result.metricName());
        assertEquals(60, result.windowMinutes());
        assertEquals(80.0, result.threshold());
        assertNotNull(result.status());
        assertTrue(result.mean() > 0);
        assertNotNull(result.analysis());
        assertNotNull(result.recommendations());
        verify(metricsService).query(any(MetricQueryRequest.class));
        verify(llmClient).analyzeMetric(eq("cpu_utilization"), anyList(), eq(80.0));
    }

    @Test
    void analyzeMetric_WithNoData_ShouldReturnNoDataStatus() {
        when(metricsService.query(any(MetricQueryRequest.class))).thenReturn(List.of());

        var result = service.analyzeMetric("tenant-1", "cpu_utilization", 60, 80.0);

        assertEquals("NO_DATA", result.status());
        assertEquals(0.0, result.mean());
        assertTrue(result.analysis().contains("Sem dados"));
    }

    @Test
    void analyzeMetric_WithThresholdBreach_ShouldDetectAnomaly() {
        var now = Instant.now();
        // All values above threshold of 30
        var dataPoints = List.of(
            new MetricQueryResult(now.minusSeconds(500), 85.0, Map.of()),
            new MetricQueryResult(now.minusSeconds(400), 88.0, Map.of()),
            new MetricQueryResult(now.minusSeconds(300), 90.0, Map.of()),
            new MetricQueryResult(now.minusSeconds(200), 87.0, Map.of()),
            new MetricQueryResult(now.minusSeconds(100), 92.0, Map.of()),
            new MetricQueryResult(now, 95.0, Map.of())
        );

        when(metricsService.query(any(MetricQueryRequest.class))).thenReturn(dataPoints);
        when(llmClient.analyzeMetric(anyString(), anyList(), anyDouble()))
            .thenReturn("Anomalia detectada: valores muito acima do threshold.");

        var result = service.analyzeMetric("tenant-1", "cpu_utilization", 60, 30.0);

        assertEquals("THRESHOLD_BREACH", result.status());
    }

    @Test
    void analyzeMultipleMetrics_ShouldReturnResultsForEachMetric() {
        var now = Instant.now();
        var dataPoints = List.of(
            new MetricQueryResult(now, 50.0, Map.of())
        );

        when(metricsService.query(any(MetricQueryRequest.class))).thenReturn(dataPoints);
        when(llmClient.analyzeMetric(anyString(), anyList(), anyDouble()))
            .thenReturn("Análise OK.");

        var configs = List.of(
            new MetricsAnomalyService.MetricConfig("cpu", 80.0),
            new MetricsAnomalyService.MetricConfig("memory", 90.0)
        );

        var results = service.analyzeMultipleMetrics("tenant-1", configs, 60);

        assertEquals(2, results.size());
        assertEquals("cpu", results.get(0).metricName());
        assertEquals("memory", results.get(1).metricName());
    }

    @Test
    void analyzeMetric_ShouldComputeStatistics() {
        var now = Instant.now();
        var dataPoints = List.of(
            new MetricQueryResult(now.minusSeconds(300), 10.0, Map.of()),
            new MetricQueryResult(now.minusSeconds(200), 20.0, Map.of()),
            new MetricQueryResult(now.minusSeconds(100), 30.0, Map.of()),
            new MetricQueryResult(now, 40.0, Map.of())
        );

        when(metricsService.query(any(MetricQueryRequest.class))).thenReturn(dataPoints);
        when(llmClient.analyzeMetric(anyString(), anyList(), anyDouble()))
            .thenReturn("OK");

        var result = service.analyzeMetric("tenant-1", "test_metric", 60, 100.0);

        // Mean should be (10+20+30+40)/4 = 25.0
        assertEquals(25.0, result.mean(), 0.1);
        // Max should be 40.0
        // Trend should be positive (increasing)
        assertTrue(result.trend() > 0, "Trend should be positive for increasing values");
    }
}
