package com.cloudbuilder.cost.infrastructure.web;

import com.cloudbuilder.cost.domain.model.Budget;
import com.cloudbuilder.cost.domain.model.CostScenario;
import com.cloudbuilder.cost.domain.service.AnomalyDetectionService;
import com.cloudbuilder.cost.domain.service.BudgetAlertService;
import com.cloudbuilder.cost.domain.service.CostProjectionService;
import com.cloudbuilder.cost.domain.service.CostScenarioService;
import com.cloudbuilder.cost.domain.service.CostService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("CostController Tests")
class CostControllerTest {

    @Mock
    private CostService costService;
    @Mock
    private CostScenarioService costScenarioService;
    @Mock
    private AnomalyDetectionService anomalyDetectionService;
    @Mock
    private CostProjectionService costProjectionService;
    @Mock
    private BudgetAlertService budgetAlertService;

    @InjectMocks
    private CostController costController;

    @Test
    @DisplayName("GET /cost/overview - returns overview with total cost")
    void getOverview() {
        when(costService.getTotalCost(any(), any(), any())).thenReturn(1500.00);
        when(costService.getTopServicesByCost(any())).thenReturn(List.of());
        when(costService.getMonthlyForecast(any())).thenReturn(2000.00);
        when(costService.getBudgets(any())).thenReturn(List.of());

        var response = costController.getOverview("env-1", null, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).containsKey("totalCost");
        assertThat(response.getBody()).containsKey("forecast");
        assertThat(response.getBody().get("totalCost")).isEqualTo(1500.00);
    }

    @Test
    @DisplayName("GET /cost/records - returns records")
    void getRecords() {
        when(costService.getCosts(any(), any(), any())).thenReturn(List.of());

        var response = costController.getRecords("env-1");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEmpty();
    }

    @Test
    @DisplayName("GET /cost/budgets - returns budgets")
    void getBudgets() {
        when(costService.getBudgets(any())).thenReturn(List.of());

        var response = costController.getBudgets("env-1");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEmpty();
    }

    @Test
    @DisplayName("GET /cost/anomalies - returns anomalies")
    void getAnomalies() {
        when(anomalyDetectionService.detectAnomalies(any(), anyInt())).thenReturn(List.of());

        var response = costController.getAnomalies("env-1", 30);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEmpty();
    }

    @Test
    @DisplayName("GET /cost/projection - returns projection")
    void getProjection() {
        when(costProjectionService.projectCosts(any(), anyInt())).thenReturn(List.of());

        var response = costController.getProjection("env-1", 30);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEmpty();
    }

    @Test
    @DisplayName("GET /cost/budget-alerts - returns budget alerts")
    void getBudgetAlerts() {
        when(budgetAlertService.evaluateBudgets(any())).thenReturn(List.of());

        var response = costController.getBudgetAlerts("env-1");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEmpty();
    }

    @Test
    @DisplayName("GET /cost/scenarios/{id} - returns 404 when not found")
    void getScenarioNotFound() {
        when(costScenarioService.findById("nonexistent")).thenReturn(null);

        var response = costController.getScenario("nonexistent");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    @DisplayName("DELETE /cost/scenarios/{id} - deletes scenario")
    void deleteScenario() {
        var response = costController.deleteScenario("scenario-1");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(costScenarioService).delete("scenario-1");
    }
}
