package com.cloudbuilder.aiops.domain.service;

import com.cloudbuilder.aiops.domain.model.Incident;
import com.cloudbuilder.aiops.domain.port.IncidentRepository;
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
class AIOpsServiceTest {

    @Mock
    private IncidentRepository incidentRepository;

    @Mock
    private AIService aiService;

    private AIOpsService service;

    @BeforeEach
    void setUp() {
        service = new AIOpsService(incidentRepository, aiService);
    }

    @Test
    void createIncident_ShouldSaveAndReturn() {
        var incident = new Incident("env1", "title", "desc", "critical");
        when(incidentRepository.save(any(Incident.class))).thenReturn(incident);

        var result = service.createIncident(incident);

        assertEquals("env1", result.getEnvironmentId());
        assertEquals("OPEN", result.getStatus());
        verify(incidentRepository).save(incident);
    }

    @Test
    void getIncidents_ShouldReturnOrderedList() {
        var incident = new Incident("env1", "title", "desc", "warning");
        when(incidentRepository.findByEnvironmentIdOrderByDetectedAtDesc("env1"))
                .thenReturn(List.of(incident));

        var result = service.getIncidents("env1");

        assertEquals(1, result.size());
        assertEquals("warning", result.get(0).getSeverity());
    }

    @Test
    void getIncident_WhenFound_ShouldReturn() {
        var id = UUID.randomUUID().toString();
        var incident = new Incident("env1", "title", "desc", "info");
        when(incidentRepository.findById(id)).thenReturn(Optional.of(incident));

        var result = service.getIncident(id);

        assertTrue(result.isPresent());
        assertEquals("title", result.get().getTitle());
    }

    @Test
    void getIncident_WhenNotFound_ShouldReturnEmpty() {
        when(incidentRepository.findById(any())).thenReturn(Optional.empty());

        var result = service.getIncident(UUID.randomUUID().toString());

        assertTrue(result.isEmpty());
    }

    @Test
    void classifyIncident_ShouldSetClassification() {
        var id = UUID.randomUUID().toString();
        var incident = new Incident("env1", "title", "desc", "critical");
        when(incidentRepository.findById(id)).thenReturn(Optional.of(incident));
        when(incidentRepository.save(incident)).thenAnswer(i -> i.getArgument(0));

        var result = service.classifyIncident(id, "rede");

        assertEquals("rede", result.getClassification());
        verify(incidentRepository).save(incident);
    }

    @Test
    void classifyIncident_WhenNotFound_ShouldThrow() {
        when(incidentRepository.findById(any())).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () ->
                service.classifyIncident(UUID.randomUUID().toString(), "rede"));
    }

    @Test
    void suggestRca_ShouldSetSuggestion() {
        var id = UUID.randomUUID().toString();
        var incident = new Incident("env1", "title", "desc", "critical");
        when(incidentRepository.findById(id)).thenReturn(Optional.of(incident));
        when(incidentRepository.save(incident)).thenAnswer(i -> i.getArgument(0));

        var result = service.suggestRca(id, "Check network connectivity");

        assertEquals("Check network connectivity", result.getSuggestedRca());
    }

    @Test
    void resolveIncident_ShouldSetResolved() {
        var id = UUID.randomUUID().toString();
        var incident = new Incident("env1", "title", "desc", "critical");
        when(incidentRepository.findById(id)).thenReturn(Optional.of(incident));
        when(incidentRepository.save(incident)).thenAnswer(i -> i.getArgument(0));

        var result = service.resolveIncident(id);

        assertEquals("RESOLVED", result.getStatus());
        assertNotNull(result.getResolvedAt());
    }

    @Test
    void analyzeIncident_ShouldUseAIService() {
        var id = UUID.randomUUID().toString();
        var incident = new Incident("env1", "title", "Network connection error", "critical");
        when(incidentRepository.findById(id)).thenReturn(Optional.of(incident));
        when(aiService.classifyIncident("Network connection error")).thenReturn("rede");
        when(aiService.analyzeIncident(incident)).thenReturn("Check network");
        when(incidentRepository.save(incident)).thenAnswer(i -> i.getArgument(0));

        var result = service.analyzeIncident(id);

        assertEquals("rede", result.getClassification());
        assertEquals("Check network", result.getSuggestedRca());
        verify(aiService).classifyIncident("Network connection error");
        verify(aiService).analyzeIncident(incident);
    }

    @Test
    void answerQuery_ShouldDelegateToAIService() {
        when(aiService.answerQuery(eq("question"), anyMap())).thenReturn("answer");

        var result = service.answerQuery("question", "context");

        assertEquals("answer", result);
        verify(aiService).answerQuery(eq("question"), anyMap());
    }
}
