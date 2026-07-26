package com.dishaspora.ai.dto;

import com.dishaspora.recipe.dto.RecipeDto;

import java.util.List;

/**
 * DTOs for the "Snap &amp; Cook" feature: the user photographs a dish or their
 * ingredients and the backend uses Claude vision to identify it, generate a
 * recipe and estimate nutrition, then links any matching catalog recipes.
 */
public final class SnapDtos {
    private SnapDtos() {}

    public record SnapIngredient(String name, String quantity) {}

    public record SnapStep(int number, String instruction) {}

    public record SnapNutrition(int calories, int protein, int carbs, int fat, int servings) {}

    public record SnapResult(
            String dishName,
            String description,
            String cuisine,
            int confidence,
            boolean isFood,
            List<SnapIngredient> ingredients,
            List<SnapStep> steps,
            SnapNutrition nutrition,
            List<RecipeDto> matchedRecipes) {}

    // --- Ingredient scan → recipe recommendations ---

    public record DetectedIngredient(String name, int confidence) {}

    /** A recipe you can (mostly) make from what was detected. */
    public record MissingIngredient(String name, String quantity, String substitution) {}

    public record RecipeMatch(
            RecipeDto recipe,
            String difficulty,          // Easy | Medium | Hard (derived from time + steps)
            int cookTimeMinutes,        // prep + cook
            int matchPercent,           // % of the recipe's ingredients you already have
            List<String> haveIngredients,
            List<MissingIngredient> missingIngredients) {}

    public record IngredientScanResult(
            List<DetectedIngredient> detectedIngredients,
            List<RecipeMatch> recommendations) {}

    /** Type-your-ingredients fallback (no photo/AI needed). */
    public record IngredientListRequest(List<String> ingredients) {}
}
