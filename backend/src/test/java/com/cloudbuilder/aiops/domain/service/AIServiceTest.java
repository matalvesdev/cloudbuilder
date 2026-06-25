package com.cloudbuilder.aiops.domain.service;

import com.cloudbuilder.aiops.domain.model.Incident;
import com.cloudbuilder.aiops.domain.service.llm.LlmClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AIServiceTest {

    @Mock
    private LlmClient llmClient;

    private AIService aiService;

    @BeforeEach
    void setUp() {
        aiService = new AIService(llmClient);
    }

    @Test
    void classifyIncident_NetworkKeywords_ShouldReturnRede() {
        assertEquals("rede", aiService.classifyIncident("Problema de conexão com a rede"));
        assertEquals("rede", aiService.classifyIncident("Falha de network"));
        assertEquals("rede", aiService.classifyIncident("Erro de conexão"));
    }

    @Test
    void classifyIncident_SecurityKeywords_ShouldReturnSeguranca() {
        assertEquals("segurança", aiService.classifyIncident("Falha de segurança detectada"));
        assertEquals("segurança", aiService.classifyIncident("Erro de auth"));
        assertEquals("segurança", aiService.classifyIncident("Acesso negado"));
    }

    @Test
    void classifyIncident_DatabaseKeywords_ShouldReturnBancoDeDados() {
        assertEquals("banco de dados", aiService.classifyIncident("Erro no banco de dados"));
        assertEquals("banco de dados", aiService.classifyIncident("Query lenta no database"));
        assertEquals("banco de dados", aiService.classifyIncident("Falha sql detectada"));
    }

    @Test
    void classifyIncident_AppKeywords_ShouldReturnAplicacao() {
        assertEquals("aplicação", aiService.classifyIncident("Erro na aplicação"));
        assertEquals("aplicação", aiService.classifyIncident("Serviço indisponível"));
        assertEquals("aplicação", aiService.classifyIncident("Falha no app"));
    }

    @Test
    void classifyIncident_InfraKeywords_ShouldReturnInfraestrutura() {
        assertEquals("infraestrutura", aiService.classifyIncident("Falha de infraestrutura"));
        assertEquals("infraestrutura", aiService.classifyIncident("Servidor indisponível"));
        assertEquals("infraestrutura", aiService.classifyIncident("Instância EC2 parou"));
    }

    @Test
    void classifyIncident_Default_ShouldReturnGeral() {
        assertEquals("geral", aiService.classifyIncident("Mensagem desconhecida sem palavras chave"));
    }

    @Test
    void analyzeIncident_CriticalSeverity_ShouldReturnInfraRca() {
        var incident = new Incident("env1", "title", "desc", "critical");
        when(llmClient.generateRca(anyString(), anyString(), anyString(), anyMap(), anyList()))
                .thenReturn("RCA: Falha de infraestrutura detectada — verificar provedor cloud.");
        String rca = aiService.analyzeIncident(incident);
        assertTrue(rca.contains("infraestrutura") || rca.contains("provedor"));
    }

    @Test
    void analyzeIncident_WarningSeverity_ShouldReturnPerformanceRca() {
        var incident = new Incident("env1", "title", "desc", "warning");
        when(llmClient.generateRca(anyString(), anyString(), anyString(), anyMap(), anyList()))
                .thenReturn("Degradação de performance detectada.");
        String rca = aiService.analyzeIncident(incident);
        assertTrue(rca.contains("Degradação de performance") || rca.contains("performance"));
    }

    @Test
    void analyzeIncident_InfoSeverity_ShouldReturnInformationalRca() {
        var incident = new Incident("env1", "title", "desc", "info");
        when(llmClient.generateRca(anyString(), anyString(), anyString(), anyMap(), anyList()))
                .thenReturn("informativo: monitoramento contínuo recomendado.");
        String rca = aiService.analyzeIncident(incident);
        assertTrue(rca.contains("informativo") || rca.contains("informacional") || rca.contains("Monitorar"));
    }

    @Test
    void analyzeIncident_UnknownSeverity_ShouldReturnDefaultRca() {
        var incident = new Incident("env1", "title", "desc", "unknown");
        when(llmClient.generateRca(anyString(), anyString(), anyString(), anyMap(), anyList()))
                .thenReturn("Análise não conclusiva — dados insuficientes.");
        String rca = aiService.analyzeIncident(incident);
        assertTrue(rca.contains("Análise não conclusiva") || rca.contains("análise"));
    }

    @Test
    void answerQuery_IncidentQuestion_ShouldReturnIncidentResponse() {
        when(llmClient.chat(anyString(), anyString(), anyMap())).thenReturn("Existem 3 incidentes abertos.");
        String response = aiService.answerQuery("Quantos incidentes existem?", Map.of("incidentCount", "3"));
        assertTrue(response.contains("incidente") || response.contains("alerta"));
    }

    @Test
    void answerQuery_CostQuestion_ShouldReturnCostResponse() {
        when(llmClient.chat(anyString(), anyString(), anyMap())).thenReturn("Para otimizar custos, considere usar instâncias spot.");
        String response = aiService.answerQuery("Como otimizar custos?", Map.of());
        assertTrue(response.contains("custo") || response.contains("otimização") || response.contains("economia"));
    }

    @Test
    void answerQuery_HealthQuestion_ShouldReturnHealthResponse() {
        when(llmClient.chat(anyString(), anyString(), anyMap())).thenReturn("A saúde do sistema está estável.");
        String response = aiService.answerQuery("Qual a saúde do sistema?", Map.of());
        assertTrue(response.contains("saúde") || response.contains("health") || response.contains("estável") || response.contains("estavel"));
    }

    @Test
    void answerQuery_Default_ShouldReturnDefaultResponse() {
        when(llmClient.chat(anyString(), anyString(), anyMap())).thenReturn("Não foi possível responder com os dados disponíveis.");
        String response = aiService.answerQuery("Qual o clima hoje?", Map.of());
        assertTrue(response.contains("não foi possível") || response.contains("dados disponíveis"));
    }
}
