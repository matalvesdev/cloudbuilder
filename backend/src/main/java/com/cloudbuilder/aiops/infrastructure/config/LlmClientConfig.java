package com.cloudbuilder.aiops.infrastructure.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;

/**
 * Configuration for LLM client providers.
 * Properties are read from application.yml:
 *   cloudbuilder.ai.llm.provider — "openai" | "anthropic" | "rule-based" (default)
 *   cloudbuilder.ai.llm.openai.api-key
 *   cloudbuilder.ai.llm.openai.model
 *   cloudbuilder.ai.llm.anthropic.api-key
 *   cloudbuilder.ai.llm.anthropic.model
 *
 * The active implementation is selected via @ConditionalOnProperty on each LlmClient.
 */
@Configuration
@PropertySource(value = "classpath:application.yml", ignoreResourceNotFound = true)
public class LlmClientConfig {
    // Bean selection is done via @ConditionalOnProperty on each LlmClient implementation.
    // RuleBasedLlmClient is the default (matchIfMissing = true).
    // OpenAiLlmClient activates when cloudbuilder.ai.llm.provider=openai.
    // AnthropicLlmClient activates when cloudbuilder.ai.llm.provider=anthropic.
}
