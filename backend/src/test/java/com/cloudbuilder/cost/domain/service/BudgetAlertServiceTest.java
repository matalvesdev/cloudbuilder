package com.cloudbuilder.cost.domain.service;

import com.cloudbuilder.cost.domain.model.Budget;
import com.cloudbuilder.cost.domain.port.BudgetRepository;
import com.cloudbuilder.cost.domain.port.CostRecordRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BudgetAlertServiceTest {

    @Mock
    private BudgetRepository budgetRepository;

    @Mock
    private CostRecordRepository costRecordRepository;

    private BudgetAlertService budgetAlertService;

    @BeforeEach
    void setUp() {
        budgetAlertService = new BudgetAlertService(budgetRepository, costRecordRepository);
    }

    @Test
    void evaluateBudgets_WithWarningUsage_ShouldReturnWarningAlert() {
        var envId = "env-1";
        var budget = new Budget(envId, "Mensal", 1000.0, "USD",
                LocalDate.now().minusDays(30), LocalDate.now().plusDays(30));

        when(budgetRepository.findByEnvironmentId(envId)).thenReturn(List.of(budget));
        // 850 spent out of 1000 = 85% → WARNING
        when(costRecordRepository.findTotalCostInRange(anyString(), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(850.0);

        var alerts = budgetAlertService.evaluateBudgets(envId);

        assertFalse(alerts.isEmpty(), "85% usage should trigger an alert");
        assertEquals("WARNING", alerts.get(0).severity(),
                "85% usage should be WARNING");
        assertEquals(85.0, alerts.get(0).usagePct(), 0.01);
    }

    @Test
    void evaluateBudgets_WithCriticalUsage_ShouldReturnCriticalAlert() {
        var envId = "env-1";
        var budget = new Budget(envId, "Mensal", 1000.0, "USD",
                LocalDate.now().minusDays(30), LocalDate.now().plusDays(30));

        when(budgetRepository.findByEnvironmentId(envId)).thenReturn(List.of(budget));
        // 950 spent = 95% → CRITICAL
        when(costRecordRepository.findTotalCostInRange(anyString(), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(950.0);

        var alerts = budgetAlertService.evaluateBudgets(envId);

        assertFalse(alerts.isEmpty());
        assertEquals("CRITICAL", alerts.get(0).severity(),
                "95% usage should be CRITICAL");
    }

    @Test
    void evaluateBudgets_WithExceededUsage_ShouldReturnExceededAlert() {
        var envId = "env-1";
        var budget = new Budget(envId, "Mensal", 1000.0, "USD",
                LocalDate.now().minusDays(30), LocalDate.now().plusDays(30));

        when(budgetRepository.findByEnvironmentId(envId)).thenReturn(List.of(budget));
        // 1500 spent = 150% → EXCEEDED
        when(costRecordRepository.findTotalCostInRange(anyString(), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(1500.0);

        var alerts = budgetAlertService.evaluateBudgets(envId);

        assertFalse(alerts.isEmpty());
        assertEquals("EXCEEDED", alerts.get(0).severity(),
                "150% usage should be EXCEEDED");
        assertEquals(150.0, alerts.get(0).usagePct(), 0.01);
    }

    @Test
    void evaluateBudgets_WithLowUsage_ShouldReturnNoAlert() {
        var envId = "env-1";
        var budget = new Budget(envId, "Mensal", 1000.0, "USD",
                LocalDate.now().minusDays(30), LocalDate.now().plusDays(30));

        when(budgetRepository.findByEnvironmentId(envId)).thenReturn(List.of(budget));
        // 500 spent = 50% → below 80% threshold, no alert
        when(costRecordRepository.findTotalCostInRange(anyString(), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(500.0);

        var alerts = budgetAlertService.evaluateBudgets(envId);

        assertTrue(alerts.isEmpty(), "50% usage should NOT trigger an alert");
    }

    @Test
    void evaluateBudgets_WithExpiredBudget_ShouldMarkExpired() {
        var envId = "env-1";
        var budget = new Budget(envId, "Mensal", 1000.0, "USD",
                LocalDate.now().minusDays(60), LocalDate.now().minusDays(1));

        when(budgetRepository.findByEnvironmentId(envId)).thenReturn(List.of(budget));

        var alerts = budgetAlertService.evaluateBudgets(envId);

        assertTrue(alerts.isEmpty(), "Expired budget should generate no alerts");
        assertEquals("EXPIRED", budget.getStatus(), "Expired budget should be marked EXPIRED");
        verify(budgetRepository).save(budget);
    }

    @Test
    void evaluateBudgets_WithNonActiveBudget_ShouldSkip() {
        var envId = "env-1";
        var budget = new Budget(envId, "Cancelado", 1000.0, "USD",
                LocalDate.now().minusDays(30), LocalDate.now().plusDays(30));
        // Set status to INACTIVE via reflection-like (it has a setter)
        budget.setStatus("INACTIVE");

        when(budgetRepository.findByEnvironmentId(envId)).thenReturn(List.of(budget));

        var alerts = budgetAlertService.evaluateBudgets(envId);

        assertTrue(alerts.isEmpty(), "INACTIVE budget should be skipped");
        verify(costRecordRepository, never()).findTotalCostInRange(anyString(), any(), any());
    }

    @Test
    void evaluateBudgets_UpdatesSpentAmountOnBudget() {
        var envId = "env-1";
        var budget = new Budget(envId, "Mensal", 1000.0, "USD",
                LocalDate.now().minusDays(30), LocalDate.now().plusDays(30));

        when(budgetRepository.findByEnvironmentId(envId)).thenReturn(List.of(budget));
        when(costRecordRepository.findTotalCostInRange(anyString(), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(888.0);

        budgetAlertService.evaluateBudgets(envId);

        assertEquals(888.0, budget.getSpentAmount(), 0.01, "Budget spent amount should be updated");
        verify(budgetRepository, atLeastOnce()).save(budget);
    }

    @Test
    void evaluateBudgets_WithMultipleBudgets_ShouldEvaluateAll() {
        var envId = "env-1";
        var budget1 = new Budget(envId, "Mensal", 1000.0, "USD",
                LocalDate.now().minusDays(30), LocalDate.now().plusDays(30));
        var budget2 = new Budget(envId, "Anual", 12000.0, "USD",
                LocalDate.now().minusDays(30), LocalDate.now().plusDays(30));

        when(budgetRepository.findByEnvironmentId(envId)).thenReturn(List.of(budget1, budget2));
        when(costRecordRepository.findTotalCostInRange(anyString(), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(900.0) // 90% → CRITICAL
                .thenReturn(9600.0); // 80% → WARNING

        var alerts = budgetAlertService.evaluateBudgets(envId);

        assertEquals(2, alerts.size());
        assertEquals("CRITICAL", alerts.get(0).severity());
        assertEquals("WARNING", alerts.get(1).severity());
    }

    @Test
    void evaluateBudgets_WithZeroLimit_ShouldNotDivideByZero() {
        var envId = "env-1";
        var budget = new Budget(envId, "Free", 0.0, "USD",
                LocalDate.now().minusDays(30), LocalDate.now().plusDays(30));

        when(budgetRepository.findByEnvironmentId(envId)).thenReturn(List.of(budget));
        when(costRecordRepository.findTotalCostInRange(anyString(), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(0.0);

        // Should not throw ArithmeticException
        assertDoesNotThrow(() -> budgetAlertService.evaluateBudgets(envId));

        var alerts = budgetAlertService.evaluateBudgets(envId);
        assertTrue(alerts.isEmpty(), "Zero limit with zero spend should not trigger alert");
    }
}
