package com.cloudbuilder.observability.domain.service;

import com.cloudbuilder.observability.domain.model.IncidentEntity;
import com.cloudbuilder.observability.domain.port.ObserveIncidentRepository;
import com.cloudbuilder.observability.domain.port.IncidentTimelineRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class IncidentServiceTest {

    @Mock
    private ObserveIncidentRepository incidentRepository;

    @Mock
    private IncidentTimelineRepository timelineRepository;

    private IncidentService incidentService;

    @BeforeEach
    void setUp() {
        incidentService = new IncidentService(incidentRepository, timelineRepository);
    }

    private IncidentEntity createIncident(String id, String status) {
        var entity = new IncidentEntity(UUID.randomUUID().toString(), "t1", "Test Incident", "Desc", "CRITICAL", 95.0, 90.0);
        entity.setId(id);
        entity.setStatus(status);
        return entity;
    }

    @Test
    void acknowledge_ShouldUpdateStatus() {
        var id = UUID.randomUUID().toString();
        var incident = createIncident(id, "OPEN");
        when(incidentRepository.findById(id)).thenReturn(Optional.of(incident));
        when(incidentRepository.save(any(IncidentEntity.class))).thenAnswer(i -> i.getArgument(0));

        var result = incidentService.acknowledge(id);

        assertEquals("ACKNOWLEDGED", result.status());
        assertNotNull(result.acknowledgedAt());
        verify(incidentRepository).save(incident);
    }

    @Test
    void acknowledge_WhenNotFound_ShouldThrow() {
        var id = UUID.randomUUID().toString();
        when(incidentRepository.findById(id)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> incidentService.acknowledge(id));
    }

    @Test
    void resolve_ShouldUpdateStatus() {
        var id = UUID.randomUUID().toString();
        var incident = createIncident(id, "ACKNOWLEDGED");
        when(incidentRepository.findById(id)).thenReturn(Optional.of(incident));
        when(incidentRepository.save(any(IncidentEntity.class))).thenAnswer(i -> i.getArgument(0));

        var result = incidentService.resolve(id);

        assertEquals("RESOLVED", result.status());
        assertNotNull(result.resolvedAt());
    }

    @Test
    void resolve_WhenNotFound_ShouldThrow() {
        var id = UUID.randomUUID().toString();
        when(incidentRepository.findById(id)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> incidentService.resolve(id));
    }

    @Test
    void getActiveIncidents_ShouldReturnOpenOnly() {
        var incident = createIncident(UUID.randomUUID().toString(), "OPEN");
        when(incidentRepository.findByTenantIdAndStatus("t1", "OPEN")).thenReturn(List.of(incident));

        var result = incidentService.getActiveIncidents("t1");

        assertEquals(1, result.size());
        assertEquals("OPEN", result.getFirst().status());
    }

    @Test
    void getIncidentsByStatus_ShouldFilterByStatus() {
        var incident = createIncident(UUID.randomUUID().toString(), "RESOLVED");
        when(incidentRepository.findByTenantIdAndStatus("t1", "RESOLVED")).thenReturn(List.of(incident));

        var result = incidentService.getIncidentsByStatus("t1", "RESOLVED");

        assertEquals(1, result.size());
        assertEquals("RESOLVED", result.getFirst().status());
    }
}
