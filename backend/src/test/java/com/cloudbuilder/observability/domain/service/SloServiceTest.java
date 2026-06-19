package com.cloudbuilder.observability.domain.service;

import com.cloudbuilder.observability.domain.model.SloDefinitionEntity;
import com.cloudbuilder.observability.domain.model.SloSnapshotEntity;
import com.cloudbuilder.observability.domain.port.SloDefinitionRepository;
import com.cloudbuilder.observability.domain.port.SloSnapshotRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SloServiceTest {

    @Mock
    private SloDefinitionRepository definitionRepository;

    @Mock
    private SloSnapshotRepository snapshotRepository;

    @Mock
    private MetricsService metricsService;

    private SloService sloService;

    @BeforeEach
    void setUp() {
        sloService = new SloService(definitionRepository, snapshotRepository, metricsService);
    }

    private SloDefinitionEntity createSlo(String id, String name, double targetPct, int windowDays) {
        var slo = new SloDefinitionEntity();
        slo.setId(id);
        slo.setTenantId("t1");
        slo.setName(name);
        slo.setSliType("availability");
        slo.setMetricName("http.requests");
        slo.setTargetPct(targetPct);
        slo.setWindowDays(windowDays);
        slo.setEnabled(true);
        return slo;
    }

    @Test
    void computeAllSloSnapshots_WithNoDefinitions_ShouldDoNothing() {
        when(definitionRepository.findAll()).thenReturn(List.of());

        sloService.computeAllSloSnapshots();

        verifyNoInteractions(metricsService);
    }

    @Test
    void computeAllSloSnapshots_ShouldComputeAndSave() {
        var slo = createSlo(UUID.randomUUID().toString(), "API Availability", 99.9, 30);
        when(definitionRepository.findAll()).thenReturn(List.of(slo));
        when(metricsService.getAggregation(eq("http.requests.count"), eq("t1"), any(), any(), eq("SUM")))
                .thenReturn(1000.0);
        when(metricsService.getAggregation(eq("http.requests.error"), eq("t1"), any(), any(), eq("SUM")))
                .thenReturn(5.0);
        when(snapshotRepository.save(any(SloSnapshotEntity.class))).thenAnswer(i -> i.getArgument(0));

        sloService.computeAllSloSnapshots();

        verify(snapshotRepository).save(any(SloSnapshotEntity.class));
    }

    @Test
    void computeAllSloSnapshots_WhenMetricFails_ShouldSkip() {
        var slo = createSlo(UUID.randomUUID().toString(), "API Availability", 99.9, 30);
        when(definitionRepository.findAll()).thenReturn(List.of(slo));
        when(metricsService.getAggregation(anyString(), anyString(), any(), any(), anyString()))
                .thenThrow(new RuntimeException("DB error"));

        sloService.computeAllSloSnapshots();

        verify(snapshotRepository, never()).save(any());
    }

    @Test
    void computeAllSloSnapshots_WithZeroTotal_ShouldReturn100Percent() {
        var slo = createSlo(UUID.randomUUID().toString(), "API Availability", 99.9, 30);
        when(definitionRepository.findAll()).thenReturn(List.of(slo));
        when(metricsService.getAggregation(eq("http.requests.count"), eq("t1"), any(), any(), eq("SUM")))
                .thenReturn(0.0);
        when(metricsService.getAggregation(eq("http.requests.error"), eq("t1"), any(), any(), eq("SUM")))
                .thenReturn(0.0);
        when(snapshotRepository.save(any(SloSnapshotEntity.class))).thenAnswer(i -> i.getArgument(0));

        sloService.computeAllSloSnapshots();

        verify(snapshotRepository).save(argThat(s -> s.getSliPct() == 100.0));
    }

    @Test
    void getSloStatus_ShouldReturnStatusWithLatestSnapshot() {
        var slo = createSlo(UUID.randomUUID().toString(), "API Availability", 99.5, 30);
        when(definitionRepository.findByTenantId("t1")).thenReturn(List.of(slo));

        var snapshot = new SloSnapshotEntity();
        snapshot.setSloId(slo.getId());
        snapshot.setTenantId("t1");
        snapshot.setWindowStart(Instant.now().minus(30, ChronoUnit.DAYS));
        snapshot.setWindowEnd(Instant.now());
        snapshot.setGoodCount(995L);
        snapshot.setTotalCount(1000L);
        snapshot.setSliPct(99.5);
        snapshot.setErrorBudgetPct(100.0);
        snapshot.setComputedAt(Instant.now());

        when(snapshotRepository.findAll()).thenReturn(List.of(snapshot));

        var results = sloService.getSloStatus("t1");

        assertEquals(1, results.size());
        var result = results.getFirst();
        assertEquals("API Availability", result.name());
        assertEquals(99.5, result.currentSliPct());
        assertEquals("WITHIN", result.status());
    }

    @Test
    void getSloStatus_WhenBreached_ShouldReturnBreachedStatus() {
        var slo = createSlo(UUID.randomUUID().toString(), "API Availability", 99.5, 30);
        when(definitionRepository.findByTenantId("t1")).thenReturn(List.of(slo));

        var snapshot = new SloSnapshotEntity();
        snapshot.setSloId(slo.getId());
        snapshot.setTenantId("t1");
        snapshot.setSliPct(95.0);
        snapshot.setErrorBudgetPct(60.0);
        snapshot.setComputedAt(Instant.now());

        when(snapshotRepository.findAll()).thenReturn(List.of(snapshot));

        var results = sloService.getSloStatus("t1");

        assertEquals("BREACHED", results.getFirst().status());
    }

    @Test
    void getSloStatus_WithNoSnapshots_ShouldReturnDefaultValues() {
        var slo = createSlo(UUID.randomUUID().toString(), "API Availability", 99.5, 30);
        when(definitionRepository.findByTenantId("t1")).thenReturn(List.of(slo));
        when(snapshotRepository.findAll()).thenReturn(List.of());

        var results = sloService.getSloStatus("t1");

        assertEquals(1, results.size());
        assertEquals(100.0, results.getFirst().currentSliPct());
        assertEquals(100.0, results.getFirst().errorBudgetPct());
        assertEquals("WITHIN", results.getFirst().status());
    }

    @Test
    void createSlo_ShouldSaveAndReturn() {
        var slo = createSlo(UUID.randomUUID().toString(), "Test SLO", 99.9, 30);
        when(definitionRepository.save(any(SloDefinitionEntity.class))).thenReturn(slo);

        var result = sloService.createSlo(slo);

        assertNotNull(result);
        assertEquals("Test SLO", result.getName());
        verify(definitionRepository).save(slo);
    }
}
