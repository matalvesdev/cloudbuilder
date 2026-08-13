package com.cloudbuilder.provision.domain.service;

import com.cloudbuilder.cost.domain.model.CostScenario;
import com.cloudbuilder.cost.domain.service.CostScenarioService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TerraformCostEstimatorTest {

    @Mock
    private CostScenarioService costScenarioService;

    private ObjectMapper objectMapper;
    private TerraformCostEstimator estimator;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        estimator = new TerraformCostEstimator(costScenarioService, objectMapper);
    }

    @Test
    void estimateFromResourceTypes_WithAWSResources_ShouldCalculateCorrectTotals() {
        var resourceTypes = List.of("aws_vpc", "aws_subnet", "aws_instance", "aws_s3_bucket");
        var scenario = new CostScenario("tenant-1", "test", "env-1", "canvas-1",
                "avg", 0, 65.0, 4, "[]");
        when(costScenarioService.create(any(CostScenario.class))).thenReturn(scenario);

        var result = estimator.estimateFromResourceTypes(
                "tenant-1", "env-1", "canvas-1", "AWS Test", resourceTypes);

        assertNotNull(result);
        verify(costScenarioService).create(any(CostScenario.class));
    }

    @Test
    void estimateFromResourceTypes_WithEmptyList_ShouldReturnZeroEstimates() {
        var scenario = new CostScenario("tenant-1", "empty", "env-1", "canvas-1",
                "avg", 0, 0.0, 0, "[]");
        when(costScenarioService.create(any(CostScenario.class))).thenReturn(scenario);

        var result = estimator.estimateFromResourceTypes(
                "tenant-1", "env-1", "canvas-1", "Empty Test", List.of());

        assertNotNull(result);
        verify(costScenarioService).create(any(CostScenario.class));
    }

    @Test
    void estimateFromParsedResources_ShouldExtractResourceTypes() {
        var resources = List.of(
                new com.cloudbuilder.provision.application.dto.ParsedResource(
                        "vpc", "aws_vpc", "aws", "VPC", false, Map.of()),
                new com.cloudbuilder.provision.application.dto.ParsedResource(
                        "db", "aws_db_instance", "aws", "RDS", false, Map.of())
        );
        var scenario = new CostScenario("tenant-1", "parsed", "env-1", "canvas-1",
                "avg", 0, 150.0, 2, "[]");
        when(costScenarioService.create(any(CostScenario.class))).thenReturn(scenario);

        var result = estimator.estimateFromParsedResources(
                "tenant-1", "env-1", "canvas-1", "Parsed Test", resources);

        assertNotNull(result);
        verify(costScenarioService).create(any(CostScenario.class));
    }

    @Test
    void getEstimatePreview_WithMultiProviderResources_ShouldReturnBreakdown() {
        var resourceTypes = List.of("aws_vpc", "azurerm_resource_group",
                "google_compute_network", "kubernetes_namespace");

        var result = estimator.getEstimatePreview(resourceTypes);

        assertNotNull(result);
        assertTrue(result.containsKey("totalMin"));
        assertTrue(result.containsKey("totalAvg"));
        assertTrue(result.containsKey("totalMax"));
        assertEquals(4, result.get("resourceCount"));
        assertNotNull(result.get("breakdown"));
        assertInstanceOf(List.class, result.get("breakdown"));
        verifyNoInteractions(costScenarioService);
    }

    @Test
    void getEstimatePreview_WithEmptyList_ShouldReturnZeroTotals() {
        var result = estimator.getEstimatePreview(List.of());

        assertEquals(0.0, (Double) result.get("totalMin"), 0.001);
        assertEquals(0.0, (Double) result.get("totalAvg"), 0.001);
        assertEquals(0.0, (Double) result.get("totalMax"), 0.001);
        assertEquals(0, result.get("resourceCount"));
    }

    @Test
    void getEstimatePreview_WithUnknownTypes_ShouldUseDefaultPrices() {
        var result = estimator.getEstimatePreview(List.of("nonexistent_resource"));

        assertEquals(10.0, (Double) result.get("totalMin"), 0.001);
        assertEquals(25.0, (Double) result.get("totalAvg"), 0.001);
        assertEquals(50.0, (Double) result.get("totalMax"), 0.001);
        assertEquals(1, result.get("resourceCount"));
    }

    @Test
    void estimateFromResourceTypes_WithMixedKnownAndUnknown_ShouldAccumulate() {
        var result = estimator.getEstimatePreview(List.of("aws_instance", "unknown_type", "azurerm_linux_virtual_machine"));

        assertTrue((Double) result.get("totalMin") > 0);
        assertTrue((Double) result.get("totalAvg") > 0);
        assertTrue((Double) result.get("totalMax") > 0);
        assertEquals(3, result.get("resourceCount"));
    }
}
