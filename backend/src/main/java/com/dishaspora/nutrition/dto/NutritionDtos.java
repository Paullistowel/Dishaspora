package com.dishaspora.nutrition.dto;

import com.dishaspora.common.enums.Enums.MealType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

public final class NutritionDtos {
    private NutritionDtos() {}

    public record PlannedMealDto(Long id, LocalDate date, MealType slot, String title,
                                 Long recipeId, String imageUrl, double servings,
                                 int calories, int protein, int carbs, int fat,
                                 boolean eaten, String notes) {}

    public record PlannedMealRequest(
            @NotNull LocalDate date,
            @NotNull MealType slot,
            @NotBlank String title,
            Long recipeId,
            String imageUrl,
            Double servings,
            @Min(0) int calories,
            @Min(0) int protein,
            @Min(0) int carbs,
            @Min(0) int fat,
            Boolean eaten,
            String notes) {}

    public record DuplicateRequest(@NotNull LocalDate date, MealType slot) {}

    public record EatenRequest(boolean eaten) {}

    /** One macro's consumed value against its goal. */
    public record MacroProgress(int consumed, int goal) {}

    /** Full day view: goals, consumed/remaining, water, and the meals grouped by slot. */
    public record DaySummaryDto(
            LocalDate date,
            int calorieGoal, int caloriesConsumed, int caloriesRemaining, int caloriesPlanned,
            MacroProgress protein, MacroProgress carbs, MacroProgress fat,
            int waterMl, int waterGoalMl,
            List<PlannedMealDto> meals) {}

    /** Per-day totals for weekly/monthly charts and reports. */
    public record DayTotalsDto(LocalDate date, int calories, int protein, int carbs, int fat, int waterMl) {}

    public record GoalsDto(int calorieGoal, int proteinGoal, int carbGoal, int fatGoal, int waterGoalMl) {}

    public record WaterRequest(@NotNull LocalDate date, int milliliters) {}

    public record GeneratePlanRequest(@NotNull LocalDate startDate, @Min(1) int days) {}
}
