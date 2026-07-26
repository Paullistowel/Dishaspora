package com.dishaspora.ai.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

/**
 * Selects the active {@link AiClient}. Set {@code ai.provider} (env AI_PROVIDER) to
 * "openai" or "anthropic" to force one; the default "auto" prefers whichever key is
 * configured (OpenAI first). Used by Snap &amp; Cook and the assistant.
 */
@Configuration
public class AiConfig {

    @Bean
    @Primary
    public AiClient aiClient(OpenAiClient openAi, ClaudeClient claude,
                             @Value("${ai.provider:auto}") String provider) {
        if ("openai".equalsIgnoreCase(provider)) return openAi;
        if ("anthropic".equalsIgnoreCase(provider) || "claude".equalsIgnoreCase(provider)) return claude;
        if (openAi.isConfigured()) return openAi;
        if (claude.isConfigured()) return claude;
        return openAi; // neither configured — reports not-configured, callers handle it
    }
}
