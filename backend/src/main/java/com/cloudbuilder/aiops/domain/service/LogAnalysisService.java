package com.cloudbuilder.aiops.domain.service;

import com.cloudbuilder.aiops.domain.service.llm.LlmClient;
import com.cloudbuilder.observability.application.dto.LogEntryDTO;
import com.cloudbuilder.observability.domain.service.LogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * LLM-powered log analysis for anomaly detection.
 *
 * Queries recent logs from the Observability module, computes error-rate
 * statistics, and delegates to the LLM for pattern analysis and root-cause
 * hypothesis generation.
 *
 * Sprint 15 — AI Assistant: Anomaly detection from logs.
 */
@Service
@Transactional(readOnly = true)
public class LogAnalysisService {

    private static final Logger log = LoggerFactory.getLogger(LogAnalysisService.class);

    private static final Pattern ERROR_PATTERN = Pattern.compile(
        "(?i)(error|exception|fatal|critical|panic|failed|timeout|refused|denied|corrupt)"
    );

    private static final Pattern WARN_PATTERN = Pattern.compile(
        "(?i)(warn|warning|deprecated|retry|backoff|throttl)"
    );

    private final LogService logService;
    private final LlmClient llmClient;

    public LogAnalysisService(LogService logService, LlmClient llmClient) {
        this.logService = logService;
        this.llmClient = llmClient;
    }

    /**
     * Analyze recent logs for anomalies and error patterns.
     *
     * @param tenantId       Tenant scope
     * @param windowMinutes  Lookback window in minutes (default 60)
     * @param maxLogs        Maximum number of logs to analyze (default 200)
     * @return Analysis result with error patterns and recommendations
     */
    public LogAnalysisResult analyzeLogs(String tenantId, int windowMinutes, int maxLogs) {
        Instant end = Instant.now();
        Instant start = end.minusSeconds(windowMinutes * 60L);

        // Fetch recent logs
        var page = logService.search(tenantId, null, null, start, end,
            PageRequest.of(0, maxLogs));

        List<LogEntryDTO> logs = page.getContent();

        if (logs.isEmpty()) {
            return new LogAnalysisResult(
                windowMinutes, maxLogs, 0L, 0L, 0L, 0.0,
                "Sem logs disponíveis no período de " + windowMinutes + " minutos.",
                List.of(), List.of()
            );
        }

        // Compute statistics
        long totalLogs = logs.size();
        long errorCount = logs.stream().filter(this::isError).count();
        long warnCount = logs.stream().filter(this::isWarning).count();
        double errorRate = totalLogs > 0 ? (double) errorCount / totalLogs * 100 : 0;

        // Extract error messages for LLM analysis
        List<String> errorMessages = logs.stream()
            .filter(this::isError)
            .map(LogEntryDTO::message)
            .filter(m -> m != null && !m.isBlank())
            .distinct()
            .limit(50)
            .toList();

        // Extract warning messages
        List<String> warnMessages = logs.stream()
            .filter(this::isWarning)
            .map(LogEntryDTO::message)
            .filter(m -> m != null && !m.isBlank())
            .distinct()
            .limit(30)
            .toList();

        // Build context for LLM
        Map<String, Object> context = new LinkedHashMap<>();
        context.put("windowMinutes", windowMinutes);
        context.put("totalLogs", totalLogs);
        context.put("errorCount", errorCount);
        context.put("warnCount", warnCount);
        context.put("errorRate", Math.round(errorRate * 100.0) / 100.0);
        context.put("errorPatterns", errorMessages.stream().limit(20).collect(Collectors.toList()));
        context.put("warnPatterns", warnMessages.stream().limit(10).collect(Collectors.toList()));

        // Determine preliminary status
        String preliminaryStatus;
        if (errorRate > 10) {
            preliminaryStatus = "HIGH_ERROR_RATE";
        } else if (errorRate > 5) {
            preliminaryStatus = "ELEVATED_ERRORS";
        } else if (errorCount > 0) {
            preliminaryStatus = "NORMAL_WITH_ERRORS";
        } else {
            preliminaryStatus = "HEALTHY";
        }

        // Delegate to LLM for deep analysis
        String systemPrompt = "Você é um SRE analisando logs de infraestrutura. "
            + "Analise os padrões de erro e warnings fornecidos. "
            + "Identifique: (1) erros recorrentes, (2) possíveis causas raiz, "
            + "(3) ações corretivas recomendadas. Responda em português, de forma técnica e objetiva. "
            + "Limite a resposta a no máximo 5 parágrafos.";

        String userMessage = buildAnalysisPrompt(errorMessages, warnMessages, errorRate, totalLogs);
        String analysis = llmClient.chat(systemPrompt, userMessage, context);

        // Extract top error patterns (deduplicated by prefix)
        List<ErrorPattern> topErrorPatterns = extractErrorPatterns(errorMessages);

        // Extract recommendations from LLM response
        List<String> recommendations = extractRecommendations(analysis);

        log.info("Log analysis: total={} errors={} warns={} errorRate={}% status={}",
            totalLogs, errorCount, warnCount, String.format("%.2f", errorRate), preliminaryStatus);

        return new LogAnalysisResult(
            windowMinutes, maxLogs, totalLogs, errorCount, warnCount,
            Math.round(errorRate * 100.0) / 100.0,
            analysis, topErrorPatterns, recommendations
        );
    }

