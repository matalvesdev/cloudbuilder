package com.cloudbuilder.design.domain.service;

import com.cloudbuilder.design.domain.model.Canvas;
import com.cloudbuilder.design.domain.model.CanvasEdge;
import com.cloudbuilder.design.domain.model.CanvasNode;
import com.cloudbuilder.design.domain.port.CanvasRepository;
import com.cloudbuilder.design.domain.validator.ValidationResult;
import com.cloudbuilder.design.domain.validator.ValidationRule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ValidationServiceTest {

    @Mock
    private CanvasRepository canvasRepository;

    @Mock
    private ValidationRule rule1;

    @Mock
    private ValidationRule rule2;

    private ValidationService service;

    private String canvasId;
    private Canvas canvas;

    @BeforeEach
    void setUp() {
        service = new ValidationService(canvasRepository, List.of(rule1, rule2));
        canvasId = UUID.randomUUID().toString();
        canvas = new Canvas("tenant1", "test-canvas", "desc", "user1");
    }

    @Test
    void validateCanvas_WhenCanvasNotFound_ShouldThrow() {
        when(canvasRepository.findById(canvasId)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> service.validateCanvas(canvasId));
    }

    @Test
    void validateCanvas_WhenAllRulesPass_ShouldReturnValid() {
        when(canvasRepository.findById(canvasId)).thenReturn(Optional.of(canvas));
        // No edges in canvas, so no edge stubbings needed

        var report = service.validateCanvas(canvasId);

        assertEquals(canvasId, report.canvasId());
        assertEquals("VALID", report.status().name());
        assertTrue(report.issues().isEmpty());
    }

    @Test
    void validateCanvas_WithNodeErrorIssues_ShouldReturnInvalid() {
        canvas.addNode(new CanvasNode(canvas, "aws_vpc", 0, 0, "{}"));

        when(canvasRepository.findById(canvasId)).thenReturn(Optional.of(canvas));
        when(rule1.validate(any(Canvas.class), any(CanvasNode.class)))
                .thenReturn(new ValidationResult("cidr-overlap", false,
                        ValidationResult.Severity.ERROR, "CIDR overlap detected", "node-1"));
        when(rule2.validate(any(Canvas.class), any(CanvasNode.class)))
                .thenReturn(new ValidationResult("rule2", true, ValidationResult.Severity.INFO, "", ""));

        var report = service.validateCanvas(canvasId);

        assertEquals("INVALID", report.status().name());
        assertFalse(report.issues().isEmpty());
        assertEquals("ERROR", report.issues().get(0).severity());
    }

    @Test
    void validateCanvas_WithWarningIssuesOnly_ShouldReturnWarnings() {
        canvas.addNode(new CanvasNode(canvas, "aws_vpc", 0, 0, "{}"));

        when(canvasRepository.findById(canvasId)).thenReturn(Optional.of(canvas));
        when(rule1.validate(any(Canvas.class), any(CanvasNode.class)))
                .thenReturn(new ValidationResult("name-convention", false,
                        ValidationResult.Severity.WARNING, "Naming convention violation", "node-1"));
        when(rule2.validate(any(Canvas.class), any(CanvasNode.class)))
                .thenReturn(new ValidationResult("rule2", true, ValidationResult.Severity.INFO, "", ""));

        var report = service.validateCanvas(canvasId);

        assertEquals("WARNINGS", report.status().name());
        assertEquals(1, report.issues().size());
        assertEquals("WARNING", report.issues().get(0).severity());
    }

    @Test
    void validateCanvas_WithEdgeIssues_ShouldInclude() {
        var sourceNode = new CanvasNode(canvas, "aws_vpc", 0, 0, "{}");
        var targetNode = new CanvasNode(canvas, "aws_subnet", 10, 10, "{}");
        canvas.addNode(sourceNode);
        canvas.addNode(targetNode);
        canvas.addEdge(new CanvasEdge(canvas, sourceNode.getId(), targetNode.getId(), "connection", null));

        when(canvasRepository.findById(canvasId)).thenReturn(Optional.of(canvas));
        when(rule1.validate(any(Canvas.class), any(CanvasNode.class)))
                .thenReturn(new ValidationResult("rule1", true, ValidationResult.Severity.INFO, "", ""));
        when(rule2.validate(any(Canvas.class), any(CanvasNode.class)))
                .thenReturn(new ValidationResult("rule2", true, ValidationResult.Severity.INFO, "", ""));
        when(rule1.validate(any(Canvas.class), any(CanvasEdge.class)))
                .thenReturn(new ValidationResult("compatibility", false,
                        ValidationResult.Severity.ERROR, "Incompatible edge", "edge-1"));
        when(rule2.validate(any(Canvas.class), any(CanvasEdge.class)))
                .thenReturn(new ValidationResult("rule2", true, ValidationResult.Severity.INFO, "", ""));

        var report = service.validateCanvas(canvasId);

        assertEquals("INVALID", report.status().name());
        assertEquals(1, report.issues().size());
        assertEquals("edge-1", report.issues().get(0).componentId());
    }
}
