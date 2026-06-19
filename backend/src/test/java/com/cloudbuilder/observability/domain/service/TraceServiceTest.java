package com.cloudbuilder.observability.domain.service;

import com.cloudbuilder.observability.domain.model.SpanEntity;
import com.cloudbuilder.observability.domain.model.TraceEntity;
import com.cloudbuilder.observability.domain.port.SpanRepository;
import com.cloudbuilder.observability.domain.port.TraceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TraceServiceTest {

    @Mock
    private TraceRepository traceRepository;

    @Mock
    private SpanRepository spanRepository;

    private TraceService traceService;

    @BeforeEach
    void setUp() {
        traceService = new TraceService(traceRepository, spanRepository);
    }

    @Test
    void createTrace_ShouldSaveAndReturn() {
        when(traceRepository.save(any(TraceEntity.class))).thenAnswer(i -> i.getArgument(0));

        var result = traceService.createTrace("trace-1", "t1", "api-gateway",
                "GET /users", 150L, 200, false, Map.of("env", "prod"));

        assertNotNull(result);
        assertEquals("trace-1", result.traceId());
        assertEquals("api-gateway", result.serviceName());
        verify(traceRepository).save(any(TraceEntity.class));
    }

    @Test
    void createTrace_WithEmptyMetadata_ShouldSaveWithEmptyJson() {
        when(traceRepository.save(any(TraceEntity.class))).thenAnswer(i -> i.getArgument(0));

        traceService.createTrace("trace-2", "t1", "service", "op", 100L, 200, false, Map.of());

        verify(traceRepository).save(any(TraceEntity.class));
    }

    @Test
    void createTrace_WithNullMetadata_ShouldSaveWithEmptyJson() {
        when(traceRepository.save(any(TraceEntity.class))).thenAnswer(i -> i.getArgument(0));

        traceService.createTrace("trace-3", "t1", "service", "op", 100L, 200, false, null);

        verify(traceRepository).save(any(TraceEntity.class));
    }

    @Test
    void addSpan_ShouldSave() {
        when(spanRepository.save(any(SpanEntity.class))).thenAnswer(i -> i.getArgument(0));

        traceService.addSpan("trace-1", "span-1", null, "t1", "service",
                "GET", 50L, 200, "OK", Map.of("key", "val"));

        verify(spanRepository).save(any(SpanEntity.class));
    }

    @Test
    void getTraces_WithoutErrorFilter_ShouldReturnAll() {
        var now = Instant.now();
        var entity = new TraceEntity("trace-1", "t1", "svc", "GET", now, 100, 200, false, "{}");
        entity.setId(java.util.UUID.randomUUID().toString());
        when(traceRepository.findByTenantIdAndStartTimeBetweenOrderByStartTimeDesc("t1", now.minusSeconds(3600), now))
                .thenReturn(List.of(entity));
        when(spanRepository.findByTraceIdOrderByStartTimeAsc("trace-1")).thenReturn(List.of());

        var results = traceService.getTraces("t1", now.minusSeconds(3600), now, false);

        assertEquals(1, results.size());
    }

    @Test
    void getTraces_WithErrorFilter_ShouldReturnErrorTraces() {
        var now = Instant.now();
        var entity = new TraceEntity("trace-err", "t1", "svc", "GET", now, 100, 500, true, "{}");
        entity.setId(java.util.UUID.randomUUID().toString());
        when(traceRepository.findByTenantIdAndIsErrorTrueOrderByStartTimeDesc("t1"))
                .thenReturn(List.of(entity));
        when(spanRepository.findByTraceIdOrderByStartTimeAsc("trace-err")).thenReturn(List.of());

        var results = traceService.getTraces("t1", null, null, true);

        assertEquals(1, results.size());
        assertTrue(results.getFirst().isError());
    }

    @Test
    void getTraceDetail_ShouldReturnTraceWithSpans() {
        var now = Instant.now();
        var entity = new TraceEntity("trace-1", "t1", "svc", "GET", now, 100, 200, false, "{}");
        entity.setId(java.util.UUID.randomUUID().toString());
        when(traceRepository.findByTraceId("trace-1")).thenReturn(Optional.of(entity));
        when(spanRepository.findByTraceIdOrderByStartTimeAsc("trace-1"))
                .thenReturn(List.of(
                        new SpanEntity("trace-1", "span-1", null, "t1", "svc", "GET", now, 50, 200, "OK", "{}")
                ));

        var result = traceService.getTraceDetail("trace-1");

        assertEquals("trace-1", result.traceId());
        assertEquals(1, result.spans().size());
    }

    @Test
    void getTraceDetail_WhenNotFound_ShouldThrow() {
        when(traceRepository.findByTraceId("unknown")).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> traceService.getTraceDetail("unknown"));
    }
}
