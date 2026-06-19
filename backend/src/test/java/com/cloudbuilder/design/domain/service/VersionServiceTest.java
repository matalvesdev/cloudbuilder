package com.cloudbuilder.design.domain.service;

import com.cloudbuilder.design.domain.model.Canvas;
import com.cloudbuilder.design.domain.model.CanvasEdge;
import com.cloudbuilder.design.domain.model.CanvasNode;
import com.cloudbuilder.design.domain.model.CanvasVersion;
import com.cloudbuilder.design.domain.port.CanvasRepository;
import com.cloudbuilder.design.domain.port.CanvasVersionRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
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
class VersionServiceTest {

    @Mock
    private CanvasRepository canvasRepository;

    @Mock
    private CanvasVersionRepository versionRepository;

    private ObjectMapper objectMapper;
    private VersionService service;

    private String canvasId;
    private Canvas canvas;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        service = new VersionService(canvasRepository, versionRepository, objectMapper);
        canvasId = UUID.randomUUID().toString();
        canvas = new Canvas("tenant1", "test-canvas", "desc", "user1");
    }

    @Test
    void createVersion_ShouldSaveNewVersion() {
        var version = new CanvasVersion(canvasId, 1, "{}", "Initial version", "user1");
        when(canvasRepository.findById(canvasId)).thenReturn(Optional.of(canvas));
        when(versionRepository.findTopByCanvasIdOrderByVersionDesc(canvasId))
                .thenReturn(Optional.empty());
        when(versionRepository.save(any(CanvasVersion.class))).thenReturn(version);

        var result = service.createVersion(canvasId, "Initial version", "user1");

        assertEquals(1, result.getVersion());
        assertEquals("Initial version", result.getChangeDescription());
        verify(versionRepository).save(any(CanvasVersion.class));
    }

    @Test
    void createVersion_WhenCanvasNotFound_ShouldThrow() {
        when(canvasRepository.findById(canvasId)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () ->
                service.createVersion(canvasId, "desc", "user1"));
    }

    @Test
    void createVersion_WithExistingVersions_ShouldIncrement() {
        var existingVersion = new CanvasVersion(canvasId, 2, "{}", "Previous", "user1");
        when(canvasRepository.findById(canvasId)).thenReturn(Optional.of(canvas));
        when(versionRepository.findTopByCanvasIdOrderByVersionDesc(canvasId))
                .thenReturn(Optional.of(existingVersion));

        var newVersion = new CanvasVersion(canvasId, 3, "{}", "New version", "user1");
        when(versionRepository.save(any(CanvasVersion.class))).thenReturn(newVersion);

        var result = service.createVersion(canvasId, "New version", "user1");

        // Verify save was called with a CanvasVersion that has version=3
        verify(versionRepository).save(argThat(v -> v.getVersion() == 3));
    }

    @Test
    void getVersions_ShouldReturnOrderedList() {
        var v1 = new CanvasVersion(canvasId, 2, "{}", "v2", "user1");
        var v2 = new CanvasVersion(canvasId, 1, "{}", "v1", "user1");
        when(versionRepository.findByCanvasIdOrderByVersionDesc(canvasId))
                .thenReturn(List.of(v1, v2));

        var result = service.getVersions(canvasId);

        assertEquals(2, result.size());
        assertEquals(2, result.get(0).getVersion());
    }

    @Test
    void getVersion_WhenFound_ShouldReturn() {
        var version = new CanvasVersion(canvasId, 1, "{}", "Initial", "user1");
        when(versionRepository.findByCanvasIdAndVersion(canvasId, 1))
                .thenReturn(Optional.of(version));

        var result = service.getVersion(canvasId, 1);

        assertEquals(1, result.getVersion());
    }

    @Test
    void getVersion_WhenNotFound_ShouldThrow() {
        when(versionRepository.findByCanvasIdAndVersion(canvasId, 99))
                .thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> service.getVersion(canvasId, 99));
    }

    @Test
    void rollbackToVersion_ShouldRestoreAndCreateVersion() {
        var initialState = "{\"nodes\":[],\"edges\":[]}";
        var version = new CanvasVersion(canvasId, 1, initialState, "Initial", "user1");

        when(versionRepository.findByCanvasIdAndVersion(canvasId, 1))
                .thenReturn(Optional.of(version));
        when(canvasRepository.findById(canvasId)).thenReturn(Optional.of(canvas));
        when(versionRepository.findTopByCanvasIdOrderByVersionDesc(canvasId))
                .thenReturn(Optional.of(new CanvasVersion(canvasId, 1, "{}", "v1", "user1")));
        when(canvasRepository.save(any(Canvas.class))).thenAnswer(i -> i.getArgument(0));
        when(versionRepository.save(any(CanvasVersion.class))).thenAnswer(i -> i.getArgument(0));

        var result = service.rollbackToVersion(canvasId, 1);

        assertNotNull(result);
        assertEquals(2, result.getDesignVersion()); // incremented
    }

    @Test
    void getLatestVersion_WhenPresent_ShouldReturn() {
        var version = new CanvasVersion(canvasId, 3, "{}", "Latest", "user1");
        when(versionRepository.findTopByCanvasIdOrderByVersionDesc(canvasId))
                .thenReturn(Optional.of(version));

        var result = service.getLatestVersion(canvasId);

        assertTrue(result.isPresent());
        assertEquals(3, result.get().getVersion());
    }

    @Test
    void getLatestVersion_WhenAbsent_ShouldReturnEmpty() {
        when(versionRepository.findTopByCanvasIdOrderByVersionDesc(canvasId))
                .thenReturn(Optional.empty());

        var result = service.getLatestVersion(canvasId);

        assertTrue(result.isEmpty());
    }

    @Test
    void diffVersions_WithSameSnapshots_ShouldReturnEmptyDiffs() {
        var snapshot = "{\"nodes\":[],\"edges\":[]}";
        var v1 = new CanvasVersion(canvasId, 1, snapshot, "v1", "user1");
        var v2 = new CanvasVersion(canvasId, 2, snapshot, "v2", "user1");
        when(versionRepository.findByCanvasIdAndVersion(canvasId, 1))
                .thenReturn(Optional.of(v1));
        when(versionRepository.findByCanvasIdAndVersion(canvasId, 2))
                .thenReturn(Optional.of(v2));

        var diff = service.diffVersions(canvasId, 1, 2);

        assertEquals(canvasId, diff.canvasId());
        assertTrue(diff.nodesAdded().isEmpty());
        assertTrue(diff.nodesRemoved().isEmpty());
        assertTrue(diff.nodesModified().isEmpty());
        assertTrue(diff.edgesAdded().isEmpty());
        assertTrue(diff.edgesRemoved().isEmpty());
    }

    @Test
    void diffVersions_WithChanges_ShouldDetectDifferences() {
        var snapshot1 = "{\"nodes\":[{\"id\":\"node-1\",\"componentDefinitionId\":\"aws_vpc\"," +
                "\"positionX\":0,\"positionY\":0}],\"edges\":[]}";
        var snapshot2 = "{\"nodes\":[{\"id\":\"node-1\",\"componentDefinitionId\":\"aws_vpc\"," +
                "\"positionX\":10,\"positionY\":10}],\"edges\":[]}";
        var v1 = new CanvasVersion(canvasId, 1, snapshot1, "v1", "user1");
        var v2 = new CanvasVersion(canvasId, 2, snapshot2, "v2", "user1");
        when(versionRepository.findByCanvasIdAndVersion(canvasId, 1))
                .thenReturn(Optional.of(v1));
        when(versionRepository.findByCanvasIdAndVersion(canvasId, 2))
                .thenReturn(Optional.of(v2));

        var diff = service.diffVersions(canvasId, 1, 2);

        assertEquals(1, diff.nodesModified().size());
    }
}
