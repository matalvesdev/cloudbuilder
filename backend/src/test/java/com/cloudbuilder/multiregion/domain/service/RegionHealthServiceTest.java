package com.cloudbuilder.multiregion.domain.service;

import com.cloudbuilder.multiregion.domain.model.RegionHealth;
import com.cloudbuilder.multiregion.domain.port.RegionHealthRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RegionHealthServiceTest {

    @Mock
    private RegionHealthRepository healthRepository;

    private RegionHealthService regionHealthService;

    @BeforeEach
    void setUp() {
        regionHealthService = new RegionHealthService(healthRepository);
    }

    @Test
    void recordHealthCheck_ShouldSaveAndReturn() {
        when(healthRepository.save(any(RegionHealth.class))).thenAnswer(i -> i.getArgument(0));

        var result = regionHealthService.recordHealthCheck("us-east-1", "HEALTHY", 15.0, 99.99, "All systems operational");

        assertNotNull(result);
        assertEquals("us-east-1", result.getRegionCode());
        assertEquals("HEALTHY", result.getStatus());
        assertEquals(15.0, result.getLatencyMs());
        assertEquals(99.99, result.getAvailabilityPercent());
        verify(healthRepository).save(any(RegionHealth.class));
    }

    @Test
    void getLatestHealth_ShouldReturn() {
        var health = new RegionHealth("us-east-1", "HEALTHY", 15.0, 99.99);
        health.setDetails("OK");
        when(healthRepository.findTopByRegionCodeOrderByCheckedAtDesc("us-east-1")).thenReturn(Optional.of(health));

        var result = regionHealthService.getLatestHealth("us-east-1");

        assertTrue(result.isPresent());
        assertEquals("HEALTHY", result.get().getStatus());
    }

    @Test
    void getHealthHistory_ShouldReturn() {
        var since = Instant.now().minus(7, ChronoUnit.DAYS);
        when(healthRepository.findByRegionCodeSince("us-east-1", since)).thenReturn(List.of());

        var result = regionHealthService.getHealthHistory("us-east-1", since);

        assertTrue(result.isEmpty());
    }

    @Test
    void getAllLatestHealth_ShouldReturn() {
        var health = new RegionHealth("us-east-1", "HEALTHY", 15.0, 99.99);
        when(healthRepository.findLatestHealthPerRegion()).thenReturn(List.of(health));

        var result = regionHealthService.getAllLatestHealth();

        assertEquals(1, result.size());
    }

    @Test
    void getUnhealthyRegions_ShouldReturn() {
        var down = new RegionHealth("us-east-1", "DOWN", 500.0, 50.0);
        when(healthRepository.findByStatus("DOWN")).thenReturn(List.of(down));

        var result = regionHealthService.getUnhealthyRegions();

        assertEquals(1, result.size());
        assertEquals("DOWN", result.getFirst().getStatus());
    }

    @Test
    void getDegradedRegions_ShouldReturn() {
        var degraded = new RegionHealth("us-west-2", "DEGRADED", 300.0, 85.0);
        when(healthRepository.findByStatus("DEGRADED")).thenReturn(List.of(degraded));

        var result = regionHealthService.getDegradedRegions();

        assertEquals(1, result.size());
    }

    @Test
    void getMaintenanceRegions_ShouldReturn() {
        var maintenance = new RegionHealth("eu-west-1", "MAINTENANCE", 0.0, 0.0);
        when(healthRepository.findByStatus("MAINTENANCE")).thenReturn(List.of(maintenance));

        var result = regionHealthService.getMaintenanceRegions();

        assertEquals(1, result.size());
    }
}
