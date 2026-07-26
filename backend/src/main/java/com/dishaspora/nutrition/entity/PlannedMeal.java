package com.dishaspora.nutrition.entity;

import com.dishaspora.common.enums.Enums.MealType;
import jakarta.persistence.*;

import java.time.Instant;
import java.time.LocalDate;

/**
 * A meal on a user's plan for a given day and slot. Doubles as the calorie-tracking
 * unit: when {@code eaten} is true it counts toward the day's consumed totals.
 */
@Entity
@Table(name = "planned_meals", indexes = {
        @Index(name = "idx_planned_user_date", columnList = "userId,date")
})
public class PlannedMeal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private LocalDate date;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MealType slot;

    @Column(nullable = false)
    private String title;

    /** Optional link to a catalog recipe this meal came from. */
    private Long recipeId;
    private String imageUrl;

    private double servings = 1;
    private int calories;
    private int protein;
    private int carbs;
    private int fat;

    private boolean eaten;

    @Column(length = 500)
    private String notes;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public MealType getSlot() { return slot; }
    public void setSlot(MealType slot) { this.slot = slot; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public Long getRecipeId() { return recipeId; }
    public void setRecipeId(Long recipeId) { this.recipeId = recipeId; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public double getServings() { return servings; }
    public void setServings(double servings) { this.servings = servings; }
    public int getCalories() { return calories; }
    public void setCalories(int calories) { this.calories = calories; }
    public int getProtein() { return protein; }
    public void setProtein(int protein) { this.protein = protein; }
    public int getCarbs() { return carbs; }
    public void setCarbs(int carbs) { this.carbs = carbs; }
    public int getFat() { return fat; }
    public void setFat(int fat) { this.fat = fat; }
    public boolean isEaten() { return eaten; }
    public void setEaten(boolean eaten) { this.eaten = eaten; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
