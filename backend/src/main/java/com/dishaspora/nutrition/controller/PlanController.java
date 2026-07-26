package com.dishaspora.nutrition.controller;

import com.dishaspora.auth.entity.User;
import com.dishaspora.nutrition.dto.NutritionDtos.DuplicateRequest;
import com.dishaspora.nutrition.dto.NutritionDtos.EatenRequest;
import com.dishaspora.nutrition.dto.NutritionDtos.GeneratePlanRequest;
import com.dishaspora.nutrition.dto.NutritionDtos.PlannedMealDto;
import com.dishaspora.nutrition.dto.NutritionDtos.PlannedMealRequest;
import com.dishaspora.nutrition.service.NutritionService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/** Meal planning (Phase 4): day/week/month planner with add/edit/delete/duplicate/generate. */
@RestController
@RequestMapping("/api/plan")
public class PlanController {

    private final NutritionService service;

    public PlanController(NutritionService service) {
        this.service = service;
    }

    /** Planned meals in a date range (a day, a week, or a month). */
    @GetMapping
    public List<PlannedMealDto> range(
            @AuthenticationPrincipal User user,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return service.mealsInRange(user, from, to);
    }

    @PostMapping
    public PlannedMealDto add(@AuthenticationPrincipal User user,
                              @Valid @RequestBody PlannedMealRequest req) {
        return service.addMeal(user, req);
    }

    @PutMapping("/{id}")
    public PlannedMealDto update(@AuthenticationPrincipal User user, @PathVariable Long id,
                                 @Valid @RequestBody PlannedMealRequest req) {
        return service.updateMeal(user, id, req);
    }

    @DeleteMapping("/{id}")
    public void delete(@AuthenticationPrincipal User user, @PathVariable Long id) {
        service.deleteMeal(user, id);
    }

    @PostMapping("/{id}/duplicate")
    public PlannedMealDto duplicate(@AuthenticationPrincipal User user, @PathVariable Long id,
                                    @Valid @RequestBody DuplicateRequest req) {
        return service.duplicateMeal(user, id, req);
    }

    @PostMapping("/{id}/eaten")
    public PlannedMealDto eaten(@AuthenticationPrincipal User user, @PathVariable Long id,
                                @RequestBody EatenRequest req) {
        return service.setEaten(user, id, req.eaten());
    }

    @PostMapping("/generate")
    public List<PlannedMealDto> generate(@AuthenticationPrincipal User user,
                                         @Valid @RequestBody GeneratePlanRequest req) {
        return service.generatePlan(user, req);
    }
}
