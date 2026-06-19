package com.cloudbuilder.aiops.domain.service;

import com.cloudbuilder.aiops.domain.model.Incident;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class AIServiceTest {

    private AIService aiService;

    @BeforeEach
    void setUp() {
        aiService = new AIService();
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
        String rca = aiService.analyzeIncident(incident);
        assertTrue(rca.contains("infraestrutura") || rca.contains("provedor"));
    }

    @Test
    void analyzeIncident_WarningSeverity_ShouldReturnPerformanceRca() {
        var incident = new Incident("env1", "title", "desc", "warning");
        String rca = aiService.analyzeIncident(incident);
        assertTrue(rca.contains("Degradação de performance") || rca.contains("performance"));
    }

    @Test
    void analyzeIncident_InfoSeverity_ShouldReturnInformationalRca() {
        var incident = new Incident("env1", "title", "desc", "info");
        String rca = aiService.analyzeIncident(incident);
        assertTrue(rca.contains("informativo") || rca.contains("informacional") || rca.contains("Monitorar"));
    }

    @Test
    void analyzeIncident_UnknownSeverity_ShouldReturnDefaultRca() {
        var incident = new Incident("env1", "title", "desc", "unknown");
        String rca = aiService.analyzeIncident(incident);
        assertTrue(rca.contains("Análise não conclusiva") || rca.contains("análise"));
    }

    @Test
    void answerQuery_IncidentQuestion_ShouldReturnIncidentResponse() {
        String response = aiService.answerQuery("Quantos incidentes existem?", "3");
        assertTrue(response.contains("incidente") || response.contains("alerta"));
    }

    @Test
    void answerQuery_CostQuestion_ShouldReturnCostResponse() {
        String response = aiService.answerQuery("Como otimizar custos?", "");
        assertTrue(response.contains("custo") || response.contains("otimização") || response.contains("economia"));
    }

    @Test
    void answerQuery_HealthQuestion_ShouldReturnHealthResponse() {
        String response = aiService.answerQuery("Qual a saúde do sistema?", "");
        assertTrue(response.contains("saúde") || response.contains("health") || response.contains("estável") || response.contains("estavel"));
    }

    @Test
    void answerQuery_Default_ShouldReturnDefaultResponse() {
        String response = aiService.answerQuery("Qual o clima hoje?", "");
        assertTrue(response.contains("não foi possível") || response.contains("dados disponíveis"));
    }
}
