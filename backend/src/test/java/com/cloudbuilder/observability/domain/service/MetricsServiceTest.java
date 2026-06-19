package com.cloudbuilder.observability.domain.service;

import com.cloudbuilder.observability.application.dto.MetricQueryRequest;
import com.cloudbuilder.observability.domain.model.MetricsTsEntity;
import com.cloudbuilder.observability.domain.port.MetricsTsRepository;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MetricsServiceTest {

    @Mock
    private MetricsTsRepository repository;

    @Mock
    private MeterRegistry meterRegistry;

    @Mock
    private Counter counter;

    private MetricsService metricsService;

    @BeforeEach
    void setUp() {
        lenient().when(meterRegistry.counter(anyString(), anyString(), anyString())).thenReturn(counter);
        metricsService = new MetricsService(repository, meterRegistry);
    }

    @Test
    void record_ShouldSaveEntityAndIncrementCounter() {
        when(repository.save(any(MetricsTsEntity.class))).thenAnswer(i -> i.getArgument(0));

        metricsService.record("cpu.usage", 75.5, "t1", Map.of("host", "web-1"));

        verify(repository).save(any(MetricsTsEntity.class));
        verify(meterRegistry).counter("cpu.usage.total", "tenant", "t1");
    }

    @Test
    void record_WithoutTags_ShouldSaveWithEmptyJson() {
        when(repository.save(any(MetricsTsEntity.class))).thenAnswer(i -> i.getArgument(0));

        metricsService.record("memory.usage", 60.0, "t1");

        verify(repository).save(any(MetricsTsEntity.class));
    }

    @Test
    void query_ShouldReturnResults() {
        var now = Instant.now();
        var req = new MetricQueryRequest("cpu.usage", "t1", now.minusSeconds(3600), now, "AVG", List.of());
        var entity = new MetricsTsEntity("t1", "cpu.usage", "{}", 80.0, now);
        when(repository.findByTenantIdAndMetricNameAndTimeRange("t1", "cpu.usage",
                req.startTime(), req.endTime())).thenReturn(List.of(entity));

        var result = metricsService.query(req);

        assertEquals(1, result.size());
        assertEquals(80.0, result.getFirst().value());
    }

    @Test
    void getAggregation_DefaultAvg_ShouldReturnValue() {
        when(repository.averageValue(eq("t1"), eq("cpu.usage"), any(), any())).thenReturn(75.0);

        var result = metricsService.getAggregation("cpu.usage", "t1", Instant.now().minusSeconds(60), Instant.now(), null);

        assertEquals(75.0, result);
    }

    @Test
    void getAggregation_Sum_ShouldReturnValue() {
        when(repository.sumValue(eq("t1"), eq("cpu.usage"), any(), any())).thenReturn(500.0);

        var result = metricsService.getAggregation("cpu.usage", "t1", Instant.now().minusSeconds(3600), Instant.now(), "SUM");

        assertEquals(500.0, result);
    }

    @Test
    void getAggregation_WhenNull_ShouldReturnZero() {
        when(repository.averageValue(eq("t1"), eq("cpu.usage"), any(), any())).thenReturn(null);

        var result = metricsService.getAggregation("cpu.usage", "t1", Instant.now().minusSeconds(60), Instant.now(), "AVG");

        assertEquals(0.0, result);
    }

    @Test
    void getAggregation_P50_ShouldReturnPercentile() {
        when(repository.percentile(eq("t1"), eq("cpu.usage"), any(), any(), eq(0.5))).thenReturn(50.0);

        var result = metricsService.getAggregation("cpu.usage", "t1", Instant.now().minusSeconds(3600), Instant.now(), "P50");

        assertEquals(50.0, result);
    }

    @Test
    void getAggregation_P95_ShouldReturnPercentile() {
        when(repository.percentile(eq("t1"), eq("cpu.usage"), any(), any(), eq(0.95))).thenReturn(95.0);

        var result = metricsService.getAggregation("cpu.usage", "t1", Instant.now().minusSeconds(3600), Instant.now(), "P95");

        assertEquals(95.0, result);
    }

    @Test
    void deleteOlderThan_ShouldCallRepository() {
        var cutoff = Instant.now().minus(30, ChronoUnit.DAYS);
        metricsService.deleteOlderThan(cutoff);
        verify(repository).deleteByTimestampBefore(cutoff);
    }
}
