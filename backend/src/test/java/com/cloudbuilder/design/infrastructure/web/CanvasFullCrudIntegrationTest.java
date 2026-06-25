package com.cloudbuilder.design.infrastructure.web;

import com.cloudbuilder.design.domain.model.Canvas;
import com.cloudbuilder.design.domain.model.CanvasEdge;
import com.cloudbuilder.design.domain.model.CanvasNode;
import com.cloudbuilder.design.domain.port.CanvasRepository;
import com.cloudbuilder.design.domain.service.CanvasService;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Full CRUD integration test using Testcontainers PostgreSQL.
 * Covers: create canvas → add node → add edge → validate → delete.
 * Disabled by default — requires a running Docker daemon.
 */
@SpringBootTest
@Testcontainers
@Disabled("Requires Docker")
@ActiveProfiles("test")
class CanvasFullCrudIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("cloudbuilder-test")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver");
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
        registry.add("spring.jpa.properties.hibernate.dialect", () -> "org.hibernate.dialect.PostgreSQLDialect");
        registry.add("spring.flyway.enabled", () -> "false");
        registry.add("spring.modulith.events.jpa.schema-initialization.enabled", () -> "false");
        // Disable security for test
        registry.add("cloudbuilder.security.jwt-secret", () -> "test-secret-key-for-integration-tests-at-least-32-chars!");
    }

    @Autowired
    private CanvasService canvasService;

    @Autowired
    private CanvasRepository canvasRepository;

    private String createdCanvasId;

    @Test
    @DisplayName("CRUD completo: criar canvas → adicionar nó → adicionar aresta → buscar → deletar")
    void testFullCanvasCrudCycle() {
        // ── 1. CREATE canvas ──
        Canvas canvas = canvasService.createCanvas(
                "tenant-integration",
                "Canvas Teste Integração",
                "Canvas criado para teste de integração full CRUD",
                "user-integration"
        );
        assertNotNull(canvas);
        assertNotNull(canvas.getId());
        assertEquals("Canvas Teste Integração", canvas.getName());
        assertEquals("tenant-integration", canvas.getTenantId());
        assertEquals(1, canvas.getDesignVersion());
        createdCanvasId = canvas.getId();

        // ── 2. ADD node ──
        String nodeProperties = "{\"instanceType\":\"t3.micro\",\"ami\":\"ami-12345\"}";
        CanvasNode node = canvasService.addNode(
                createdCanvasId,
                "aws-ec2",
                100.0,
                200.0,
                nodeProperties
        );
        assertNotNull(node);
        assertNotNull(node.getId());
        assertEquals("aws-ec2", node.getComponentDefinitionId());
        assertEquals(100.0, node.getPositionX());
        assertEquals(200.0, node.getPositionY());
        assertEquals(nodeProperties, node.getProperties());

        // Verify node is persisted in canvas
        Canvas withNode = canvasService.getCanvas(createdCanvasId);
        assertEquals(2, withNode.getDesignVersion()); // version incremented on node add
        assertEquals(1, withNode.getCanvasNodes().size());
        assertEquals("aws-ec2", withNode.getCanvasNodes().getFirst().getComponentDefinitionId());

        // ── 3. ADD second node ──
        CanvasNode node2 = canvasService.addNode(
                createdCanvasId,
                "aws-s3",
                300.0,
                400.0,
                "{\"bucketName\":\"my-test-bucket\"}"
        );
        assertNotNull(node2);
        Canvas withTwoNodes = canvasService.getCanvas(createdCanvasId);
        assertEquals(3, withTwoNodes.getDesignVersion());
        assertEquals(2, withTwoNodes.getCanvasNodes().size());

        // ── 4. ADD edge between nodes ──
        CanvasEdge edge = canvasService.addEdge(
                createdCanvasId,
                node.getId(),
                node2.getId(),
                "default",
                "{\"label\":\"conexao-teste\"}"
        );
        assertNotNull(edge);
        assertNotNull(edge.getId());
        assertEquals(node.getId(), edge.getSourceNodeId());
        assertEquals(node2.getId(), edge.getTargetNodeId());

        // Verify edge is persisted
        Canvas withEdge = canvasService.getCanvas(createdCanvasId);
        assertEquals(1, withEdge.getCanvasEdges().size());
        assertEquals(node.getId(), withEdge.getCanvasEdges().getFirst().getSourceNodeId());

        // ── 5. UPDATE node ──
        String updatedProperties = "{\"instanceType\":\"t3.large\",\"ami\":\"ami-67890\"}";
        CanvasNode updatedNode = canvasService.updateNode(createdCanvasId, node.getId(), updatedProperties);
        assertNotNull(updatedNode);
        assertEquals(updatedProperties, updatedNode.getProperties());

        Canvas afterUpdate = canvasService.getCanvas(createdCanvasId);
        assertEquals(updatedProperties,
                afterUpdate.getCanvasNodes().stream()
                        .filter(n -> n.getId().equals(node.getId()))
                        .findFirst()
                        .orElseThrow()
                        .getProperties());

        // ── 6. DELETE node ──
        canvasService.removeNode(createdCanvasId, node2.getId());
        Canvas afterNodeDelete = canvasService.getCanvas(createdCanvasId);
        assertEquals(1, afterNodeDelete.getCanvasNodes().size());
        assertEquals(0, afterNodeDelete.getCanvasNodes().stream()
                .filter(n -> n.getId().equals(node2.getId()))
                .count());

        // ── 7. DELETE canvas ──
        canvasService.deleteCanvas(createdCanvasId);
        assertThrows(RuntimeException.class, () -> canvasService.getCanvas(createdCanvasId));
    }

    @Test
    @DisplayName("Deve listar canvases por tenant")
    void testListCanvasesByTenant() {
        // Create canvases for two tenants
        Canvas c1 = canvasService.createCanvas("tenant-a", "Canvas A", "Desc A", "user-1");
        Canvas c2 = canvasService.createCanvas("tenant-a", "Canvas B", "Desc B", "user-2");
        Canvas c3 = canvasService.createCanvas("tenant-b", "Canvas C", "Desc C", "user-1");

        // List by tenant-a
        List<Canvas> tenantACanvases = canvasRepository.findByTenantIdOrderByUpdatedAtDesc("tenant-a");
        assertEquals(2, tenantACanvases.size());

        // List by tenant-b
        List<Canvas> tenantBCanvases = canvasRepository.findByTenantIdOrderByUpdatedAtDesc("tenant-b");
        assertEquals(1, tenantBCanvases.size());

        // Cleanup
        canvasService.deleteCanvas(c1.getId());
        canvasService.deleteCanvas(c2.getId());
        canvasService.deleteCanvas(c3.getId());
    }

    @Test
    @DisplayName("Deve falhar ao buscar canvas inexistente")
    void testGetNonExistentCanvas() {
        assertThrows(RuntimeException.class,
                () -> canvasService.getCanvas("non-existent-id"));
    }

    @Test
    @DisplayName("Deve falhar ao criar canvas com dados inválidos")
    void testCreateCanvasWithInvalidData() {
        assertThrows(Exception.class,
                () -> canvasService.createCanvas("", null, null, null));
    }
}
