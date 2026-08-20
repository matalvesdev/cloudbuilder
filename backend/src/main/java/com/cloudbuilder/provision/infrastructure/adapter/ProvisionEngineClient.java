package com.cloudbuilder.provision.infrastructure.adapter;

import com.cloudbuilder.shared.config.ResilienceConfig;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.Map;

/**
 * HTTP client that proxies provisioning requests to the Go provision engine.
 *
 * Uses {@link RestTemplate} for synchronous HTTP calls and is annotated with
 * {@link ResilienceConfig.GoEngineResilient} for circuit breaker + bulkhead + retry.
 *
 * Flow: Backend → Go Engine → Terraform init → plan → apply → response.
 *
 * When the circuit is open (too many failures), the fallback method returns
 * a FAILED response instead of making the HTTP call.
 */
@Component
public class ProvisionEngineClient {

    private static final Logger log = LoggerFactory.getLogger(ProvisionEngineClient.class);

    private final RestTemplate restTemplate;
    private final String engineBaseUrl;

    public ProvisionEngineClient(RestTemplate restTemplate,
                                 @Value("${cloudbuilder.provision-engine.url:http://localhost:50052}") String engineBaseUrl) {
        this.restTemplate = restTemplate;
        this.engineBaseUrl = engineBaseUrl;
    }

    /**
     * Send a provisioning request to the Go engine with full resilience.
     *
     * @param request the provision payload (canvasId, tenantId, files, envVars, etc.)
     * @return engine response with status, planOutput, applyOutput
     */
    @ResilienceConfig.GoEngineResilient
    public EngineResponse execute(ProvisionPayload request) {
        log.info("Calling Go engine: canvas={}, provider={}, files={}",
                request.canvasId(), request.provider(), request.files().size());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        // Forward tenant context for engine-side logging
        headers.set("X-Tenant-Id", request.tenantId());

        HttpEntity<ProvisionPayload> entity = new HttpEntity<>(request, headers);

        ResponseEntity<Map> response = restTemplate.exchange(
                engineBaseUrl + "/api/v1/provision/apply",
                HttpMethod.POST,
                entity,
                Map.class
        );

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            Map body = response.getBody();
            return new EngineResponse(
                    getOrDefault(body, "deploymentId", "unknown"),
                    getOrDefault(body, "status", "UNKNOWN"),
                    getOrDefault(body, "message", ""),
                    getOrDefault(body, "planOutput", ""),
                    getOrDefault(body, "applyOutput", ""),
                    getOrDefault(body, "error", ""),
                    getLongOrDefault(body, "durationMs", 0L)
            );
        }

        return new EngineResponse(
                "unknown", "FAILED",
                "Go engine returned HTTP " + response.getStatusCode().value(),
                "", "", "HTTP " + response.getStatusCode().value(), 0L
        );
    }

    /**
     * Fallback when the circuit is open or retries are exhausted.
     * Returns a FAILED response so the controller can report the error cleanly.
     */
    public EngineResponse executeFallback(ProvisionPayload request, Exception ex) {
        log.error("Go engine fallback triggered for canvas={}: {}", request.canvasId(), ex.getMessage());
        return new EngineResponse(
                "unknown", "FAILED",
                "Provision engine temporarily unavailable: " + ex.getMessage(),
                "", "",
                "CIRCUIT_OPEN: " + ex.getMessage(),
                0L
        );
    }

    /**
     * Check if the Go engine is reachable.
     */
    public boolean isHealthy() {
        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    engineBaseUrl + "/healthz",
                    HttpMethod.GET,
                    null,
                    Map.class
            );
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            log.warn("Go engine health check failed: {}", e.getMessage());
            return false;
        }
    }

    @SuppressWarnings("unchecked")
    private String getOrDefault(Map body, String key, String defaultValue) {
        Object val = body.get(key);
        return val != null ? val.toString() : defaultValue;
    }

    private long getLongOrDefault(Map body, String key, long defaultValue) {
        Object val = body.get(key);
        if (val instanceof Number n) return n.longValue();
        return defaultValue;
    }

    /**
     * The provisioning payload sent to the Go engine.
     */
    public record ProvisionPayload(
            String canvasId,
            String tenantId,
            String provider,
            String engine,
            Map<String, String> files,
            int resourceCount,
            Map<String, String> envVars,
            boolean autoApprove,
            String credentialId
    ) {}

    /**
     * Response from the Go engine.
     */
    public record EngineResponse(
            String deploymentId,
            String status,
            String message,
            String planOutput,
            String applyOutput,
            String error,
            long durationMs
    ) {}
}
