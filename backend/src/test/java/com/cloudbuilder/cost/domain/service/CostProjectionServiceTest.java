package com.cloudbuilder.cost.domain.service;

import com.cloudbuilder.cost.domain.port.CostRecordRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CostProjectionServiceTest {

    @Mock
    private CostRecordRepository costRecordRepository;

    private CostProjectionService costProjectionService;

    @BeforeEach
    void setUp() {
        costProjectionService = new CostProjectionService(costRecordRepository);
    }

    @Test
    void projectCosts_WithSufficientData_ShouldReturnProjections() {
        var envId = "env-1";
        var today = LocalDate.now();
        var since = today.minusDays(90);

        // 30 data points with linear trend: y = 100 + 2*x
        var dailyTotals = new ArrayList<Object[]>();
        for (int i = 0; i < 30; i++) {
            var date = since.plusDays(i);
            double amount = 100.0 + 2.0 * i;
            dailyTotals.add(new Object[]{date, amount});
        }

        when(costRecordRepository.findDailyTotalsSince(eq(envId), any(LocalDate.class)))
                .thenReturn(dailyTotals);

        var projections = costProjectionService.projectCosts(envId, 30);

        assertFalse(projections.isEmpty(), "Should return projections with sufficient data");
        assertEquals(30, projections.size(), "Should return 30 projection points");

        // All values should be positive
        for (var point : projections) {
            assertTrue(point.projectedAmount() > 0, "Projected amount should be positive");
            assertTrue(point.upperBound() >= point.lowerBound(),
                    "Upper bound should be >= lower bound");
        }

        // Projection should show growth (upward trend)
        var first = projections.get(0).projectedAmount();
        var last = projections.get(projections.size() - 1).projectedAmount();
        assertTrue(last >= first, "Positive trend should show increasing projections");
    }

    @Test
    void projectCosts_WithInsufficientData_ShouldReturnEmpty() {
        var envId = "env-1";
        var today = LocalDate.now();
        var since = today.minusDays(90);

        // Only 1 data point
        var dailyTotals = new ArrayList<Object[]>();
        dailyTotals.add(new Object[]{since, 100.0});

        when(costRecordRepository.findDailyTotalsSince(eq(envId), any(LocalDate.class)))
                .thenReturn(dailyTotals);

        var projections = costProjectionService.projectCosts(envId, 30);

        assertTrue(projections.isEmpty(), "Insufficient data should return empty list");
    }

    @Test
    void projectCosts_WithFlatData_ShouldReturnStableProjections() {
        var envId = "env-1";
        var today = LocalDate.now();
        var since = today.minusDays(90);

        // All values exactly 200 — flat trend
        var dailyTotals = new ArrayList<Object[]>();
        for (int i = 0; i < 30; i++) {
            dailyTotals.add(new Object[]{since.plusDays(i), 200.0});
        }

        when(costRecordRepository.findDailyTotalsSince(eq(envId), any(LocalDate.class)))
                .thenReturn(dailyTotals);

        var projections = costProjectionService.projectCosts(envId, 15);

        assertFalse(projections.isEmpty());
        // With flat data, projection should be near 200
        for (var point : projections) {
            assertTrue(point.projectedAmount() > 0,
                    "Flat data projection should be positive");
            assertTrue(point.projectedAmount() >= 180 && point.projectedAmount() <= 220,
                    "Flat data projection should be near 200, got: " + point.projectedAmount());
        }
    }

    @Test
    void projectCosts_WithNegativeTrend_ShouldClampToZero() {
        var envId = "env-1";
        var today = LocalDate.now();
        var since = today.minusDays(90);

        // Steep downward trend (goes negative quickly)
        var dailyTotals = new ArrayList<Object[]>();
        for (int i = 0; i < 30; i++) {
            double amount = 1000.0 - 50.0 * i; // goes negative by day 20+
            dailyTotals.add(new Object[]{since.plusDays(i), Math.max(0, amount)});
        }

        when(costRecordRepository.findDailyTotalsSince(eq(envId), any(LocalDate.class)))
                .thenReturn(dailyTotals);

        var projections = costProjectionService.projectCosts(envId, 30);

        assertFalse(projections.isEmpty());
        // Projected amounts should never be negative
        for (var point : projections) {
            assertTrue(point.projectedAmount() >= 0,
                    "Projected amount should not be negative, got: " + point.projectedAmount());
            assertTrue(point.lowerBound() >= 0,
                    "Lower bound should not be negative, got: " + point.lowerBound());
        }
    }

    @Test
    void projectCosts_UpperBoundGreaterThanLowerBound() {
        var envId = "env-1";
        var today = LocalDate.now();
        var since = today.minusDays(90);

        var dailyTotals = new ArrayList<Object[]>();
        for (int i = 0; i < 60; i++) {
            double amount = 150.0 + Math.sin(i * 0.5) * 30; // seasonal pattern
            dailyTotals.add(new Object[]{since.plusDays(i), amount});
        }

        when(costRecordRepository.findDailyTotalsSince(eq(envId), any(LocalDate.class)))
                .thenReturn(dailyTotals);

        var projections = costProjectionService.projectCosts(envId, 20);

        assertFalse(projections.isEmpty());
        for (var point : projections) {
            assertTrue(point.upperBound() >= point.projectedAmount(),
                    "Upper bound should be >= projected amount");
            assertTrue(point.lowerBound() <= point.projectedAmount(),
                    "Lower bound should be <= projected amount");
            assertTrue(point.upperBound() > point.lowerBound(),
                    "Confidence interval should have positive width");
        }
    }

    @Test
    void projectCosts_NoData_ShouldReturnEmpty() {
        var envId = "env-1";

        when(costRecordRepository.findDailyTotalsSince(eq(envId), any(LocalDate.class)))
                .thenReturn(List.of());

        var projections = costProjectionService.projectCosts(envId, 30);

        assertTrue(projections.isEmpty(), "No data should return empty list");
    }

    @Test
    void projectCosts_WithIncreasingTrend_ConfidenceIntervalWidens() {
        var envId = "env-1";
        var today = LocalDate.now();
        var since = today.minusDays(90);

        var dailyTotals = new ArrayList<Object[]>();
        for (int i = 0; i < 30; i++) {
            dailyTotals.add(new Object[]{since.plusDays(i), 100.0 + i * 3.0});
        }

        when(costRecordRepository.findDailyTotalsSince(eq(envId), any(LocalDate.class)))
                .thenReturn(dailyTotals);

        var projections = costProjectionService.projectCosts(envId, 15);

        assertFalse(projections.isEmpty());
        // Later projections should have wider CI (more uncertainty)
        var firstWidth = projections.get(0).upperBound() - projections.get(0).lowerBound();
        var lastWidth = projections.get(projections.size() - 1).upperBound()
                - projections.get(projections.size() - 1).lowerBound();
        assertTrue(lastWidth >= firstWidth,
                "Confidence interval should widen with projection horizon");
    }
}
