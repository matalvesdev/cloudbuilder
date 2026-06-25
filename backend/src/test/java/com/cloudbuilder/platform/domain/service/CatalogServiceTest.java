package com.cloudbuilder.platform.domain.service;

import com.cloudbuilder.platform.domain.model.CatalogItem;
import com.cloudbuilder.platform.domain.port.CatalogItemRepository;
import com.cloudbuilder.platform.domain.port.CatalogItemVersionRepository;
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
class CatalogServiceTest {

    @Mock
    private CatalogItemRepository repository;

    @Mock
    private CatalogItemVersionRepository versionRepository;

    private CatalogService catalogService;

    @BeforeEach
    void setUp() {
        catalogService = new CatalogService(repository, versionRepository);
    }

    @Test
    void createItem_ShouldSaveAndReturn() {
        var item = new CatalogItem("VPC", "network", "AWS VPC template", "{}", "1.0");
        when(repository.save(any(CatalogItem.class))).thenReturn(item);

        var result = catalogService.createItem(item);

        assertNotNull(result);
        assertEquals("VPC", result.getName());
        assertEquals("network", result.getType());
        verify(repository).save(item);
    }

    @Test
    void listItems_WithoutType_ShouldReturnAll() {
        when(repository.findAll()).thenReturn(List.of(
            new CatalogItem("VPC", "network", "VPC template", "{}", "1.0"),
            new CatalogItem("RDS", "database", "RDS template", "{}", "1.0")
        ));

        var result = catalogService.listItems(null);

        assertEquals(2, result.size());
        verify(repository).findAll();
    }

    @Test
    void listItems_WithType_ShouldFilterByType() {
        when(repository.findByType("network")).thenReturn(List.of(
            new CatalogItem("VPC", "network", "VPC template", "{}", "1.0")
        ));

        var result = catalogService.listItems("network");

        assertEquals(1, result.size());
        assertEquals("VPC", result.getFirst().getName());
        verify(repository).findByType("network");
    }

    @Test
    void getItem_WhenFound_ShouldReturnItem() {
        var id = UUID.randomUUID().toString();
        var item = new CatalogItem("VPC", "network", "VPC template", "{}", "1.0");
        when(repository.findById(id)).thenReturn(Optional.of(item));

        var result = catalogService.getItem(id);

        assertNotNull(result);
        assertEquals("VPC", result.getName());
    }

    @Test
    void getItem_WhenNotFound_ShouldThrow() {
        var id = UUID.randomUUID().toString();
        when(repository.findById(id)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> catalogService.getItem(id));
    }

    @Test
    void updateItem_ShouldUpdateMetadataAndBumpVersion() {
        var id = UUID.randomUUID().toString();
        var item = new CatalogItem("VPC", "network", "VPC template", "{}", "1.0");
        when(repository.findById(id)).thenReturn(Optional.of(item));
        when(repository.save(any(CatalogItem.class))).thenReturn(item);

        var result = catalogService.updateItem(id, "VPC Updated", "Updated VPC template", "{\"new\":\"schema\"}");

        assertEquals("VPC Updated", result.getName());
        assertEquals("Updated VPC template", result.getDescription());
        verify(repository).save(item);
    }

    @Test
    void deleteItem_ShouldDeleteById() {
        var id = UUID.randomUUID().toString();

        catalogService.deleteItem(id);

        verify(repository).deleteById(id);
    }
}
