package com.cloudbuilder.aiops.domain.service.llm;

import java.util.List;
import java.util.Map;

/**
 * Abstraction for LLM providers (OpenAI, Anthropic, rule-based fallback).
 *
 * TIER 0 reference: OpenAI Chat Completions API, Anthropic Messages API
 * Each implementation must handle its own API format, auth, and error handling.
 */
public interface LlmClient {

    /**
     * Send a chat message to the LLM and get a text response.
     *
     * @param systemPrompt  System-level instruction (role = "system")
     * @param userMessage   User's question or input (role = "user")
     * @param context       Additional structured context (metrics, incidents, design state)
     * @return              The LLM's text response
     */
    String chat(String systemPrompt, String userMessage, Map<String, Object> context);

    /**
     * Analyze a set of metrics for anomalies and return a human-readable analysis.
     *
     * @param metricName    Name of the metric (e.g. "cpu_utilization")
     * @param recentValues  Recent data points (oldest first)
     * @param threshold     Configured threshold for this metric
     * @return              Analysis text
     */
    String analyzeMetric(String metricName, List<Double> recentValues, double threshold);

    /**
     * Generate root cause analysis for an incident given context.
     *
     * @param incidentTitle       Incident title
     * @param incidentDescription Incident description
     * @param severity            Severity level
     * @param relatedMetrics      Metric context as key-value pairs
     * @param relatedLogs         Recent log entries
     * @return                    RCA text
     */
    String generateRca(String incidentTitle, String incidentDescription,
                       String severity, Map<String, Object> relatedMetrics,
                       List<String> relatedLogs);
}
