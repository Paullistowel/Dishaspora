package com.dishaspora.ai.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * OpenAI (ChatGPT) client implementing {@link AiClient} via the Chat Completions
 * API. Supports text chat and single-image vision (gpt-4o family). Returns null
 * when no key is configured or the call fails, so callers can fall back.
 */
@Component
public class OpenAiClient implements AiClient {

    private static final Logger log = LoggerFactory.getLogger(OpenAiClient.class);
    private static final String BASE_URL = "https://api.openai.com";
    private static final String MODEL = "gpt-4o";

    private final String apiKey;
    private final RestClient restClient;

    public OpenAiClient(@Value("${openai.api-key:}") String apiKey) {
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.restClient = RestClient.builder().baseUrl(BASE_URL).build();
    }

    @Override
    public boolean isConfigured() {
        return !apiKey.isBlank();
    }

    @Override
    public String chat(String systemPrompt, List<Turn> history, String userMessage) {
        if (!isConfigured()) return null;
        List<Map<String, Object>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", systemPrompt));
        if (history != null) {
            for (Turn turn : history) {
                if (turn.content() == null || turn.content().isBlank()) continue;
                String role = "assistant".equalsIgnoreCase(turn.role()) ? "assistant" : "user";
                messages.add(Map.<String, Object>of("role", role, "content", turn.content()));
            }
        }
        messages.add(Map.<String, Object>of("role", "user", "content", userMessage));
        return send(messages, 700);
    }

    @Override
    public String vision(String systemPrompt, String base64Image, String mediaType,
                         String instruction, int maxTokens) {
        if (!isConfigured()) return null;
        Map<String, Object> textPart = Map.of("type", "text", "text", instruction);
        Map<String, Object> imagePart = Map.of(
                "type", "image_url",
                "image_url", Map.of("url", "data:" + mediaType + ";base64," + base64Image));
        List<Map<String, Object>> messages = List.of(
                Map.<String, Object>of("role", "system", "content", systemPrompt),
                Map.<String, Object>of("role", "user", "content", List.of(textPart, imagePart)));
        return send(messages, maxTokens);
    }

    /** Low-level Chat Completions call; returns the first message's text or null. */
    @SuppressWarnings("unchecked")
    private String send(List<Map<String, Object>> messages, int maxTokens) {
        try {
            Map<String, Object> body = Map.of(
                    "model", MODEL,
                    "max_tokens", maxTokens,
                    "messages", messages);

            Map<String, Object> response = restClient.post()
                    .uri("/v1/chat/completions")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            if (response == null || !(response.get("choices") instanceof List<?> choices) || choices.isEmpty()) {
                return null;
            }
            if (!(choices.get(0) instanceof Map<?, ?> choice)
                    || !(choice.get("message") instanceof Map<?, ?> message)) {
                return null;
            }
            Object content = message.get("content");
            String text = content == null ? "" : content.toString();
            return text.isBlank() ? null : text;
        } catch (Exception e) {
            log.warn("OpenAI request failed: {}", e.getMessage());
            return null;
        }
    }
}
