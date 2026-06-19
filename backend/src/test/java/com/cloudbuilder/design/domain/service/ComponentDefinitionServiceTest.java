package com.cloudbuilder.design.domain.service;

import com.cloudbuilder.design.domain.model.ComponentDefinition;
import com.cloudbuilder.design.domain.port.ComponentDefinitionRepository;
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
class ComponentDefinitionServiceTest {

    @Mock
    private ComponentDefinitionRepository repository;

    private ComponentDefinitionService service;

    @BeforeEach
    void setUp() {
        service = new ComponentDefinitionService(repository);
    }

    private ComponentDefinition createDef(String provider, String resourceType, String category, boolean active) {
        return new ComponentDefinition(provider, resourceType, category,
                "Display", "A test definition", null,
                null, null, null, null, null, active);
    }

    @Test
    void createDefinition_ShouldSaveAndReturn() {
        var def = createDef("aws", "aws_vpc", "network", true);
        when(repository.save(any(ComponentDefinition.class))).thenReturn(def);

        var result = service.createDefinition(def);

        assertEquals("aws_vpc", result.getResourceType());
        assertEquals("aws", result.getProvider());
        verify(repository).save(def);
    }

    @Test
    void getDefinition_WhenFound_ShouldReturn() {
        var id = UUID.randomUUID().toString();
        var def = createDef("aws", "aws_vpc", "network", true);
        when(repository.findById(id)).thenReturn(Optional.of(def));

        var result = service.getDefinition(id);

        assertEquals("aws_vpc", result.getResourceType());
    }

    @Test
    void getDefinition_WhenNotFound_ShouldThrow() {
        when(repository.findById(any())).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> service.getDefinition(UUID.randomUUID().toString()));
    }

    @Test
    void getDefinitionByResourceType_WhenFound_ShouldReturn() {
        var def = createDef("aws", "aws_vpc", "network", true);
        when(repository.findByResourceType("aws_vpc")).thenReturn(Optional.of(def));

        var result = service.getDefinitionByResourceType("aws_vpc");

        assertEquals("aws", result.getProvider());
    }

    @Test
    void getDefinitionByResourceType_WhenNotFound_ShouldThrow() {
        when(repository.findByResourceType("unknown")).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> service.getDefinitionByResourceType("unknown"));
    }

    @Test
    void listDefinitions_WithProviderAndCategory_ShouldFilter() {
        var def1 = createDef("aws", "aws_vpc", "network", true);
        var def2 = createDef("aws", "aws_subnet", "network", true);
        var def3 = createDef("aws", "aws_s3_bucket", "storage", true);
        when(repository.findByProvider("aws")).thenReturn(List.of(def1, def2, def3));

        var result = service.listDefinitions("aws", "network");

        assertEquals(2, result.size());
        assertTrue(result.stream().allMatch(d -> "network".equals(d.getCategory())));
    }

    @Test
    void listDefinitions_WithProviderOnly_ShouldReturnAllForProvider() {
        var def1 = createDef("aws", "aws_vpc", "network", true);
        var def2 = createDef("aws", "aws_subnet", "network", true);
        when(repository.findByProvider("aws")).thenReturn(List.of(def1, def2));

        var result = service.listDefinitions("aws", null);

        assertEquals(2, result.size());
    }

    @Test
    void listDefinitions_WithCategoryOnly_ShouldReturnAllForCategory() {
        var def1 = createDef("aws", "aws_vpc", "network", true);
        var def2 = createDef("gcp", "gcp_vpc", "network", true);
        when(repository.findByCategory("network")).thenReturn(List.of(def1, def2));

        var result = service.listDefinitions(null, "network");

        assertEquals(2, result.size());
    }

    @Test
    void listDefinitions_WithNoFilters_ShouldReturnAll() {
        var def1 = createDef("aws", "aws_vpc", "network", true);
        var def2 = createDef("gcp", "gcp_vpc", "network", true);
        when(repository.findAll()).thenReturn(List.of(def1, def2));

        var result = service.listDefinitions(null, null);

        assertEquals(2, result.size());
    }

    @Test
    void getAllActiveDefinitions_ShouldReturnActive() {
        var def = createDef("aws", "aws_vpc", "network", true);
        when(repository.findByIsActiveTrue()).thenReturn(List.of(def));

        var result = service.getAllActiveDefinitions();

        assertEquals(1, result.size());
        assertTrue(result.get(0).isActive());
    }

    @Test
    void deleteDefinition_ShouldDeleteExisting() {
        var id = UUID.randomUUID().toString();
        var def = createDef("aws", "aws_vpc", "network", true);
        when(repository.findById(id)).thenReturn(Optional.of(def));
        doNothing().when(repository).delete(def);

        service.deleteDefinition(id);

        verify(repository).delete(def);
    }

    @Test
    void deleteDefinition_WhenNotFound_ShouldThrow() {
        when(repository.findById(any())).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> service.deleteDefinition(UUID.randomUUID().toString()));
    }
}
