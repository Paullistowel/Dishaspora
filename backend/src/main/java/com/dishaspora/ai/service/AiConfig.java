package com.dishaspora.ai.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

/**
 * Selects the active {@link AiClient}. Set {@code ai.provider} (env AI_PROVIDER) to
 * "openai", "anthropic", or "huggingface" to force one; the default "auto" prefers
 * whichever key is configured (OpenAI, then Anthropic, then Hugging Face). Used by
 * Snap &amp; Cook and the assistant.
 */
@Configuration
public class AiConfig {

    @Bean
    @Primary
    public AiClient aiClient(OpenAiClient openAi, ClaudeClient claude, HuggingFaceClient huggingFace,
                             @Value("${ai.provider:auto}") String provider) {
        if ("openai".equalsIgnoreCase(provider)) return openAi;
        if ("anthropic".equalsIgnoreCase(provider) || "claude".equalsIgnoreCase(provider)) return claude;
        if ("huggingface".equalsIgnoreCase(provider) || "hf".equalsIgnoreCase(provider)) return huggingFace;
        if (openAi.isConfigured()) return openAi;
        if (claude.isConfigured()) return claude;
        if (huggingFace.isConfigured()) return huggingFace;
        return openAi; // none configured — reports not-configured, callers handle it
    }
}
