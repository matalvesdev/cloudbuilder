package com.cloudbuilder.aiops.domain.service.llm;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * Rule-based fallback LLM client — uses hardcoded templates when no real LLM is configured.
 * Preserves the original AIService behavior as a fallback tier.
 *
 * Activated when `cloudbuilder.ai.llm.provider` is unset or set to "rule-based".
 */
@Component
@ConditionalOnProperty(name = "cloudbuilder.ai.llm.provider", havingValue = "rule-based", matchIfMissing = true)
public class RuleBasedLlmClient implements LlmClient {

    private static final Map<String, String> RCA_TEMPLATES = Map.of(
        "critical", "Possível falha de infraestrutura subjacente. Verificar disponibilidade do provedor de nuvem, "
            + "status de rede e recursos críticos como bancos de dados e balanceadores de carga.",
        "warning", "Degradação de performance detectada. Pode estar relacionada a picos de tráfego, "
            + "alocação insuficiente de recursos ou contenção em recursos compartilhados.",
        "info", "Evento informacional. Monitorar para identificar padrões que possam indicar "
            + "problemas futuros."
    );

    private static final Map<String, String> CLASSIFICATION_TEMPLATES = Map.of(
        "infra", "infraestrutura",
        "network", "rede",
        "security", "segurança",
        "app", "aplicação",
        "database", "banco de dados",
        "default", "geral"
    );

    @Override
    public String chat(String systemPrompt, String userMessage, Map<String, Object> context) {
        var q = userMessage.toLowerCase();

        if (q.contains("incidente") || q.contains("alerta")) {
            var count = context != null ? context.getOrDefault("incidentCount", "vários") : "vários";
            return "Foram detectados " + count + " incidente(s) ativo(s). "
                + "Recomendo revisar os incidentes de severidade crítica primeiro.";
        }
        if (q.contains("custo") || q.contains("economia") || q.contains("otimização")) {
            return "Com base na análise atual, identifiquei oportunidades de otimização de custos. "
                + "Recursos subutilizados podem ser redimensionados para reduzir despesas.";
        }
        if (q.contains("saúde") || q.contains("health") || q.contains("status")) {
            return "A saúde geral da infraestrutura está estável. "
                + "Nenhum problema crítico detectado no momento.";
        }
        if (q.contains("métrica") || q.contains("metric") || q.contains("cpu") || q.contains("memória")) {
            return "Com base nas métricas recentes, o sistema opera dentro dos parâmetros normais. "
                + "Nenhum desvio significativo identificado nos últimos 15 minutos.";
        }

        return "Com base nos dados disponíveis, não foi possível determinar uma resposta específica. "
            + "Por favor, forneça mais detalhes sobre sua consulta.";
    }

    @Override
    public String analyzeMetric(String metricName, List<Double> recentValues, double threshold) {
        if (recentValues == null || recentValues.isEmpty()) {
            return "Sem dados disponíveis para " + metricName + ".";
        }

        double avg = recentValues.stream().mapToDouble(Double::doubleValue).average().orElse(0);
        double max = recentValues.stream().mapToDouble(Double::doubleValue).max().orElse(0);
        double deviation = max - avg;

        if (deviation > threshold) {
            return "⚠️ **" + metricName + "** apresenta anomalia: valor máximo de "
                + String.format("%.1f", max) + " excede o threshold de "
                + String.format("%.1f", threshold) + " (média: " + String.format("%.1f", avg) + "). "
                + "Recomenda-se investigar picos e verificar se há contenção de recursos.";
        }

        return "✅ **" + metricName + "** estável — máxima de "
            + String.format("%.1f", max) + ", média de " + String.format("%.1f", avg)
            + ". Dentro dos parâmetros esperados.";
    }

    @Override
    public String generateRca(String incidentTitle, String incidentDescription,
                              String severity, Map<String, Object> relatedMetrics,
                              List<String> relatedLogs) {
        var desc = incidentDescription != null ? incidentDescription.toLowerCase() : "";

        // Check for specific patterns in description
        if (desc.contains("rede") || desc.contains("network") || desc.contains("conexão")) {
            return "Problema de rede detectado. Possível causa: latência elevada em recursos de rede, "
                + "perda de pacotes, ou configuração incorreta de security groups/firewalls.";
        }
        if (desc.contains("banco") || desc.contains("database") || desc.contains("sql") || desc.contains("query")) {
            return "Problema de banco de dados identificado. Causas possíveis: "
                + "consultas lentas, contenção de conexões, ou dimensionamento inadequado da instância.";
        }
        if (desc.contains("cpu") || desc.contains("memória") || desc.contains("memory")) {
            return "Degradação de performance por recurso. Possível causa: "
                + "subdimensionamento da instância ou vazamento de memória no processo da aplicação.";
        }

        return RCA_TEMPLATES.getOrDefault(severity,
            "Análise não conclusiva. Revisar logs e métricas para identificar a causa raiz.");
    }
}
