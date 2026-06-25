# ADR-013: LLM Provider Abstraction & AI Chat Context

**Status**: Implemented
**Date**: 2026-06-20
**Author**: Principal Architect Agent

## Context

CloudBuilder AIOps module ships with AI-powered features (incident analysis, chat, RCA generation) but the initial implementation hardcoded rule-based logic inside `AIService.java`. As the platform enters Q4 2026 (Intelligence phase), we need a flexible architecture that supports:

1. **Multiple LLM providers** — OpenAI, Anthropic, or future providers
2. **Graceful degradation** — fallback when no API key is configured or network fails
3. **Context-aware chat** — passing design state, incident count, and metrics to the LLM
4. **Metric analysis** — dedicated endpoint for analyzing time-series metric data

## Problem

How to design an LLM integration layer that supports multiple providers, degrades gracefully when credentials are absent, and provides rich context to AI queries — without adding heavy external dependencies or disrupting existing incident workflows?

## Decision

### 1. LlmClient Interface (Strategy Pattern)

**Chosen**: `LlmClient` interface with 3 methods — `chat()`, `analyzeMetric()`, `generateRca()`.

**Alternatives considered**:
- Direct OpenAI SDK import (heavy dependency, provider lock-in)
- Spring AI abstraction (unstable API, complex configuration)
- Single implementation with if/else flags (violates Open/Closed principle)

**Implementation**:

```java
public interface LlmClient {
    String chat(String systemPrompt, String userMessage);
    String analyzeMetric(String metricName, List<Double> recentValues, double threshold);
    String generateRca(String incidentDescription, String classification);
}
```

**Rationale**: Minimal interface, easy to implement for any provider. The 3 methods map directly to AIOps use cases without over-abstraction.

**Consequences**: 3 concrete implementations needed. Interface must remain stable across providers.

### 2. Rule-Based Fallback (Default)

**Chosen**: `RuleBasedLlmClient` — hardcoded templates for all 3 LlmClient methods. Activated via `@ConditionalOnProperty(name = "cloudbuilder.ai.llm.provider", havingValue = "rule-based", matchIfMissing = true)`.

**Rationale**: Preserves original `AIService` behavior when no real LLM is configured. Zero dependency, zero cost. The matchIfMissing=true ensures new deployments work out-of-the-box.

**Templates**:
- `chat()`: Returns structured analysis based on incident count and question keywords
- `analyzeMetric()`: Z-score comparison against a target threshold
- `generateRca()`: Template-based RCA with resource type and classification

**Consequences**: Response quality is limited to template matching. Upgrade to a real LLM for production use.

### 3. OpenAI + Anthropic Implementations

**Chosen**: Separate `OpenAiLlmClient` and `AnthropicLlmClient`, each with `@ConditionalOnProperty` selection.

**OpenAiLlmClient**:
- Calls `POST https://api.openai.com/v1/chat/completions`
- Uses `gpt-4o-mini` model (cost-optimized for platform engineering queries)
- System prompt describes CloudBuilder context, available actions, and response format
- Falls back to rule-based on `IOException` or missing API key

**AnthropicLlmClient**:
- Calls `POST https://api.anthropic.com/v1/messages`
- Uses `claude-sonnet-4-20250514` model
- Same CloudBuilder system prompt
- Falls back to rule-based on `IOException` or missing API key

**Alternatives considered**:
- Single client switching on API key presence (mixes concerns)
- Spring Retry for automatic retry (heavy, not needed for graceful degradation)

**Rationale**: Separate beans with `@ConditionalOnProperty` means zero config overhead — set `cloudbuilder.ai.llm.provider=openai` and `CLOUDBUILDER_AI_LLM_OPENAI_API_KEY` and it works. No real LLM = rule-based.

**Consequences**: Each provider maintains its own HTTP call. If the API contract changes, only that client needs updating.

### 4. Graceful Degradation Pattern

**Chosen**: Every real LLM client wraps its API call in a try-catch that catches `IOException` and falls back to the rule-based implementation.

**Pattern**:

```java
try {
    // call external API
} catch (IOException e) {
    log.warn("LLM API call failed, falling back to rule-based: {}", e.getMessage());
    return ruleBasedFallback.chat(systemPrompt, userMessage);
}
```

**Alternatives considered**:
- Circuit breaker (Resilience4j) — overkill for a local fallback
- Fail-fast with error response — degrades UX
- Retry logic — adds latency on guaranteed failure

**Rationale**: The fallback is instant and returns a reasonable response. No user-facing error. No external dependency for resilience.

**Consequences**: If the real LLM is consistently failing, all responses are rule-based. The `log.warn` makes this observable.

