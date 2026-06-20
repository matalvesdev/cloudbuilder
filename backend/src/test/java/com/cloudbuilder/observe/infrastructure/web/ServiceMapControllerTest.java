package com.cloudbuilder.observe.infrastructure.web;

import com.cloudbuilder.design.domain.model.Canvas;
import com.cloudbuilder.design.domain.model.CanvasEdge;
import com.cloudbuilder.design.domain.model.CanvasNode;
import com.cloudbuilder.design.domain.port.CanvasRepository;
import com.cloudbuilder.observe.domain.model.Alert;
import com.cloudbuilder.observe.domain.model.ServiceHealth;
import com.cloudbuilder.observe.domain.port.AlertRepository;
import com.cloudbuilder.observe.domain.port.ServiceHealthRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ServiceMapControllerTest {

    @Mock private CanvasRepository canvasRepository;
    @Mock private ServiceHealthRepository serviceHealthRepository;
    @Mock private AlertRepository alertRepository;

    private ServiceMapController controller;

    @BeforeEach
    void setUp() {
        controller = new ServiceMapController(canvasRepository, serviceHealthRepository, alertRepository);
    }

    @Test
    void getServiceMap_WithNodesAndHealthData_ShouldReturnEnrichedNodes() {
        // Arrange
        var canvas = new Canvas("tenant-1", "test-canvas", "desc", "user-1");
        canvas.setMetadata("{\"environmentId\":\"env-1\"}");
        var node1 = createNode(canvas, "aws_vpc", 100, 200,
                "{\"resourceName\":\"main-vpc\",\"cidr_block\":\"10.0.0.0/16\"}");
        var node2 = createNode(canvas, "aws_instance", 300, 200,
                "{\"resourceName\":\"web-server\",\"instance_type\":\"t3.medium\"}");
        var edge = new CanvasEdge(canvas, node1.getId(), node2.getId(), "default", null);
        canvas.addNode(node1);
        canvas.addNode(node2);
        canvas.addEdge(edge);

        var canvasId = canvas.getId();
        when(canvasRepository.findById(canvasId)).thenReturn(Optional.of(canvas));
        when(serviceHealthRepository.findByEnvironmentId("env-1")).thenReturn(List.of(
                new ServiceHealth("main-vpc", "env-1", "healthy", 5.0, 99.99),
                new ServiceHealth("web-server", "env-1", "degraded", 200.0, 98.5)
        ));
        when(alertRepository.findByEnvironmentId("env-1")).thenReturn(List.of());

        // Act
        var response = controller.getServiceMap(canvasId);
        var body = response.getBody();

        // Assert
        assertNotNull(body);
        assertEquals(canvasId, body.canvasId());
        assertEquals("test-canvas", body.canvasName());
        assertEquals("env-1", body.environmentId());
        assertEquals("degraded", body.overallStatus());
        assertEquals(2, body.nodes().size());
        assertEquals(1, body.edges().size());

        // Verify node enrichment
        var vpcNode = body.nodes().stream().filter(n -> n.componentDefinitionId().equals("aws_vpc")).findFirst();
        assertTrue(vpcNode.isPresent());
        assertEquals("healthy", vpcNode.get().status());
        assertEquals(5.0, vpcNode.get().latencyMs());
        assertEquals(99.99, vpcNode.get().uptimePercent());
        assertFalse(vpcNode.get().hasCriticalAlert());
        assertEquals(0, vpcNode.get().alertCount());
    }

    @Test
    void getServiceMap_WithAlerts_ShouldComputeCriticalStatus() {
        var canvas = new Canvas("tenant-1", "alert-canvas", "desc", "user-1");
        canvas.setMetadata("{\"environmentId\":\"env-2\"}");
        var node = createNode(canvas, "aws_instance", 100, 100, "{\"resourceName\":\"app-server\"}");
        canvas.addNode(node);

        var canvasId = canvas.getId();
        when(canvasRepository.findById(canvasId)).thenReturn(Optional.of(canvas));
        when(serviceHealthRepository.findByEnvironmentId("env-2")).thenReturn(List.of(
                new ServiceHealth("app-server", "env-2", "down", 0.0, 45.0)
        ));
        when(alertRepository.findByEnvironmentId("env-2")).thenReturn(List.of(
                createAlert("env-2", "critical", "App server is down", "app-server")
        ));

        var response = controller.getServiceMap(canvasId);
        var body = response.getBody();

        assertNotNull(body);
        assertEquals("critical", body.overallStatus());
        var enriched = body.nodes().getFirst();
        assertTrue(enriched.hasCriticalAlert());
        assertEquals(1, enriched.alertCount());
        assertEquals("down", enriched.status());
    }

    @Test
    void getServiceMap_CanvasNotFound_ShouldThrow() {
        when(canvasRepository.findById("nonexistent")).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> controller.getServiceMap("nonexistent"));
    }

    @Test
    void getServiceMap_NoHealthData_ShouldReturnUnknown() {
        var canvas = new Canvas("tenant-1", "unknown-canvas", "desc", "user-1");
        canvas.setMetadata("{\"environmentId\":\"env-3\"}");
        var node = createNode(canvas, "aws_s3_bucket", 100, 100, "{\"resourceName\":\"my-bucket\"}");
        canvas.addNode(node);

        var canvasId = canvas.getId();
        when(canvasRepository.findById(canvasId)).thenReturn(Optional.of(canvas));
        when(serviceHealthRepository.findByEnvironmentId("env-3")).thenReturn(List.of());
        when(alertRepository.findByEnvironmentId("env-3")).thenReturn(List.of());

        var response = controller.getServiceMap(canvasId);
        var body = response.getBody();

        assertNotNull(body);
        assertEquals("unknown", body.overallStatus());
        assertEquals("unknown", body.nodes().getFirst().status());
    }

    @Test
    void getServiceMap_NoMetadata_ShouldUseDefaultEnvironment() {
        var canvas = new Canvas("tenant-1", "no-meta", "desc", "user-1");
        canvas.addNode(createNode(canvas, "aws_vpc", 100, 100, null));

        var canvasId = canvas.getId();
        when(canvasRepository.findById(canvasId)).thenReturn(Optional.of(canvas));
        when(serviceHealthRepository.findByEnvironmentId("default")).thenReturn(List.of());
        when(alertRepository.findByEnvironmentId("default")).thenReturn(List.of());

        var response = controller.getServiceMap(canvasId);
        var body = response.getBody();

        assertNotNull(body);
        assertEquals("default", body.environmentId());
    }

    @Test
    void listServiceMaps_WithCanvases_ShouldReturnSummaries() {
        var canvas1 = new Canvas("tenant-1", "canvas-1", "desc", "user-1");
        canvas1.setMetadata("{\"environmentId\":\"env-1\"}");
        var canvas2 = new Canvas("tenant-1", "canvas-2", "desc", "user-1");
        canvas2.setMetadata("{\"environmentId\":\"env-2\"}");

        when(canvasRepository.findAll()).thenReturn(List.of(canvas1, canvas2));
        when(serviceHealthRepository.findByEnvironmentId("env-1")).thenReturn(List.of(
                new ServiceHealth("srv-1", "env-1", "healthy", 5.0, 99.99)
        ));
        when(serviceHealthRepository.findByEnvironmentId("env-2")).thenReturn(List.of());
        when(alertRepository.findByStatus("OPEN")).thenReturn(List.of());

        var response = controller.listServiceMaps();
        var body = response.getBody();

        assertNotNull(body);
        assertEquals(2, body.size());
        assertEquals("healthy", body.get(0).status());
        assertEquals("unknown", body.get(1).status());
    }

    @Test
    void listServiceMaps_Empty_ShouldReturnEmptyList() {
        when(canvasRepository.findAll()).thenReturn(List.of());

        var response = controller.listServiceMaps();
        var body = response.getBody();

        assertNotNull(body);
        assertTrue(body.isEmpty());
    }

    private static CanvasNode createNode(Canvas canvas, String componentDef, double x, double y, String properties) {
        return new CanvasNode(canvas, componentDef, x, y, properties);
    }

    private static Alert createAlert(String envId, String severity, String message, String source) {
        return new Alert(envId, severity, message, source);
    }
}
