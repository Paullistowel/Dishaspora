package com.dishaspora.meal.controller;

import com.dishaspora.common.exception.ApiException;
import com.dishaspora.meal.dto.MealDbDtos.ExternalMeal;
import com.dishaspora.meal.dto.MealDbDtos.MealSummary;
import com.dishaspora.meal.dto.MealDbDtos.SearchResult;
import com.dishaspora.meal.service.MealDbClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Backend proxy for TheMealDB. The mobile app calls these endpoints (never
 * TheMealDB directly). Search returns a {@link SearchResult} envelope with a
 * count so the client can render a clean "No meals found" state.
 */
@RestController
@RequestMapping("/api/meals")
public class MealController {

    private final MealDbClient client;

    public MealController(MealDbClient client) {
        this.client = client;
    }

    @GetMapping("/search")
    public SearchResult search(@RequestParam(required = false, defaultValue = "") String q) {
        String query = q == null ? "" : q.trim();
        if (query.isEmpty()) {
            return new SearchResult("", 0, List.of());
        }
        List<ExternalMeal> meals = client.searchByName(query);
        return new SearchResult(query, meals.size(), meals);
    }

    @GetMapping("/random")
    public ExternalMeal random() {
        return client.random();
    }

    @GetMapping("/categories")
    public List<String> categories() {
        return client.categories();
    }

    @GetMapping("/areas")
    public List<String> areas() {
        return client.areas();
    }

    @GetMapping("/ingredients")
    public List<String> ingredients() {
        return client.ingredients();
    }

    @GetMapping("/filter")
    public List<MealSummary> filter(@RequestParam(required = false) String category,
                                    @RequestParam(required = false) String area,
                                    @RequestParam(required = false) String ingredient) {
        return client.filter(category, area, ingredient);
    }

    /** Lookup must come last so it doesn't shadow the literal paths above. */
    @GetMapping("/{id}")
    public ExternalMeal lookup(@PathVariable String id) {
        ExternalMeal meal = client.lookup(id);
        if (meal == null) {
            throw ApiException.notFound("No meal found with id " + id + ".");
        }
        return meal;
    }
}
