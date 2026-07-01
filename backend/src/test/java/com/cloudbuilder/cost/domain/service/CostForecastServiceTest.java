package com.cloudbuilder.cost.domain.service;

import com.cloudbuilder.cost.domain.model.CostForecast;
import com.cloudbuilder.cost.domain.port.CostForecastRepository;
import com.cloudbuilder.cost.domain.port.CostRecordRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CostForecastServiceTest {

    @Mock
    private CostForecastRepository costForecastRepository;

    @Mock
    private CostRecordRepository costRecordRepository;

    private CostForecastService service;

    @BeforeEach
    void setUp() {
        service = new CostForecastService(costForecastRepository, costRecordRepository);
    }

    // ── generateForecast ────────────────────────────────────────────

    @Test
    void generateForecast_Monthly_WithCostData() {
        when(costRecordRepository.findTotalCostInRange(eq("env-1"), any(), any()))
                .thenReturn(3000.0);
        when(costForecastRepository.save(any(CostForecast.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        var result = service.generateForecast("t-1", "env-1", "MONTHLY");

        assertNotNull(result);
        assertEquals("t-1", result.getTenantId());
        assertEquals("env-1", result.getEnvironmentId());
        assertEquals("MONTHLY", result.getPeriod());
        assertEquals("MOVING_AVERAGE", result.getModel());
        // dailyAverage = 3000/30 = 100, predicted = 100 * 30 = 3000
        assertEquals(3000.0, result.getPredictedAmount(), 0.01);
        assertEquals(2400.0, result.getLowerBound(), 0.01);  // 3000 * 0.8
        assertEquals(3600.0, result.getUpperBound(), 0.01);  // 3000 * 1.2
        verify(costForecastRepository).save(any(CostForecast.class));
    }

    @Test
    void generateForecast_Quarterly_WithCostData() {
        when(costRecordRepository.findTotalCostInRange(eq("env-1"), any(), any()))
                .thenReturn(900.0);
        when(costForecastRepository.save(any(CostForecast.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        var result = service.generateForecast("t-1", "env-1", "QUARTERLY");

        // dailyAverage = 900/30 = 30, predicted = 30 * 90 = 2700
        assertEquals(2700.0, result.getPredictedAmount(), 0.01);
        assertEquals("QUARTERLY", result.getPeriod());
    }

    @Test
    void generateForecast_Yearly_WithCostData() {
        when(costRecordRepository.findTotalCostInRange(eq("env-1"), any(), any()))
                .thenReturn(360.0);
        when(costForecastRepository.save(any(CostForecast.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        var result = service.generateForecast("t-1", "env-1", "YEARLY");

        // dailyAverage = 360/30 = 12, predicted = 12 * 365 = 4380
        assertEquals(4380.0, result.getPredictedAmount(), 0.01);
        assertEquals("YEARLY", result.getPeriod());
    }

    @Test
    void generateForecast_NoCostData_DefaultsToZero() {
        when(costRecordRepository.findTotalCostInRange(eq("env-1"), any(), any()))
                .thenReturn(null);
        when(costForecastRepository.save(any(CostForecast.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        var result = service.generateForecast("t-1", "env-1", "MONTHLY");

        assertEquals(0.0, result.getPredictedAmount(), 0.01);
        assertEquals(0.0, result.getLowerBound(), 0.01);
        assertEquals(0.0, result.getUpperBound(), 0.01);
    }

    @Test
    void generateForecast_UnknownPeriod_DefaultsToMonthly() {
        when(costRecordRepository.findTotalCostInRange(eq("env-1"), any(), any()))
                .thenReturn(300.0);
        when(costForecastRepository.save(any(CostForecast.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        var result = service.generateForecast("t-1", "env-1", "WEEKLY");

        // unknown period defaults to 30 days
        // dailyAverage = 300/30 = 10, predicted = 10 * 30 = 300
        assertEquals(300.0, result.getPredictedAmount(), 0.01);
    }

    // ── getLatestForecast ───────────────────────────────────────────

    @Test
    void getLatestForecast_WhenExists_ShouldReturnFirst() {
        var forecast = new CostForecast("t-1", "env-1", 100.0, 80.0, 120.0,
                "MONTHLY", "MOVING_AVERAGE", java.time.LocalDateTime.now());
        when(costForecastRepository.findLatestByTenantId("t-1"))
                .thenReturn(List.of(forecast));

        var result = service.getLatestForecast("t-1");

        assertTrue(result.isPresent());
        assertEquals("env-1", result.get().getEnvironmentId());
    }

    @Test
    void getLatestForecast_WhenEmpty_ShouldReturnEmpty() {
        when(costForecastRepository.findLatestByTenantId("t-1"))
                .thenReturn(List.of());

        assertTrue(service.getLatestForecast("t-1").isEmpty());
    }

    // ── getForecastsByEnvironment ───────────────────────────────────

    @Test
    void getForecastsByEnvironment_ShouldReturnList() {
        var f1 = new CostForecast("t-1", "env-1", 100.0, 80.0, 120.0,
                "MONTHLY", "MOVING_AVERAGE", java.time.LocalDateTime.now());
        when(costForecastRepository.findByTenantIdAndEnvironmentId("t-1", "env-1"))
                .thenReturn(List.of(f1));

        var result = service.getForecastsByEnvironment("t-1", "env-1");

        assertEquals(1, result.size());
        verify(costForecastRepository).findByTenantIdAndEnvironmentId("t-1", "env-1");
    }

    // ── findById ────────────────────────────────────────────────────

    @Test
    void findById_WhenExists_ShouldReturn() {
        var forecast = new CostForecast("t-1", "env-1", 100.0, 80.0, 120.0,
                "MONTHLY", "MOVING_AVERAGE", java.time.LocalDateTime.now());
        when(costForecastRepository.findById("f-1")).thenReturn(Optional.of(forecast));

        assertTrue(service.findById("f-1").isPresent());
    }

    @Test
    void findById_WhenNotFound_ShouldReturnEmpty() {
        when(costForecastRepository.findById("missing")).thenReturn(Optional.empty());

        assertTrue(service.findById("missing").isEmpty());
    }
}
