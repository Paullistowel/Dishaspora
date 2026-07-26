package com.dishaspora.nutrition.controller;

import com.dishaspora.auth.entity.User;
import com.dishaspora.nutrition.dto.NutritionDtos.DaySummaryDto;
import com.dishaspora.nutrition.dto.NutritionDtos.DayTotalsDto;
import com.dishaspora.nutrition.dto.NutritionDtos.GoalsDto;
import com.dishaspora.nutrition.dto.NutritionDtos.WaterRequest;
import com.dishaspora.nutrition.service.NutritionService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/** Calorie / macro / water tracking (Phase 5): day summary, range reports, water, goals. */
@RestController
@RequestMapping("/api/diary")
public class DiaryController {

    private final NutritionService service;

    public DiaryController(NutritionService service) {
        this.service = service;
    }

    /** Full day: goals, consumed/remaining calories, macros, water, and the meals. */
    @GetMapping("/day")
    public DaySummaryDto day(@AuthenticationPrincipal User user,
                             @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return service.daySummary(user, date);
    }

    /** Per-day totals over a range for weekly/monthly charts and reports. */
    @GetMapping("/range")
    public List<DayTotalsDto> range(
            @AuthenticationPrincipal User user,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return service.rangeTotals(user, from, to);
    }

    /** Add (or subtract, with a negative value) water for a day; returns the updated summary. */
    @PostMapping("/water")
    public DaySummaryDto water(@AuthenticationPrincipal User user, @Valid @RequestBody WaterRequest req) {
        return service.addWater(user, req);
    }

    @GetMapping("/goals")
    public GoalsDto goals(@AuthenticationPrincipal User user) {
        return service.goals(user);
    }

    @PutMapping("/goals")
    public GoalsDto updateGoals(@AuthenticationPrincipal User user, @RequestBody GoalsDto req) {
        return service.updateGoals(user, req);
    }
}
