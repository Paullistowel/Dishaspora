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
 * Hugging Face client implementing {@link AiClient} via the Inference Router,
 * which is OpenAI-compatible ({@code /v1/chat/completions}). This lets Snap &amp;
 * Cook + the AI assistant run on a free/low-cost HF token instead of OpenAI.
 *
 * <p>Configure with env vars:
 * <ul>
 *   <li>{@code HF_TOKEN} — your access token (https://huggingface.co/settings/tokens)</li>
 *   <li>{@code HF_MODEL} — chat model (default {@value #DEFAULT_MODEL})</li>
 *   <li>{@code HF_VISION_MODEL} — vision model (default {@value #DEFAULT_VISION_MODEL})</li>
 * </ul>
 * Returns null when no token is configured or a call fails, so callers fall back
 * to a clear "not configured" message rather than crashing.
 */
@Component
public class HuggingFaceClient implements AiClient {

    private static final Logger log = LoggerFactory.getLogger(HuggingFaceClient.class);
    private static final String BASE_URL = "https://router.huggingface.co";
    private static final String DEFAULT_MODEL = "meta-llama/Llama-3.1-8B-Instruct";
    private static final String DEFAULT_VISION_MODEL = "Qwen/Qwen2.5-VL-72B-Instruct";

    private final String apiKey;
    private final String model;
    private final String visionModel;
    private final RestClient restClient;

    public HuggingFaceClient(
            @Value("${huggingface.api-key:${HF_TOKEN:}}") String apiKey,
            @Value("${huggingface.model:${HF_MODEL:" + DEFAULT_MODEL + "}}") String model,
            @Value("${huggingface.vision-model:${HF_VISION_MODEL:" + DEFAULT_VISION_MODEL + "}}") String visionModel) {
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.model = (model == null || model.isBlank()) ? DEFAULT_MODEL : model.trim();
        this.visionModel = (visionModel == null || visionModel.isBlank()) ? DEFAULT_VISION_MODEL : visionModel.trim();
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
        return send(model, messages, 700);
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
        return send(visionModel, messages, maxTokens);
    }

    /** Low-level Chat Completions call (OpenAI-compatible); returns text or null. */
    @SuppressWarnings("unchecked")
    private String send(String modelId, List<Map<String, Object>> messages, int maxTokens) {
        try {
            Map<String, Object> body = Map.of(
                    "model", modelId,
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
            log.warn("Hugging Face request failed ({}): {}", modelId, e.getMessage());
            return null;
        }
    }
}
