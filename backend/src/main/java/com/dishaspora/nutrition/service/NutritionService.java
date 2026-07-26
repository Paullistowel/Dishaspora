package com.dishaspora.nutrition.service;

import com.dishaspora.auth.entity.User;
import com.dishaspora.auth.repository.UserRepository;
import com.dishaspora.common.enums.Enums.ApprovalStatus;
import com.dishaspora.common.enums.Enums.MealType;
import com.dishaspora.common.exception.ApiException;
import com.dishaspora.nutrition.dto.NutritionDtos.*;
import com.dishaspora.nutrition.entity.PlannedMeal;
import com.dishaspora.nutrition.entity.WaterLog;
import com.dishaspora.nutrition.repository.PlannedMealRepository;
import com.dishaspora.nutrition.repository.WaterLogRepository;
import com.dishaspora.recipe.entity.Recipe;
import com.dishaspora.recipe.repository.RecipeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class NutritionService {

    private static final List<MealType> PLAN_SLOTS = List.of(MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER);

    private final PlannedMealRepository mealRepo;
    private final WaterLogRepository waterRepo;
    private final UserRepository userRepo;
    private final RecipeRepository recipeRepo;

    public NutritionService(PlannedMealRepository mealRepo, WaterLogRepository waterRepo,
                            UserRepository userRepo, RecipeRepository recipeRepo) {
        this.mealRepo = mealRepo;
        this.waterRepo = waterRepo;
        this.userRepo = userRepo;
        this.recipeRepo = recipeRepo;
    }

    // --- Meal CRUD ---

    @Transactional
    public PlannedMealDto addMeal(User user, PlannedMealRequest req) {
        PlannedMeal meal = new PlannedMeal();
        meal.setUserId(user.getId());
        apply(meal, req);
        return toDto(mealRepo.save(meal));
    }

    @Transactional
    public PlannedMealDto updateMeal(User user, Long id, PlannedMealRequest req) {
        PlannedMeal meal = owned(user, id);
        apply(meal, req);
        return toDto(mealRepo.save(meal));
    }

    @Transactional
    public void deleteMeal(User user, Long id) {
        mealRepo.delete(owned(user, id));
    }

    @Transactional
    public PlannedMealDto duplicateMeal(User user, Long id, DuplicateRequest req) {
        PlannedMeal src = owned(user, id);
        PlannedMeal copy = new PlannedMeal();
        copy.setUserId(user.getId());
        copy.setDate(req.date());
        copy.setSlot(req.slot() != null ? req.slot() : src.getSlot());
        copy.setTitle(src.getTitle());
        copy.setRecipeId(src.getRecipeId());
        copy.setImageUrl(src.getImageUrl());
        copy.setServings(src.getServings());
        copy.setCalories(src.getCalories());
        copy.setProtein(src.getProtein());
        copy.setCarbs(src.getCarbs());
        copy.setFat(src.getFat());
        copy.setNotes(src.getNotes());
        return toDto(mealRepo.save(copy));
    }

    @Transactional
    public PlannedMealDto setEaten(User user, Long id, boolean eaten) {
        PlannedMeal meal = owned(user, id);
        meal.setEaten(eaten);
        return toDto(mealRepo.save(meal));
    }

    public List<PlannedMealDto> mealsInRange(User user, LocalDate from, LocalDate to) {
        return mealRepo.findByUserIdAndDateBetweenOrderByDateAscSlotAscIdAsc(user.getId(), from, to)
                .stream().map(this::toDto).toList();
    }

    // --- Day summary (calorie/macro/water tracking) ---

    public DaySummaryDto daySummary(User user, LocalDate date) {
        User fresh = userRepo.findById(user.getId()).orElse(user);
        List<PlannedMeal> meals = mealRepo.findByUserIdAndDateOrderBySlotAscIdAsc(user.getId(), date);
        int planned = meals.stream().mapToInt(PlannedMeal::getCalories).sum();
        List<PlannedMeal> eaten = meals.stream().filter(PlannedMeal::isEaten).toList();
        int cals = eaten.stream().mapToInt(PlannedMeal::getCalories).sum();
        int protein = eaten.stream().mapToInt(PlannedMeal::getProtein).sum();
        int carbs = eaten.stream().mapToInt(PlannedMeal::getCarbs).sum();
        int fat = eaten.stream().mapToInt(PlannedMeal::getFat).sum();
        int water = waterRepo.findByUserIdAndDate(user.getId(), date).map(WaterLog::getMilliliters).orElse(0);
        return new DaySummaryDto(
                date,
                fresh.getCalorieGoal(), cals, fresh.getCalorieGoal() - cals, planned,
                new MacroProgress(protein, fresh.getProteinGoal()),
                new MacroProgress(carbs, fresh.getCarbGoal()),
                new MacroProgress(fat, fresh.getFatGoal()),
                water, fresh.getWaterGoalMl(),
                meals.stream().map(this::toDto).toList());
    }

    /** Per-day totals across a range (weekly/monthly charts & reports). */
    public List<DayTotalsDto> rangeTotals(User user, LocalDate from, LocalDate to) {
        Map<LocalDate, List<PlannedMeal>> byDate = mealRepo
                .findByUserIdAndDateBetweenOrderByDateAscSlotAscIdAsc(user.getId(), from, to)
                .stream().filter(PlannedMeal::isEaten)
                .collect(Collectors.groupingBy(PlannedMeal::getDate));
        Map<LocalDate, Integer> waterByDate = waterRepo.findByUserIdAndDateBetween(user.getId(), from, to)
                .stream().collect(Collectors.toMap(WaterLog::getDate, WaterLog::getMilliliters, (a, b) -> a));
        List<DayTotalsDto> out = new ArrayList<>();
        for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
            List<PlannedMeal> ms = byDate.getOrDefault(d, List.of());
            out.add(new DayTotalsDto(d,
                    ms.stream().mapToInt(PlannedMeal::getCalories).sum(),
                    ms.stream().mapToInt(PlannedMeal::getProtein).sum(),
                    ms.stream().mapToInt(PlannedMeal::getCarbs).sum(),
                    ms.stream().mapToInt(PlannedMeal::getFat).sum(),
                    waterByDate.getOrDefault(d, 0)));
        }
        return out;
    }

    // --- Water ---

    @Transactional
    public DaySummaryDto addWater(User user, WaterRequest req) {
        WaterLog log = waterRepo.findByUserIdAndDate(user.getId(), req.date())
                .orElseGet(() -> new WaterLog(user.getId(), req.date(), 0));
        log.setMilliliters(Math.max(0, log.getMilliliters() + req.milliliters()));
        waterRepo.save(log);
        return daySummary(user, req.date());
    }

    // --- Goals ---

    public GoalsDto goals(User user) {
        User fresh = userRepo.findById(user.getId()).orElse(user);
        return new GoalsDto(fresh.getCalorieGoal(), fresh.getProteinGoal(),
                fresh.getCarbGoal(), fresh.getFatGoal(), fresh.getWaterGoalMl());
    }

    @Transactional
    public GoalsDto updateGoals(User user, GoalsDto req) {
        User u = userRepo.findById(user.getId()).orElseThrow(() -> ApiException.unauthorized("User not found"));
        if (req.calorieGoal() > 0) u.setCalorieGoal(req.calorieGoal());
        if (req.proteinGoal() > 0) u.setProteinGoal(req.proteinGoal());
        if (req.carbGoal() > 0) u.setCarbGoal(req.carbGoal());
        if (req.fatGoal() > 0) u.setFatGoal(req.fatGoal());
        if (req.waterGoalMl() > 0) u.setWaterGoalMl(req.waterGoalMl());
        userRepo.save(u);
        return goals(u);
    }

    // --- AI / catalog meal-plan generation ---

    @Transactional
    public List<PlannedMealDto> generatePlan(User user, GeneratePlanRequest req) {
        List<Recipe> catalog = recipeRepo.findByStatus(ApprovalStatus.APPROVED);
        if (catalog.isEmpty()) {
            throw ApiException.badRequest("There are no recipes to build a plan from yet.");
        }
        User fresh = userRepo.findById(user.getId()).orElse(user);
        Map<MealType, List<Recipe>> bySlot = catalog.stream()
                .collect(Collectors.groupingBy(r -> planSlot(r.getMealType())));

        List<PlannedMeal> created = new ArrayList<>();
        int perMealTarget = Math.max(300, fresh.getCalorieGoal() / PLAN_SLOTS.size());
        for (int day = 0; day < req.days(); day++) {
            LocalDate date = req.startDate().plusDays(day);
            for (int s = 0; s < PLAN_SLOTS.size(); s++) {
                MealType slot = PLAN_SLOTS.get(s);
                Recipe pick = pickRecipe(bySlot, slot, catalog, perMealTarget, day * PLAN_SLOTS.size() + s);
                if (pick == null) continue;
                PlannedMeal meal = new PlannedMeal();
                meal.setUserId(user.getId());
                meal.setDate(date);
                meal.setSlot(slot);
                meal.setTitle(pick.getTitle());
                meal.setRecipeId(pick.getId());
                meal.setImageUrl(pick.getImageUrl());
                meal.setServings(1);
                meal.setCalories(pick.getCalories());
                meal.setProtein(estimateMacro(pick.getCalories(), 0.25, 4));
                meal.setCarbs(estimateMacro(pick.getCalories(), 0.50, 4));
                meal.setFat(estimateMacro(pick.getCalories(), 0.25, 9));
                created.add(meal);
            }
        }
        return mealRepo.saveAll(created).stream().map(this::toDto).toList();
    }

    // --- helpers ---

    private void apply(PlannedMeal meal, PlannedMealRequest req) {
        meal.setDate(req.date());
        meal.setSlot(req.slot());
        meal.setTitle(req.title());
        meal.setRecipeId(req.recipeId());
        meal.setImageUrl(req.imageUrl());
        meal.setServings(req.servings() == null ? 1 : req.servings());
        meal.setCalories(req.calories());
        meal.setProtein(req.protein());
        meal.setCarbs(req.carbs());
        meal.setFat(req.fat());
        if (req.eaten() != null) meal.setEaten(req.eaten());
        meal.setNotes(req.notes());
    }

    private PlannedMeal owned(User user, Long id) {
        PlannedMeal meal = mealRepo.findById(id)
                .orElseThrow(() -> ApiException.badRequest("Meal not found"));
        if (!meal.getUserId().equals(user.getId())) {
            throw ApiException.forbidden("You can only modify your own meals.");
        }
        return meal;
    }

    /** Map any recipe meal type onto one of the three plan slots. */
    private MealType planSlot(MealType t) {
        if (t == MealType.BREAKFAST || t == MealType.LUNCH || t == MealType.DINNER) return t;
        return MealType.LUNCH; // snacks/drinks default into lunch bucket for planning
    }

    /** Choose a recipe for the slot closest to the calorie target, rotating by index for variety. */
    private Recipe pickRecipe(Map<MealType, List<Recipe>> bySlot, MealType slot,
                              List<Recipe> catalog, int target, int rotation) {
        List<Recipe> pool = bySlot.getOrDefault(slot, catalog);
        if (pool.isEmpty()) pool = catalog;
        List<Recipe> ranked = pool.stream()
                .sorted(Comparator.comparingInt(r -> Math.abs(r.getCalories() - target)))
                .limit(Math.max(1, Math.min(8, pool.size())))
                .toList();
        return ranked.get(rotation % ranked.size());
    }

    private int estimateMacro(int calories, double share, int kcalPerGram) {
        return (int) Math.round((calories * share) / kcalPerGram);
    }

    private PlannedMealDto toDto(PlannedMeal m) {
        return new PlannedMealDto(m.getId(), m.getDate(), m.getSlot(), m.getTitle(),
                m.getRecipeId(), m.getImageUrl(), m.getServings(),
                m.getCalories(), m.getProtein(), m.getCarbs(), m.getFat(), m.isEaten(), m.getNotes());
    }
}
