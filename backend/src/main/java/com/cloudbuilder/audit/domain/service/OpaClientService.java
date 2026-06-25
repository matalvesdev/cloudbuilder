package com.cloudbuilder.audit.domain.service;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.Optional;

@Service
public class OpaClientService {

    private static final Logger log = LoggerFactory.getLogger(OpaClientService.class);

    private final RestTemplate restTemplate;
    private final String opaUrl;

    public OpaClientService(RestTemplate restTemplate,
                            @Value("${opa.url:http://localhost:8181}") String opaUrl) {
        this.restTemplate = restTemplate;
        this.opaUrl = opaUrl;
    }

    @CircuitBreaker(name = "opaClient", fallbackMethod = "evaluateFallback")
    @SuppressWarnings("unchecked")
    public Optional<Map<String, Object>> evaluate(String policyPath, Map<String, Object> input) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(Map.of("input", input), headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    opaUrl + "/v1/data/" + policyPath,
                    request,
                    Map.class);

            if (response.getBody() != null) {
                return Optional.of((Map<String, Object>) response.getBody().get("result"));
            }
        } catch (Exception e) {
            log.warn("OPA evaluation failed for policy {}: {}", policyPath, e.getMessage());
        }
        return Optional.empty();
    }

    /**
     * Fallback when circuit breaker is OPEN for evaluate.
     */
    public Optional<Map<String, Object>> evaluateFallback(String policyPath, Map<String, Object> input, Exception ex) {
        log.warn("Circuit breaker OPEN for OPA evaluate policy '{}': {}. Returning empty.", policyPath, ex.getMessage());
        return Optional.empty();
    }

    @CircuitBreaker(name = "opaClient", fallbackMethod = "evaluateBooleanFallback")
    @SuppressWarnings("unchecked")
    public Optional<Boolean> evaluateBoolean(String policyPath, Map<String, Object> input) {
        return evaluate(policyPath, input)
                .map(result -> {
                    Object allow = result.get("allow");
                    if (allow instanceof Boolean) return (Boolean) allow;
                    return false;
                });
    }

    /**
     * Fallback when circuit breaker is OPEN for evaluateBoolean.
     */
    public Optional<Boolean> evaluateBooleanFallback(String policyPath, Map<String, Object> input, Exception ex) {
        log.warn("Circuit breaker OPEN for OPA evaluateBoolean policy '{}': {}. Returning false.", policyPath, ex.getMessage());
        return Optional.of(false);
    }

    public boolean isReachable() {
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(opaUrl + "/health", String.class);
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            return false;
        }
    }
}
