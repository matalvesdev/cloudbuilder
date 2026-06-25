package com.cloudbuilder.aiops.domain.service.llm;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

/**
 * OpenAI LLM client — calls the Chat Completions API.
 *
 * TIER 0 reference: https://platform.openai.com/docs/api-reference/chat
 * Requires configuration: cloudbuilder.ai.llm.openai.api-key, cloudbuilder.ai.llm.openai.model (default: gpt-4o)
 *
 * Activated when `cloudbuilder.ai.llm.provider` is set to "openai".
 * Falls back gracefully to rule-based on errors.
 */
@Component
@ConditionalOnProperty(name = "cloudbuilder.ai.llm.provider", havingValue = "openai")
public class OpenAiLlmClient implements LlmClient {

    private static final Logger log = LoggerFactory.getLogger(OpenAiLlmClient.class);
    private static final String API_URL = "https://api.openai.com/v1/chat/completions";

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final RuleBasedLlmClient fallback;
    private final String apiKey;
    private final String model;
    private final boolean enabled;

    public OpenAiLlmClient(
            @Value("${cloudbuilder.ai.llm.openai.api-key:}") String apiKey,
            @Value("${cloudbuilder.ai.llm.openai.model:gpt-4o}") String model,
            RuleBasedLlmClient fallback) {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
        this.fallback = fallback;
        this.apiKey = apiKey;
        this.model = model;
        this.enabled = apiKey != null && !apiKey.isBlank();
        if (!this.enabled) {
            log.warn("OpenAI LLM client configured but no API key provided — falling back to rule-based");
        }
    }

    @Override
    @CircuitBreaker(name = "llmClient", fallbackMethod = "chatFallback")
    public String chat(String systemPrompt, String userMessage, Map<String, Object> context) {
        if (!enabled) return fallback.chat(systemPrompt, userMessage, context);
        try {
            var body = buildChatBody(systemPrompt, userMessage);
            var response = post(body);
            return extractMessage(response);
        } catch (Exception e) {
            log.warn("OpenAI chat failed, using fallback: {}", e.getMessage());
            return fallback.chat(systemPrompt, userMessage, context);
        }
    }

    /**
     * Fallback when circuit breaker is OPEN for chat.
     */
    public String chatFallback(String systemPrompt, String userMessage, Map<String, Object> context, Exception ex) {
        log.warn("Circuit breaker OPEN for OpenAI chat, using rule-based fallback: {}", ex.getMessage());
        return fallback.chat(systemPrompt, userMessage, context);
    }

    @Override
    @CircuitBreaker(name = "llmClient", fallbackMethod = "analyzeMetricFallback")
    public String analyzeMetric(String metricName, List<Double> recentValues, double threshold) {
        if (!enabled) return fallback.analyzeMetric(metricName, recentValues, threshold);
        try {
            var prompt = "Você é um engenheiro de confiabilidade (SRE) analisando métricas de infraestrutura. "
                + "Analise a métrica '" + metricName + "' com threshold " + threshold + ". "
                + "Dados recentes: " + recentValues + ". "
                + "Identifique anomalias, padrões e recomendações. Seja conciso (máx 3 parágrafos).";
            var body = buildChatBody("Você é um SRE especialista em análise de métricas.", prompt);
            var response = post(body);
            return extractMessage(response);
        } catch (Exception e) {
            log.warn("OpenAI metric analysis failed, using fallback: {}", e.getMessage());
            return fallback.analyzeMetric(metricName, recentValues, threshold);
        }
    }

    /**
     * Fallback when circuit breaker is OPEN for analyzeMetric.
     */
    public String analyzeMetricFallback(String metricName, List<Double> recentValues, double threshold, Exception ex) {
        log.warn("Circuit breaker OPEN for OpenAI analyzeMetric, using rule-based fallback: {}", ex.getMessage());
        return fallback.analyzeMetric(metricName, recentValues, threshold);
    }

    @Override
    @CircuitBreaker(name = "llmClient", fallbackMethod = "generateRcaFallback")
    public String generateRca(String incidentTitle, String incidentDescription,
                              String severity, Map<String, Object> relatedMetrics,
                              List<String> relatedLogs) {
        if (!enabled) return fallback.generateRca(incidentTitle, incidentDescription, severity, relatedMetrics, relatedLogs);
        try {
            var prompt = new StringBuilder();
            prompt.append("Título do incidente: ").append(incidentTitle).append("\n");
            prompt.append("Descrição: ").append(incidentDescription).append("\n");
            prompt.append("Severidade: ").append(severity).append("\n");
            if (relatedMetrics != null && !relatedMetrics.isEmpty()) {
                prompt.append("Métricas relacionadas: ").append(relatedMetrics).append("\n");
            }
            if (relatedLogs != null && !relatedLogs.isEmpty()) {
                prompt.append("Logs recentes:\n");
                relatedLogs.forEach(l -> prompt.append("  - ").append(l).append("\n"));
            }
            prompt.append("\nCom base nestas informações, faça uma análise de causa raiz (RCA) concisa em português.");

            var body = buildChatBody(
                "Você é um SRE sênior realizando análise de causa raiz de incidentes de infraestrutura. "
                + "Responda em português. Seja técnico e objetivo.",
                prompt.toString()
            );
            var response = post(body);
            return extractMessage(response);
        } catch (Exception e) {
            log.warn("OpenAI RCA generation failed, using fallback: {}", e.getMessage());
            return fallback.generateRca(incidentTitle, incidentDescription, severity, relatedMetrics, relatedLogs);
        }
    }

    /**
     * Fallback when circuit breaker is OPEN for generateRca.
     */
    public String generateRcaFallback(String incidentTitle, String incidentDescription,
                                      String severity, Map<String, Object> relatedMetrics,
                                      List<String> relatedLogs, Exception ex) {
        log.warn("Circuit breaker OPEN for OpenAI generateRca, using rule-based fallback: {}", ex.getMessage());
        return fallback.generateRca(incidentTitle, incidentDescription, severity, relatedMetrics, relatedLogs);
    }

    private ObjectNode buildChatBody(String systemPrompt, String userMessage) {
        var root = objectMapper.createObjectNode();
        root.put("model", model);
        root.put("temperature", 0.3);
        root.put("max_tokens", 1024);

        var messages = objectMapper.createArrayNode();
        messages.add(roleMessage("system", systemPrompt));
        messages.add(roleMessage("user", userMessage));
        root.set("messages", messages);

        return root;
    }

    private ArrayNode roleMessage(String role, String content) {
        var msg = objectMapper.createObjectNode();
        msg.put("role", role);
        msg.put("content", content);
        return objectMapper.createArrayNode().add(msg);
    }

    private ResponseEntity<String> post(ObjectNode body) {
        var headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);
        var entity = new HttpEntity<>(body.toString(), headers);
        return restTemplate.postForEntity(API_URL, entity, String.class);
    }

    private String extractMessage(ResponseEntity<String> response) {
        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            return "Erro na consulta ao modelo de IA. Tente novamente mais tarde.";
        }
        try {
            var root = objectMapper.readTree(response.getBody());
            var choice = root.path("choices").get(0);
            return choice.path("message").path("content").asText("Resposta não disponível.");
        } catch (Exception e) {
            log.warn("Failed to parse OpenAI response: {}", e.getMessage());
            return "Não foi possível interpretar a resposta do modelo.";
        }
    }
}
