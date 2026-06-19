package com.cloudbuilder.observability.domain.service;

import com.cloudbuilder.observability.application.dto.DashboardDTO;
import com.cloudbuilder.observability.domain.model.DashboardEntity;
import com.cloudbuilder.observability.domain.port.DashboardRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock
    private DashboardRepository repository;

    private DashboardService dashboardService;

    @BeforeEach
    void setUp() {
        dashboardService = new DashboardService(repository);
    }

    @Test
    void getDashboards_ShouldReturnList() {
        var entity = new DashboardEntity();
        entity.setId(UUID.randomUUID().toString());
        entity.setName("My Dashboard");
        entity.setDescription("Desc");
        entity.setDefinition("{}");
        entity.setDefault(true);
        when(repository.findByTenantId("tenant-1")).thenReturn(List.of(entity));

        var result = dashboardService.getDashboards("tenant-1");

        assertEquals(1, result.size());
        assertEquals("My Dashboard", result.getFirst().name());
    }

    @Test
    void getDashboards_WhenEmpty_ShouldReturnEmpty() {
        when(repository.findByTenantId("tenant-1")).thenReturn(List.of());

        var result = dashboardService.getDashboards("tenant-1");

        assertTrue(result.isEmpty());
    }

    @Test
    void createDashboard_ShouldSaveAndReturn() {
        var dto = new DashboardDTO(null, "New Dash", "Desc", "{}", false);
        when(repository.save(any(DashboardEntity.class))).thenAnswer(i -> {
            var e = i.getArgument(0, DashboardEntity.class);
            e.setId(UUID.randomUUID().toString());
            return e;
        });

        var result = dashboardService.createDashboard(dto);

        assertNotNull(result);
        assertEquals("New Dash", result.name());
        verify(repository).save(any(DashboardEntity.class));
    }

    @Test
    void deleteDashboard_ShouldCallDelete() {
        var id = UUID.randomUUID().toString();
        dashboardService.deleteDashboard(id);
        verify(repository).deleteById(id);
    }
}
