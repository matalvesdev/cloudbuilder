package com.cloudbuilder.observe.infrastructure.web;

import com.cloudbuilder.design.domain.model.Canvas;
import com.cloudbuilder.design.domain.model.CanvasNode;
import com.cloudbuilder.design.domain.port.CanvasRepository;
import com.cloudbuilder.observe.domain.service.ScorecardHistoryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ScorecardControllerTest {

    @Mock private CanvasRepository canvasRepository;
    @Mock private ScorecardHistoryService historyService;

    private ScorecardController controller;

    @BeforeEach
    void setUp() {
        controller = new ScorecardController(canvasRepository, historyService);
    }

    @Test
    void getScorecard_WithFullHighAvailability_ShouldScoreHigh() {
        var canvas = createCanvas("test-canvas");
        canvas.addNode(nodeWithProps(canvas, "aws_db_instance",
                "{\"multi_az\":\"true\",\"replicas\":\"2\",\"encryption\":\"true\",\"auto_scaling\":\"true\",\"alarm\":\"true\",\"logging\":\"true\",\"Name\":\"db-prod\",\"tags\":\"production\"}"));
        canvas.addNode(nodeWithProps(canvas, "aws_alb", null));

        when(canvasRepository.findById("canvas-1")).thenReturn(Optional.of(canvas));

        var response = controller.getScorecard("canvas-1");
        var body = response.getBody();

        assertNotNull(body);
        assertEquals("test-canvas", body.canvasName());
        assertTrue(body.overallScore() > 0);
        assertTrue(body.scores().size() >= 6);
    }

    @Test
    void getScorecard_EmptyCanvas_ShouldScoreLow() {
        var canvas = createCanvas("empty-canvas");

        when(canvasRepository.findById("canvas-1")).thenReturn(Optional.of(canvas));

        var response = controller.getScorecard("canvas-1");
        var body = response.getBody();

        assertNotNull(body);
        assertEquals("initial", body.level());
        assertTrue(body.overallScore() < 20);
    }

    @Test
    void getScorecard_CanvasNotFound_ShouldThrow() {
        when(canvasRepository.findById("nonexistent")).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> controller.getScorecard("nonexistent"));
    }

    @Test
    void evaluateHighAvailability_WithMultiAzAndLoadBalancer_ShouldScore70() {
        var canvas = createCanvas("ha-test");
        canvas.addNode(nodeWithProps(canvas, "aws_db_instance", "{\"multi_az\":\"true\"}"));
        canvas.addNode(nodeWithProps(canvas, "aws_alb", null));

        when(canvasRepository.findById("canvas-1")).thenReturn(Optional.of(canvas));

        var body = controller.getScorecard("canvas-1").getBody();
        assertNotNull(body);

        var ha = body.scores().stream()
                .filter(s -> s.criterion().equals("Alta Disponibilidade"))
                .findFirst();
        assertTrue(ha.isPresent());
        assertEquals(70, ha.get().score());
        assertTrue(ha.get().suggestions().stream().anyMatch(s -> s.contains("réplicas")));
    }

    @Test
    void evaluateSecurity_WithEncryptionAndVpc_ShouldScore75() {
        var canvas = createCanvas("sec-test");
        canvas.addNode(nodeWithProps(canvas, "aws_vpc", null));
        canvas.addNode(nodeWithProps(canvas, "aws_db_instance", "{\"encryption\":\"true\"}"));

        when(canvasRepository.findById("canvas-1")).thenReturn(Optional.of(canvas));

        var body = controller.getScorecard("canvas-1").getBody();
        assertNotNull(body);

        var sec = body.scores().stream()
                .filter(s -> s.criterion().equals("Segurança"))
                .findFirst();
        assertTrue(sec.isPresent());
        assertEquals(75, sec.get().score());
    }

    @Test
    void evaluateCostOptimization_WithAutoScalingAndSpot_ShouldScore70() {
        var canvas = createCanvas("cost-test");
        canvas.addNode(nodeWithProps(canvas, "aws_instance", "{\"auto_scaling\":\"true\",\"spot\":\"true\"}"));

        when(canvasRepository.findById("canvas-1")).thenReturn(Optional.of(canvas));

        var body = controller.getScorecard("canvas-1").getBody();
        assertNotNull(body);

        var cost = body.scores().stream()
                .filter(s -> s.criterion().equals("Otimização de Custos"))
                .findFirst();
        assertTrue(cost.isPresent());
        assertEquals(70, cost.get().score());
    }

    @Test
    void evaluateScalability_WithAutoScalingAndCache_ShouldScore75() {
        var canvas = createCanvas("scale-test");
        canvas.addNode(nodeWithProps(canvas, "aws_ecs_cluster", "{\"auto_scaling\":\"true\"}"));
        canvas.addNode(nodeWithProps(canvas, "aws_elasticache_cluster", null));

        when(canvasRepository.findById("canvas-1")).thenReturn(Optional.of(canvas));

        var body = controller.getScorecard("canvas-1").getBody();
        assertNotNull(body);

        var scale = body.scores().stream()
                .filter(s -> s.criterion().equals("Escalabilidade"))
                .findFirst();
        assertTrue(scale.isPresent());
        assertEquals(75, scale.get().score());
    }

    @Test
    void evaluateObservability_WithMonitoringAndAlerts_ShouldScore70() {
        var canvas = createCanvas("obs-test");
        canvas.addNode(nodeWithProps(canvas, "aws_cloudwatch", null));
        canvas.addNode(nodeWithProps(canvas, "aws_instance", "{\"alarm\":\"true\"}"));

        when(canvasRepository.findById("canvas-1")).thenReturn(Optional.of(canvas));

        var body = controller.getScorecard("canvas-1").getBody();
        assertNotNull(body);

        var obs = body.scores().stream()
                .filter(s -> s.criterion().equals("Observabilidade"))
                .findFirst();
        assertTrue(obs.isPresent());
        assertEquals(70, obs.get().score());
    }

    @Test
    void evaluateDocumentation_WithTagsOnly_ShouldScore50() {
        var canvas = createCanvas("docs-test");
        canvas.addNode(nodeWithProps(canvas, "aws_instance", "{\"tags\":\"production\"}"));

        when(canvasRepository.findById("canvas-1")).thenReturn(Optional.of(canvas));

        var body = controller.getScorecard("canvas-1").getBody();
        assertNotNull(body);

        var docs = body.scores().stream()
                .filter(s -> s.criterion().equals("Documentação"))
                .findFirst();
        assertTrue(docs.isPresent());
        assertEquals(50, docs.get().score());
    }

    @Test
    void levelFromScore_ShouldReturnCorrectLevel() {
        var canvas = createCanvas("level-test");
        // Multiple criteria-satisfying nodes for platinum
        canvas.addNode(nodeWithProps(canvas, "aws_db_instance",
                "{\"multi_az\":\"true\",\"replicas\":\"2\",\"encryption\":\"true\",\"auto_scaling\":\"true\",\"alarm\":\"true\",\"logging\":\"true\",\"spot\":\"true\",\"cache\":\"true\",\"Name\":\"all-in-one\",\"tags\":\"production\"}"));
        canvas.addNode(nodeWithProps(canvas, "aws_lb", null));
        canvas.addNode(nodeWithProps(canvas, "aws_cloudwatch", null));

        when(canvasRepository.findById("canvas-1")).thenReturn(Optional.of(canvas));

        var body = controller.getScorecard("canvas-1").getBody();
        assertNotNull(body);
        assertTrue(body.overallScore() >= 55); // at least silver
    }

    private static Canvas createCanvas(String name) {
        return new Canvas("tenant-1", name, "desc", "user-1");
    }

    private static CanvasNode nodeWithProps(Canvas canvas, String componentDef, String properties) {
        return new CanvasNode(canvas, componentDef, 100, 100, properties);
    }
}
