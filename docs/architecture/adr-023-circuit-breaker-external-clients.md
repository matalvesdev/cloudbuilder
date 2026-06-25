# ADR-023: Circuit Breaker Pattern for External Client Calls

**Status**: Proposed
**Date**: 2026-06-21
**Author**: Backend Agent

## Context

CloudBuilder integrates with several external services that are outside our control:

| Integration | Client Class | Failure Risk |
|-------------|-------------|--------------|
| OPA (Open Policy Agent) | OpaClient (via HTTP) | OPA container down, network partition, Rego evaluation timeout |
| LLM providers (OpenAI, Anthropic) | LlmClient (via HTTP) | Provider outage, rate limiting, slow responses (>30s), API key issues |
| Git providers (GitHub, GitLab) | GitHubOAuthService, GitScannerService | API rate limits, service degradation, network issues |

Currently, all external calls use simple `RestTemplate` or `HttpClient` calls with **no resilience patterns**:

- No timeout enforcement
- No retry logic
- No circuit breaking
- No fallback mechanism
- No bulkhead isolation

A single external service failure can cascade through the entire request thread, consuming connections and causing downstream failures across unrelated features.

## Problem

How to protect the CloudBuilder backend from cascading failures caused by external service degradation, while maintaining functionality in degraded mode?

## Decision

### 1. Resilience4j CircuitBreaker + TimeLimiter

**Chosen**: Use Resilience4j annotations (`@CircuitBreaker`, `@TimeLimiter`, `@Retry`) for all external HTTP client calls.

**Not chosen**:
- **Hystrix**: No longer in maintenance mode (Netflix Hystrix retired)
- **Spring Retry**: Too basic — no circuit breaker, no bulkhead, no metrics
- **Sentinel**: Alibaba ecosystem — less familiar to the team
- **Manual implementation**: Would reinvent what Resilience4j already provides

**Dependency**:
```xml
<dependency>
    <groupId>io.github.resilience4j</groupId>
    <artifactId>resilience4j-spring-boot3</artifactId>
    <version>2.2.0</version>
</dependency>
```

### 2. Circuit Breaker Configuration

Each external client gets its own CircuitBreaker instance with parameters tuned to its SLO:

| Client | Failure Rate | Sliding Window | Wait Duration (half-open) | Timeout |
|--------|-------------|----------------|--------------------------|---------|
| OPA | 50% | 10 calls | 30s | 5s |
| LLM (OpenAI) | 40% | 20 calls | 60s | 30s |
| LLM (Anthropic) | 40% | 20 calls | 60s | 30s |
| GitHub API | 30% | 20 calls | 30s | 10s |

**Default configuration**:
```yaml
resilience4j.circuitbreaker:
  configs:
    default:
      slidingWindowSize: 10
      minimumNumberOfCalls: 5
      failureRateThreshold: 50
      waitDurationInOpenState: 30s
      permittedNumberOfCallsInHalfOpenState: 3
      recordExceptions:
        - java.net.ConnectException
        - java.net.SocketTimeoutException
        - org.springframework.web.client.HttpServerErrorException
```

**Annotation usage**:
```java
@CircuitBreaker(name = "llmClient", fallbackMethod = "analyzeFallback")
@TimeLimiter(name = "llmClient")
public CompletableFuture<String> generateRca(String title, String description, ...) {
    return CompletableFuture.supplyAsync(() -> {
        // LLM API call
    });
}

public String analyzeFallback(Exception ex) {
    return "Análise temporariamente indisponível. Diagnóstico baseado em regras.";
}
```

### 3. Fallback to Degraded Mode

When a circuit breaker is OPEN, the system **must** continue functioning in degraded mode:

| Service Normal | Degraded Fallback |
|----------------|-------------------|
| OPA policy evaluation | Use Java-based ValidationStrategy (existing fallback per ADR-020) |
| LLM RCA generation | Rule-based classification (`AIService.classifyIncident()`) |
| LLM chat/query | "O assistente AI está temporariamente indisponível. Tente novamente mais tarde." |
| GitHub API calls | Use cached repository data (stale read) |

### 4. TimeLimiter (not just socket timeout)

Resilience4j `@TimeLimiter` provides timeout enforcement at the application layer, independent of the HTTP client's socket timeout:

```java
@TimeLimiter(name = "llmClient", fallbackMethod = "timeoutFallback")
public CompletableFuture<String> callLlm(...) { ... }
```

This catches scenarios where:
- The HTTP client hangs (thread stuck)
- The server accepts the connection but never responds
- DNS resolution takes too long

### 5. Metrics and Observability

Resilience4j automatically exposes Micrometer metrics:

| Metric | Description |
|--------|-------------|
| `resilience4j.circuitbreaker.state` | Current state (CLOSED, OPEN, HALF_OPEN) |
| `resilience4j.circuitbreaker.calls` | Call count by outcome (success, failure, ignored) |
| `resilience4j.circuitbreaker.buffered` | Buffered calls in sliding window |
| `resilience4j.timelimiter.calls` | Timeout call count |

These feed into the existing native observability dashboards.

## Alternatives Considered

| Alternative | Pros | Cons |
|-------------|------|------|
| **No resilience** | Simple, zero deps | Single failure cascades to entire system |
| **Manual try-catch + Thread.sleep** | No dependencies | Error-prone, no metrics, no half-open state |
| **Spring Retry** | Spring-native | No circuit breaker, no timeout, no bulkhead |
| **Hystrix** | Battle-tested | Retired maintenance; no Spring Boot 3 support |
| **Resilience4j** | Active, lightweight, Spring Boot 3 native, Micrometer integration | New dependency (~1MB) |

## Trade-offs

- **New dependency**: resilience4j-spring-boot3 adds ~1MB but replaces what would be hundreds of lines of hand-rolled resilience logic.
- **Async complexity**: `@TimeLimiter` requires `CompletableFuture` return types, adding async complexity to formerly synchronous methods. The trade-off is acceptable for long-running external calls (>1s).
- **Degraded UX**: Users see "AI temporarily unavailable" messages instead of full RCA. This is acceptable vs. a 500 error or hanging request.
- **False positives**: Circuit breakers may trip during transient blips (e.g., 2-second network jitter). The half-open state and conservative thresholds mitigate this.

## Consequences

1. **New dependency**: `io.github.resilience4j:resilience4j-spring-boot3:2.2.0` in `pom.xml`
2. **New configuration**: `application.yml` resilience4j section with per-client circuit breaker configs
3. **Modified**: `AIService` (LlmClient calls) — add `@CircuitBreaker` + `@TimeLimiter` + fallback methods
4. **Modified**: OPA client (`ComplianceService` or `OpaClient`) — add `@CircuitBreaker` with fallback to Java rules
5. **Modified**: GitHub API client — add `@CircuitBreaker` with cached data fallback
6. **New**: Fallback methods for each resilient client
7. **Observability**: Circuit breaker state metrics available in the metrics dashboard
8. **Testing**: Unit tests for circuit breaker state transitions; integration tests for fallback logic

## References

- Resilience4j Documentation: https://resilience4j.readme.io/docs
- Resilience4j Spring Boot 3: https://github.com/resilience4j/resilience4j-spring-boot3
- Netflix Hystrix (retired): https://github.com/Netflix/Hystrix
- ADR-020: OPA Policy as Code (existing Java fallback for OPA)
- Martin Fowler — Circuit Breaker pattern: https://martinfowler.com/bliki/CircuitBreaker.html