### 5. Context-Aware Chat (extraContext)

**Chosen**: `answerQuery()` in `AIOpsService` accepts `Map<String, Object> extraContext` that gets merged into the AI service context.

**Frontend sends**:
```json
{
  "question": "otimize meus custos",
  "context": "3",
  "extraContext": {
    "incidentCount": 3,
    "canvas": {
      "name": "minha-infra",
      "resourceCount": 7,
      "connectionCount": 4,
      "providers": ["aws"],
      "nodes": [{"label": "VPC", "provider": "aws", "resourceType": "VPC"}]
    }
  }
}
```

**AIService builds**: Combined context map with incident count, canvas state, and the extra context.

**Alternatives considered**:
- Separate endpoint per context type (proliferation of endpoints)
- All context in the question string (unstructured, hard to parse)

**Rationale**: Flat `Map<String, Object>` is forward-compatible. The LLM receives structured data it can reference in its response.

**Consequences**: Frontend must serialize canvas state on every query. For very large designs (>100 nodes), context window could become a concern.

### 6. Metric Analysis (Separate Endpoint)

**Chosen**: Dedicated `POST /api/v1/aiops/analyze-metric` endpoint with `MetricAnalysisRequest`/`MetricAnalysisResponse` DTOs.

**Request**:
```json
{
  "metricName": "cpu_utilization",
  "recentValues": [45.2, 52.1, 48.7, 63.4, ...],
  "threshold": 30.0
}
```

**Response**:
```json
{
  "metricName": "cpu_utilization",
  "analysis": "CPU utilization shows a concerning upward trend..."
}
```

**Alternatives considered**:
- Overloading the chat endpoint (pollutes chat history with analysis results)
- Frontend-only calculation (loses LLM reasoning)

**Rationale**: Clean separation between interactive chat and diagnostic analysis. The frontend can call this independently and display results inline.

**Consequences**: One extra HTTP call for metric analysis. The analysis is stateless — no context carried between calls.

### 7. Package Structure for LlmClient

**Chosen**: `com.cloudbuilder.aiops.domain.service.llm` package with:
- `LlmClient.java` (interface)
- `RuleBasedLlmClient.java`
- `OpenAiLlmClient.java`
- `AnthropicLlmClient.java`

Config class: `com.cloudbuilder.aiops.infrastructure.config.LlmClientConfig.java`

**Rationale**: Domain interfaces in `domain/service/`, implementations visible at the same level. Config in `infrastructure/config/` follows existing patterns.

**Consequences**: 4 new Java files + 1 config class. AIService dependency changed from hardcoded logic to the interface.

### 8. Configuration (application.yml)

**Chosen**:
```yaml
cloudbuilder:
  ai:
    llm:
      provider: rule-based  # or openai, anthropic
      openai:
        api-key: ${CLOUDBUILDER_AI_LLM_OPENAI_API_KEY:}
        model: gpt-4o-mini
        endpoint: https://api.openai.com/v1/chat/completions
      anthropic:
        api-key: ${CLOUDBUILDER_AI_LLM_ANTHROPIC_API_KEY:}
        model: claude-sonnet-4-20250514
        endpoint: https://api.anthropic.com/v1/messages
```

**Rationale**: Environment variables for secrets (never in config files), explicit model selection, easy switching.

## Consequences

1. **4 new Java files** in `aiops/domain/service/llm/`
2. **1 new Java file** in `aiops/infrastructure/config/`
3. **5 modified files**: AIService.java, AIOpsService.java, IncidentService.java, AIOpsController.java, application.yml
4. **Frontend**: 3 files modified (api/aiops.ts + AIOpsModule.tsx with context + metric analysis)
5. **Zero new Maven dependencies** — uses Spring RestTemplate (already in classpath)
6. **Zero configuration required** for development — rule-based default works out-of-box
7. **TypeScript**: 0 errors, Vitest: 73/73 pass, Vite build: clean, Maven compile: clean
8. **Incident classification** stays rule-based (fast deterministic pre-filter) — LLM used only for RCA, metrics, and chat

## References

- LlmClient.java: Interface with 3 methods
- OpenAiLlmClient.java: OpenAI Chat Completions implementation
- AnthropicLlmClient.java: Anthropic Messages API implementation
- RuleBasedLlmClient.java: Template-based fallback
- LlmClientConfig.java: `@Configuration` with `@ConditionalOnProperty`
- AIService.java: Delegates to LlmClient interface
- AIOpsController.java: `POST /analyze-metric` endpoint
- ADR-012: Previous architecture ADR (Q3 Operations)
