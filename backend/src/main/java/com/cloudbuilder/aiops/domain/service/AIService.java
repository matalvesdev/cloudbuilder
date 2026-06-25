package com.cloudbuilder.aiops.domain.service;

import com.cloudbuilder.aiops.domain.model.Incident;
import com.cloudbuilder.aiops.domain.service.llm.LlmClient;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * AI service that delegates to the configured LLM client.
 * Supports OpenAI, Anthropic, or rule-based fallback.
 *
 * TIER 0 references:
 *   - https://platform.openai.com/docs/api-reference/chat
 *   - https://docs.anthropic.com/en/api/messages
 */
@Service
public class AIService {

    private static final Map<String, String> CLASSIFICATION_TEMPLATES = Map.of(
        "infra", "infraestrutura",
        "network", "rede",
        "security", "segurança",
        "app", "aplicação",
        "database", "banco de dados",
        "default", "geral"
    );

    private final LlmClient llmClient;

    public AIService(LlmClient llmClient) {
        this.llmClient = llmClient;
    }

    /**
     * Analyze an incident using the LLM client for RCA generation.
     * Passes related context from the incident (description, severity) plus
     * any metric/log context attached to the incident.
     */
    public String analyzeIncident(Incident incident) {
        return llmClient.generateRca(
            incident.getTitle(),
            incident.getDescription(),
            incident.getSeverity(),
            Map.of(
                "environmentId", incident.getEnvironmentId(),
                "status", incident.getStatus()
            ),
            List.of()
        );
    }

    /**
     * Rule-based classification (deterministic, not LLM-dependent).
     * Kept as a fast pre-filter before RCA generation.
     */
    public String classifyIncident(String description) {
        var desc = description.toLowerCase();
        if (desc.contains("rede") || desc.contains("network") || desc.contains("conexão")) {
            return CLASSIFICATION_TEMPLATES.get("network");
        }
        if (desc.contains("segurança") || desc.contains("security") || desc.contains("auth") || desc.contains("acesso")) {
            return CLASSIFICATION_TEMPLATES.get("security");
        }
        if (desc.contains("banco") || desc.contains("database") || desc.contains("sql") || desc.contains("query")) {
            return CLASSIFICATION_TEMPLATES.get("database");
        }
        if (desc.contains("app") || desc.contains("aplicação") || desc.contains("serviço")) {
            return CLASSIFICATION_TEMPLATES.get("app");
        }
        if (desc.contains("infra") || desc.contains("servidor") || desc.contains("instância")) {
            return CLASSIFICATION_TEMPLATES.get("infra");
        }
        return CLASSIFICATION_TEMPLATES.get("default");
    }

    /**
     * Answer a user query using the LLM client.
     * Context can include incident count, metric data, design state, etc.
     */
    public String answerQuery(String question, Map<String, Object> context) {
        var systemPrompt = "Você é o assistente de IA do CloudBuilder, uma plataforma de engenharia de infraestrutura como código. "
            + "Responda em português de forma técnica e objetiva. "
            + "Use os dados de contexto fornecidos para enriquecer sua resposta. "
            + "Se não tiver informações suficientes, sugira o que o usuário pode fazer para obtê-las.";
        return llmClient.chat(systemPrompt, question, context);
    }

    /**
     * Analyze a metric for anomalies using the LLM client.
     */
    public String analyzeMetric(String metricName, List<Double> recentValues, double threshold) {
        return llmClient.analyzeMetric(metricName, recentValues, threshold);
    }
}
