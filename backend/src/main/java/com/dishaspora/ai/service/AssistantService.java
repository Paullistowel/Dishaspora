package com.dishaspora.ai.service;

import com.dishaspora.ai.dto.AiDtos.AssistantChatRequest;
import com.dishaspora.ai.dto.AiDtos.AssistantReply;
import com.dishaspora.ai.dto.AiDtos.SmartSearchResponse;
import com.dishaspora.ai.service.SmartSearchService.ParsedFilters;
import com.dishaspora.auth.entity.User;
import com.dishaspora.common.enums.Enums.ApprovalStatus;
import com.dishaspora.common.enums.Enums.Role;
import com.dishaspora.common.exception.PremiumRequiredException;
import com.dishaspora.recipe.dto.RecipeDto;
import com.dishaspora.recipe.entity.Ingredient;
import com.dishaspora.recipe.entity.Recipe;
import com.dishaspora.recipe.repository.RecipeRepository;
import com.dishaspora.recipe.service.RecipeMapper;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class AssistantService {

    private static final Pattern RECIPE_IDS_LINE =
            Pattern.compile("^\\s*RECIPE_IDS:\\s*([0-9,\\s]*)\\s*$", Pattern.MULTILINE);

    private final AiClient aiClient;
    private final SmartSearchService smartSearchService;
    private final RecipeRepository recipeRepository;
    private final RecipeMapper recipeMapper;

    public AssistantService(AiClient aiClient,
                            SmartSearchService smartSearchService,
                            RecipeRepository recipeRepository,
                            RecipeMapper recipeMapper) {
        this.aiClient = aiClient;
        this.smartSearchService = smartSearchService;
        this.recipeRepository = recipeRepository;
        this.recipeMapper = recipeMapper;
    }

    public AssistantReply chat(AssistantChatRequest request, User user) {
        if (user.getRole() != Role.ADMIN && !user.isPremiumActive()) {
            throw new PremiumRequiredException(
                    "Ask Dishaspora is a premium feature. Subscribe to Premium to chat with the assistant.");
        }
        if (aiClient.isConfigured()) {
            AssistantReply reply = claudeChat(request, user);
            if (reply != null) return reply;
        }
        return fallbackChat(request.message(), user);
    }

    public SmartSearchResponse smartSearch(String q, User user) {
        ParsedFilters filters = smartSearchService.parse(q);
        List<Recipe> matches = smartSearchService.match(filters, 10);
        return new SmartSearchResponse(filters.asMap(), recipeMapper.toDtos(matches, user));
    }

    private AssistantReply claudeChat(AssistantChatRequest request, User user) {
        String systemPrompt = """
                You are "Ask Dishaspora", the friendly cooking assistant of the Dishaspora platform \
                (African food, recipes and ingredients for Ghana and Nigeria and the diaspora).
                You may ONLY recommend and talk about recipes from the catalog below. Never invent \
                recipes that are not in the catalog. If nothing in the catalog fits, say so politely.
                Keep answers short (2-4 sentences), warm and friendly. Never give medical, dietary-\
                clinical or health advice; if asked, suggest talking to a professional.
                The catalog format is: id|title|cuisine|category|calories|totalMinutes|main ingredients.

                RECIPE CATALOG:
                %s

                IMPORTANT: End every reply with a final line exactly like:
                RECIPE_IDS: 1,5,9
                listing the ids (comma-separated, max 5) of the catalog recipes relevant to your \
                answer. If none are relevant, end with "RECIPE_IDS:" and nothing after the colon.
                """.formatted(buildCatalog());

        List<AiClient.Turn> history = request.history() == null ? List.of()
                : request.history().stream()
                        .map(t -> new AiClient.Turn(t.role(), t.content()))
                        .toList();

        String raw = aiClient.chat(systemPrompt, history, request.message());
        if (raw == null) return null;

        List<Long> ids = new ArrayList<>();
        Matcher matcher = RECIPE_IDS_LINE.matcher(raw);
        String reply = raw;
        if (matcher.find()) {
            for (String part : matcher.group(1).split(",")) {
                String trimmed = part.trim();
                if (!trimmed.isEmpty()) {
                    try {
                        ids.add(Long.parseLong(trimmed));
                    } catch (NumberFormatException ignored) {
                    }
                }
            }
            reply = new StringBuilder(raw).delete(matcher.start(), matcher.end()).toString().trim();
        }

        List<RecipeDto> recipes = ids.stream()
                .distinct()
                .limit(5)
                .map(id -> recipeRepository.findById(id).orElse(null))
                .filter(Objects::nonNull)
                .filter(r -> r.getStatus() == ApprovalStatus.APPROVED)
                .map(r -> recipeMapper.toDto(r, user))
                .toList();
        return new AssistantReply(reply, recipes);
    }

    private AssistantReply fallbackChat(String message, User user) {
        ParsedFilters filters = smartSearchService.parse(message);
        List<Recipe> matches = smartSearchService.match(filters, 5);
        String reply;
        if (matches.isEmpty()) {
            reply = "I couldn't find a recipe on Dishaspora matching that just yet. "
                    + "Try mentioning an ingredient (like chicken, rice or plantain), a cuisine "
                    + "(Ghanaian or Nigerian), or a time limit like \"under 30 minutes\".";
        } else {
            String names = matches.stream().map(Recipe::getTitle).collect(Collectors.joining(", "));
            StringBuilder sb = new StringBuilder("Great question! Based on our recipe collection, I'd suggest: ")
                    .append(names).append(".");
            if (filters.maxMinutes() != null) {
                sb.append(" All of these are ready in under ").append(filters.maxMinutes()).append(" minutes.");
            }
            if (filters.maxCalories() != null) {
                sb.append(" Each comes in under ").append(filters.maxCalories()).append(" calories.");
            }
            sb.append(" Tap a recipe below to see full ingredients and steps. Happy cooking!");
            reply = sb.toString();
        }
        return new AssistantReply(reply, recipeMapper.toDtos(matches, user));
    }

    /** Compact catalog of approved recipes injected into the Claude system prompt. */
    private String buildCatalog() {
        return recipeRepository.findByStatus(ApprovalStatus.APPROVED).stream()
                .map(r -> String.join("|",
                        String.valueOf(r.getId()),
                        r.getTitle(),
                        String.valueOf(r.getCuisine()),
                        r.getCategory().name(),
                        String.valueOf(r.getCalories()),
                        String.valueOf(r.totalMinutes()),
                        r.getIngredients().stream()
                                .limit(5)
                                .map(Ingredient::getName)
                                .collect(Collectors.joining(","))))
                .collect(Collectors.joining("\n"));
    }
}
