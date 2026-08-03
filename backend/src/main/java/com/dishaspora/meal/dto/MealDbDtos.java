package com.dishaspora.meal.dto;

import java.util.List;

/**
 * Clean, consistent DTOs the app exposes for external (TheMealDB) meal data.
 * TheMealDB's raw shape (strMeal, strIngredient1..20, …) is mapped into these in
 * {@link com.dishaspora.meal.service.MealDbClient} so the mobile app never sees
 * the upstream format and never calls TheMealDB directly.
 */
public class MealDbDtos {

    public record MealIngredient(String name, String measure) {}

    /** Full meal detail (search + lookup). */
    public record ExternalMeal(
            String id,
            String name,
            String category,
            String area,
            String instructions,
            String imageUrl,
            String youtubeUrl,
            List<String> tags,
            List<MealIngredient> ingredients) {}

    /** Lightweight card (filter-by-category/area/ingredient results). */
    public record MealSummary(String id, String name, String imageUrl) {}

    /** Search envelope so the client can render a clean "no meals found" state. */
    public record SearchResult(String query, int count, List<ExternalMeal> meals) {}
}
