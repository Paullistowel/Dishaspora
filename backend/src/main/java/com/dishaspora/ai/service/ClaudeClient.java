package com.dishaspora.ai.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Minimal Anthropic Messages API client. Returns null when no API key is
 * configured or when the call fails, so callers can fall back to the
 * rule-based assistant.
 */
@Component
public class ClaudeClient implements AiClient {

    private static final String BASE_URL = "https://api.anthropic.com";
    private static final String MODEL = "claude-sonnet-5";
    private static final String API_VERSION = "2023-06-01";

    private final String apiKey;
    private final RestClient restClient;

    public ClaudeClient(@Value("${anthropic.api-key:}") String apiKey) {
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.restClient = RestClient.builder().baseUrl(BASE_URL).build();
    }

    @Override
    public boolean isConfigured() {
        return !apiKey.isBlank();
    }

    /**
     * Sends a chat to Claude and returns the assistant text, or null on failure.
     */
    @Override
    public String chat(String systemPrompt, List<Turn> history, String userMessage) {
        if (!isConfigured()) return null;
        List<Map<String, Object>> messages = new ArrayList<>();
        if (history != null) {
            for (Turn turn : history) {
                if (turn.content() == null || turn.content().isBlank()) continue;
                String role = "assistant".equalsIgnoreCase(turn.role()) ? "assistant" : "user";
                messages.add(Map.<String, Object>of("role", role, "content", turn.content()));
            }
        }
        messages.add(Map.<String, Object>of("role", "user", "content", userMessage));
        return send(systemPrompt, messages, 700);
    }

    /**
     * Sends a single image plus an instruction to Claude's vision model and returns
     * the assistant text, or null on failure / when unconfigured. {@code mediaType}
     * is an image MIME type such as {@code image/jpeg} or {@code image/png}.
     */
    @Override
    public String vision(String systemPrompt, String base64Image, String mediaType,
                         String instruction, int maxTokens) {
        if (!isConfigured()) return null;
        Map<String, Object> imageBlock = Map.of(
                "type", "image",
                "source", Map.of(
                        "type", "base64",
                        "media_type", mediaType,
                        "data", base64Image));
        Map<String, Object> textBlock = Map.<String, Object>of("type", "text", "text", instruction);
        List<Map<String, Object>> messages = List.of(
                Map.<String, Object>of("role", "user", "content", List.of(imageBlock, textBlock)));
        return send(systemPrompt, messages, maxTokens);
    }

    /** Low-level Messages API call; returns concatenated text blocks or null. */
    @SuppressWarnings("unchecked")
    private String send(String systemPrompt, List<Map<String, Object>> messages, int maxTokens) {
        try {
            Map<String, Object> body = Map.of(
                    "model", MODEL,
                    "max_tokens", maxTokens,
                    "system", systemPrompt,
                    "messages", messages);

            Map<String, Object> response = restClient.post()
                    .uri("/v1/messages")
                    .header("x-api-key", apiKey)
                    .header("anthropic-version", API_VERSION)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            if (response == null || !(response.get("content") instanceof List<?> content)) {
                return null;
            }
            StringBuilder text = new StringBuilder();
            for (Object block : content) {
                if (block instanceof Map<?, ?> map && "text".equals(map.get("type"))) {
                    text.append(map.get("text"));
                }
            }
            return text.isEmpty() ? null : text.toString();
        } catch (Exception e) {
            return null;
        }
    }
}
