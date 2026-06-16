package com.cloudbuilder.cost.domain.service;

import com.cloudbuilder.cost.domain.model.Budget;
import com.cloudbuilder.cost.domain.model.CostRecord;
import com.cloudbuilder.cost.domain.port.BudgetRepository;
import com.cloudbuilder.cost.domain.port.CostRecordRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CostServiceTest {

    @Mock
    private CostRecordRepository costRecordRepository;

    @Mock
    private BudgetRepository budgetRepository;

    private CostService costService;

    @BeforeEach
    void setUp() {
        costService = new CostService(costRecordRepository, budgetRepository);
    }

    @Test
    void importCostRecord_ShouldSaveAndReturn() {
        var record = new CostRecord("env-1", "aws", "EC2", 150.0, "USD", LocalDate.now());
        when(costRecordRepository.save(any(CostRecord.class))).thenReturn(record);

        var result = costService.importCostRecord(record);

        assertNotNull(result);
        assertEquals("aws", result.getProvider());
        assertEquals(150.0, result.getAmount());
        verify(costRecordRepository).save(record);
    }

    @Test
    void getCosts_WithDateRange_ShouldCallDateFilteredMethod() {
        var start = LocalDate.now().minusDays(7);
        var end = LocalDate.now();
        when(costRecordRepository.findByEnvironmentIdAndDateBetween("env-1", start, end))
            .thenReturn(List.of());

        var result = costService.getCosts("env-1", start, end);

        assertTrue(result.isEmpty());
        verify(costRecordRepository).findByEnvironmentIdAndDateBetween("env-1", start, end);
    }

    @Test
    void getCosts_WithoutDateRange_ShouldReturnAll() {
        when(costRecordRepository.findByEnvironmentId("env-1")).thenReturn(List.of(
            new CostRecord("env-1", "aws", "EC2", 100.0, "USD", LocalDate.now())
        ));

        var result = costService.getCosts("env-1", null, null);

        assertEquals(1, result.size());
        verify(costRecordRepository).findByEnvironmentId("env-1");
    }

    @Test
    void getTopServicesByCost_ShouldReturnList() {
        var topServices = List.of(
            new Object[]{"EC2", 500.0},
            new Object[]{"S3", 200.0}
        );
        when(costRecordRepository.findTopServicesByCost("env-1")).thenReturn(topServices);

        var result = costService.getTopServicesByCost("env-1");

        assertEquals(2, result.size());
    }

    @Test
    void getTotalCost_ShouldReturnSum() {
        when(costRecordRepository.findTotalCostInRange(eq("env-1"), any(LocalDate.class), any(LocalDate.class)))
            .thenReturn(1000.0);

        var result = costService.getTotalCost("env-1", LocalDate.now().minusDays(30), LocalDate.now());

        assertEquals(1000.0, result);
    }

    @Test
    void getTotalCost_WhenNull_ShouldReturnZero() {
        when(costRecordRepository.findTotalCostInRange(eq("env-1"), any(LocalDate.class), any(LocalDate.class)))
            .thenReturn(null);

        var result = costService.getTotalCost("env-1", LocalDate.now().minusDays(30), LocalDate.now());

        assertEquals(0.0, result);
    }

    @Test
    void createBudget_ShouldSaveAndReturn() {
        var budget = new Budget("env-1", "Monthly", 5000.0, "USD",
            LocalDate.now(), LocalDate.now().plusMonths(1));
        when(budgetRepository.save(any(Budget.class))).thenReturn(budget);

        var result = costService.createBudget(budget);

        assertNotNull(result);
        assertEquals("Monthly", result.getName());
        verify(budgetRepository).save(budget);
    }

    @Test
    void getBudgets_ShouldReturnList() {
        when(budgetRepository.findByEnvironmentId("env-1")).thenReturn(List.of(
            new Budget("env-1", "Monthly", 5000.0, "USD",
                LocalDate.now(), LocalDate.now().plusMonths(1))
        ));

        var result = costService.getBudgets("env-1");

        assertEquals(1, result.size());
    }

    @Test
    void getMonthlyForecast_ShouldCalculateProjection() {
        var today = LocalDate.now();
        var startOfMonth = today.withDayOfMonth(1);
        when(costRecordRepository.findTotalCostInRange("env-1", startOfMonth, today))
            .thenReturn(1500.0);

        var forecast = costService.getMonthlyForecast("env-1");

        assertTrue(forecast > 0);
        verify(costRecordRepository).findTotalCostInRange("env-1", startOfMonth, today);
    }

    @Test
    void getMonthlyForecast_WhenNoData_ShouldReturnZero() {
        var today = LocalDate.now();
        var startOfMonth = today.withDayOfMonth(1);
        when(costRecordRepository.findTotalCostInRange("env-1", startOfMonth, today))
            .thenReturn(null);

        var forecast = costService.getMonthlyForecast("env-1");

        assertEquals(0.0, forecast);
    }
}
