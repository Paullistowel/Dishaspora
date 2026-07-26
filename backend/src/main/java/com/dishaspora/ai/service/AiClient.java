package com.dishaspora.ai.service;

import java.util.List;

/**
 * Provider-agnostic AI client for text chat and single-image vision. Implemented
 * by {@link ClaudeClient} (Anthropic) and {@link OpenAiClient} (OpenAI); the active
 * one is selected in {@code AiConfig} based on which API key is configured.
 */
public interface AiClient {

    record Turn(String role, String content) {}

    boolean isConfigured();

    /** Returns the assistant text, or null when unconfigured / on failure. */
    String chat(String systemPrompt, List<Turn> history, String userMessage);

    /**
     * Sends one image plus an instruction and returns the assistant text, or null.
     * {@code mediaType} is an image MIME type such as {@code image/jpeg}.
     */
    String vision(String systemPrompt, String base64Image, String mediaType,
                  String instruction, int maxTokens);
}
