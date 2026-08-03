package com.dishaspora.ai.dto;

import com.dishaspora.recipe.dto.RecipeDto;
import jakarta.validation.constraints.NotBlank;

import java.util.List;
import java.util.Map;

public final class AiDtos {
    private AiDtos() {}

    public record HistoryTurn(String role, String content) {}

    public record AssistantChatRequest(@NotBlank String message, List<HistoryTurn> history) {}

    public record AssistantReply(String reply, List<RecipeDto> recipes) {}

    public record SmartSearchResponse(Map<String, Object> filters, List<RecipeDto> recipes) {}

    /** Personalized meal suggestions grouped by slot (Phase: AI personalization). */
    public record MealSuggestions(
            String note,
            List<RecipeDto> breakfast,
            List<RecipeDto> lunch,
            List<RecipeDto> dinner) {}
}
