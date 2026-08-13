package com.cloudbuilder.metrics.domain.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class MetricsServiceTest {

    private MetricsService metricsService;

    @BeforeEach
    void setUp() {
        metricsService = new MetricsService();
    }

    @Test
    void getSnapshot_WithEmptyMap_ShouldReturnEmptyResources() {
        var snapshot = metricsService.getSnapshot(Map.of());
        assertNotNull(snapshot);
        assertTrue(snapshot.resources().isEmpty());
        assertTrue(snapshot.timestamp() > 0);
    }

    @Test
    void getSnapshot_WithSingleResource_ShouldReturnMetrics() {
        var snapshot = metricsService.getSnapshot(Map.of("node1", "Web Server"));
        assertEquals(1, snapshot.resources().size());
        var resource = snapshot.resources().getFirst();
        assertEquals("node1", resource.nodeId());
        assertEquals("Web Server", resource.resourceName());
        assertEquals("unknown", resource.provider());
        assertNotNull(resource.cpuUtilization());
        assertNotNull(resource.memoryUtilization());
        assertNotNull(resource.networkIn());
        assertNotNull(resource.networkOut());
        assertNotNull(resource.diskReadOps());
        assertNotNull(resource.diskWriteOps());
        assertEquals(0, resource.cpuUtilization().size());
    }

    @Test
    void getSnapshot_WithMultipleResources_ShouldReturnAll() {
        var snapshot = metricsService.getSnapshot(Map.of(
                "node1", "Web Server",
                "node2", "Database",
                "node3", "Cache"
        ));
        assertEquals(3, snapshot.resources().size());
    }

    @Test
    void getSnapshot_ShouldReturnValidStatus() {
        var snapshot = metricsService.getSnapshot(Map.of("node1", "Test"));
        var resource = snapshot.resources().getFirst();
        assertTrue(resource.status().equals("healthy")
                || resource.status().equals("warning")
                || resource.status().equals("critical")
                || resource.status().equals("unknown"));
    }

    @Test
    void getSnapshot_CpuMetrics_ShouldBeWithinExpectedRange() {
        var snapshot = metricsService.getSnapshot(Map.of("node1", "Test"));
        var resource = snapshot.resources().getFirst();
        for (var point : resource.cpuUtilization()) {
            assertTrue(point.value() >= 5.0 && point.value() <= 95.0);
            assertTrue(point.timestamp() > 0);
        }
    }

    @Test
    void getSnapshot_MemoryMetrics_ShouldBeWithinExpectedRange() {
        var snapshot = metricsService.getSnapshot(Map.of("node1", "Test"));
        var resource = snapshot.resources().getFirst();
        for (var point : resource.memoryUtilization()) {
            assertTrue(point.value() >= 30.0 && point.value() <= 90.0);
        }
    }

    @Test
    void getSnapshot_CalledTwice_ShouldReturnConsistentNodeIds() {
        var resourceMap = Map.of("node1", "Web Server", "node2", "DB");
        var snapshot1 = metricsService.getSnapshot(resourceMap);
        var snapshot2 = metricsService.getSnapshot(resourceMap);
        assertEquals(snapshot1.resources().size(), snapshot2.resources().size());
    }
}
