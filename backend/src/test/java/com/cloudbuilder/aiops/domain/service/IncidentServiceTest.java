package com.cloudbuilder.aiops.domain.service;

import com.cloudbuilder.aiops.domain.model.Incident;
import com.cloudbuilder.aiops.domain.port.IncidentRepository;
import com.cloudbuilder.aiops.domain.service.llm.LlmClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class IncidentServiceTest {

    @Mock
    private IncidentRepository incidentRepository;

    @Mock
    private LlmClient llmClient;

    private AIService aiService;

    private IncidentService incidentService;

    @BeforeEach
    void setUp() {
        aiService = new AIService(llmClient);
        incidentService = new IncidentService(incidentRepository, aiService);
    }

    @Test
    void createIncident_ShouldSaveAndReturn() {
        var incident = new Incident("env-1", "Alta latência", "Latência acima de 500ms", "warning");
        when(incidentRepository.save(any(Incident.class))).thenReturn(incident);

        var result = incidentService.createIncident("env-1", "Alta latência", "Latência acima de 500ms", "warning");

        assertNotNull(result);
        assertEquals("Alta latência", result.getTitle());
        assertEquals("warning", result.getSeverity());
        assertEquals("OPEN", result.getStatus());
        verify(incidentRepository).save(any(Incident.class));
    }

    @Test
    void getIncident_WhenFound_ShouldReturn() {
        var id = UUID.randomUUID().toString();
        var incident = new Incident("env-1", "Test", "Description", "critical");
        when(incidentRepository.findById(id)).thenReturn(Optional.of(incident));

        var result = incidentService.getIncident(id);

        assertNotNull(result);
        assertEquals("Test", result.getTitle());
    }

    @Test
    void getIncident_WhenNotFound_ShouldThrow() {
        var id = UUID.randomUUID().toString();
        when(incidentRepository.findById(id)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> incidentService.getIncident(id));
    }

    @Test
    void getIncidents_ShouldReturnOrderedList() {
        when(incidentRepository.findByEnvironmentIdOrderByDetectedAtDesc("env-1")).thenReturn(List.of(
            new Incident("env-1", "Incident 1", "Desc 1", "critical"),
            new Incident("env-1", "Incident 2", "Desc 2", "warning")
        ));

        var result = incidentService.getIncidents("env-1");

        assertEquals(2, result.size());
        verify(incidentRepository).findByEnvironmentIdOrderByDetectedAtDesc("env-1");
    }

    @Test
    void getIncidentsByStatus_ShouldFilterByStatus() {
        when(incidentRepository.findByStatus("OPEN")).thenReturn(List.of(
            new Incident("env-1", "Open incident", "Desc", "warning")
        ));

        var result = incidentService.getIncidentsByStatus("OPEN");

        assertEquals(1, result.size());
        verify(incidentRepository).findByStatus("OPEN");
    }

    @Test
    void resolveIncident_ShouldMarkResolved() {
        var id = UUID.randomUUID().toString();
        var incident = new Incident("env-1", "Test", "Desc", "critical");
        when(incidentRepository.findById(id)).thenReturn(Optional.of(incident));
        when(incidentRepository.save(any(Incident.class))).thenReturn(incident);

        var result = incidentService.resolveIncident(id);

        assertEquals("RESOLVED", result.getStatus());
        assertNotNull(result.getResolvedAt());
        verify(incidentRepository).save(incident);
    }

    @Test
    void analyzeIncident_ShouldClassifyAndSetRca() {
        var id = UUID.randomUUID().toString();
        var incident = new Incident("env-1", "Falha de rede", "Problema de conexão com banco de dados", "critical");
        when(incidentRepository.findById(id)).thenReturn(Optional.of(incident));
        when(incidentRepository.save(any(Incident.class))).thenReturn(incident);
        when(llmClient.generateRca(anyString(), anyString(), anyString(), anyMap(), anyList()))
                .thenReturn("RCA: Falha de infraestrutura detectada.");

        var result = incidentService.analyzeIncident(id);

        assertNotNull(result.getClassification());
        assertNotNull(result.getSuggestedRca());
        assertTrue(result.getSuggestedRca().contains("infraestrutura"));
        verify(incidentRepository).save(incident);
    }

    @Test
    void answerQuery_ShouldDelegateToAiService() {
        when(llmClient.chat(anyString(), anyString(), anyMap()))
                .thenReturn("Existem 3 incidente(s) ativos.");
        var result = incidentService.answerQuery("Quantos incidentes ativos?", "3");

        assertTrue(result.contains("3 incidente(s)"));
    }
}