    /**
     * Analyze logs for a specific error pattern (full-text search).
     */
    public LogAnalysisResult analyzeErrorPattern(String tenantId, String query,
                                                  int windowMinutes, int maxLogs) {
        Instant end = Instant.now();
        Instant start = end.minusSeconds(windowMinutes * 60L);

        var page = logService.search(tenantId, query, "ERROR", start, end,
            PageRequest.of(0, maxLogs));

        List<LogEntryDTO> logs = page.getContent();
        long totalFound = page.getTotalElements();

        List<String> errorMessages = logs.stream()
            .map(LogEntryDTO::message)
            .filter(m -> m != null && !m.isBlank())
            .distinct()
            .limit(50)
            .toList();

        String systemPrompt = "Você é um SRE analisando logs de erro. "
            + "Foram encontradas " + totalFound + " ocorrências do padrão '" + query + "'. "
            + "Analise os padrões de erro e sugira ações corretivas. Responda em português.";

        Map<String, Object> context = Map.of(
            "query", query,
            "totalFound", totalFound,
            "sampleErrors", errorMessages.stream().limit(10).collect(Collectors.toList())
        );

        String analysis = llmClient.chat(systemPrompt, "Analise os erros encontrados.", context);
        List<ErrorPattern> topErrorPatterns = extractErrorPatterns(errorMessages);
        List<String> recommendations = extractRecommendations(analysis);

        return new LogAnalysisResult(
            windowMinutes, maxLogs, totalFound, totalFound, 0,
            totalFound > 0 ? 100.0 : 0.0,
            analysis, topErrorPatterns, recommendations
        );
    }

    private boolean isError(LogEntryDTO entry) {
        return entry.level() != null && entry.level().matches("(?i)(ERROR|FATAL|CRITICAL)");
    }

    private boolean isWarning(LogEntryDTO entry) {
        return entry.level() != null && entry.level().matches("(?i)(WARN|WARNING)");
    }

    private String buildAnalysisPrompt(List<String> errorMessages, List<String> warnMessages,
                                        double errorRate, long totalLogs) {
        var sb = new StringBuilder();
        sb.append("Análise de logs do período:\n");
        sb.append("- Total de logs: ").append(totalLogs).append("\n");
        sb.append("- Taxa de erro: ").append(String.format("%.2f", errorRate)).append("%\n\n");

        if (!errorMessages.isEmpty()) {
            sb.append("Mensagens de erro encontradas (").append(errorMessages.size()).append(" únicas):\n");
            errorMessages.stream().limit(15).forEach(m -> sb.append("  - ").append(m).append("\n"));
        }

        if (!warnMessages.isEmpty()) {
            sb.append("\nMensagens de warning encontradas (").append(warnMessages.size()).append(" únicas):\n");
            warnMessages.stream().limit(10).forEach(m -> sb.append("  - ").append(m).append("\n"));
        }

        sb.append("\nCom base nestes dados, identifique padrões de erro, possíveis causas raiz, ");
        sb.append("e recomende ações corretivas específicas.");

        return sb.toString();
    }

    /**
     * Extract top error patterns by grouping similar messages.
     */
    private List<ErrorPattern> extractErrorPatterns(List<String> errorMessages) {
        if (errorMessages.isEmpty()) return List.of();

        Map<String, Long> patternCounts = errorMessages.stream()
            .collect(Collectors.groupingBy(
                msg -> normalizeErrorMessage(msg),
                Collectors.counting()
            ));

        return patternCounts.entrySet().stream()
            .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
            .limit(10)
            .map(e -> new ErrorPattern(e.getKey(), e.getValue()))
            .toList();
    }

    /**
     * Normalize error messages by replacing variable parts (IDs, numbers, etc.)
     * with placeholders to group similar errors.
     */
    private String normalizeErrorMessage(String msg) {
        if (msg == null) return "";
        return msg
            .replaceAll("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}", "<UUID>")
            .replaceAll("\\b\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\b", "<IP>")
            .replaceAll("\\b\\d+\\b", "<N>")
            .replaceAll("i-[0-9a-f]+", "<INSTANCE>")
            .replaceAll("subnet-[0-9a-f]+", "<SUBNET>")
            .replaceAll("sg-[0-9a-f]+", "<SG>")
            .replaceAll("vpc-[0-9a-f]+", "<VPC>")
            .replaceAll("ami-[0-9a-f]+", "<AMI>")
            .replaceAll("0x[0-9a-f]+", "<HEX>")
            .replaceAll("/[^\\s]+", "<PATH>")
            .trim();
    }

    private List<String> extractRecommendations(String analysis) {
        if (analysis == null || analysis.isBlank()) return List.of();
        return java.util.Arrays.stream(analysis.split("\n"))
            .map(String::trim)
            .filter(line -> line.startsWith("- ") || line.startsWith("* ") || line.startsWith("• ")
                || line.matches("^\\d+\\..*"))
            .map(line -> line.replaceFirst("^[-*•]\\s*", "").replaceFirst("^\\d+\\.\\s*", ""))
            .filter(s -> !s.isBlank())
            .limit(5)
            .toList();
    }

    // ─── DTOs ──────────────────────────────────────────────────────────

    public record ErrorPattern(String message, long count) {}

    public record LogAnalysisResult(
        int windowMinutes,
        int maxLogs,
        long totalLogs,
        long errorCount,
        long warnCount,
        double errorRate,
        String analysis,
        List<ErrorPattern> topErrorPatterns,
        List<String> recommendations
    ) {}
}
