package com.cloudbuilder.design.domain.service;

import com.cloudbuilder.design.domain.model.Canvas;
import com.cloudbuilder.design.domain.port.CanvasRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import com.cloudbuilder.design.domain.event.CanvasCreatedEvent;
import org.mockito.ArgumentCaptor;

@ExtendWith(MockitoExtension.class)
class CanvasServiceTest {

    @Mock
    private CanvasRepository canvasRepository;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    private CanvasService canvasService;

    @BeforeEach
    void setUp() {
        canvasService = new CanvasService(canvasRepository, eventPublisher);
    }

    @Test
    void createCanvas_ShouldSaveAndReturnCanvas() {
        var canvas = new Canvas("tenant-1", "Test Canvas", "A test canvas", "user-1");
        when(canvasRepository.save(any(Canvas.class))).thenReturn(canvas);

        var result = canvasService.createCanvas("tenant-1", "Test Canvas", "A test canvas", "user-1");

        assertNotNull(result);
        assertEquals("Test Canvas", result.getName());
        assertEquals("tenant-1", result.getTenantId());
        verify(canvasRepository).save(any(Canvas.class));
        var captor = ArgumentCaptor.forClass(Object.class);
        verify(eventPublisher).publishEvent(captor.capture());
        assertInstanceOf(CanvasCreatedEvent.class, captor.getValue());
    }

    @Test
    void getCanvas_WhenFound_ShouldReturnCanvas() {
        var id = UUID.randomUUID();
        var canvas = new Canvas("tenant-1", "Test", "Desc", "user-1");
        when(canvasRepository.findById(id)).thenReturn(Optional.of(canvas));

        var result = canvasService.getCanvas(id);

        assertNotNull(result);
        assertEquals("Test", result.getName());
    }

    @Test
    void getCanvas_WhenNotFound_ShouldThrowException() {
        var id = UUID.randomUUID();
        when(canvasRepository.findById(id)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> canvasService.getCanvas(id));
    }

    @Test
    void deleteCanvas_ShouldDeleteExistingCanvas() {
        var id = UUID.randomUUID();
        var canvas = new Canvas("tenant-1", "Test", "Desc", "user-1");
        when(canvasRepository.findById(id)).thenReturn(Optional.of(canvas));

        canvasService.deleteCanvas(id);

        verify(canvasRepository).delete(canvas);
    }
}
