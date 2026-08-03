package com.dishaspora.meal.service;

import com.dishaspora.common.exception.ApiException;
import com.dishaspora.meal.dto.MealDbDtos.ExternalMeal;
import com.dishaspora.meal.dto.MealDbDtos.MealIngredient;
import com.dishaspora.meal.dto.MealDbDtos.MealSummary;
import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

/**
 * Server-side client for TheMealDB (https://www.themealdb.com/api.php). Maps the
 * upstream shape into our own {@link ExternalMeal} DTOs, applies request timeouts,
 * and caches responses (TheMealDB data is effectively static). The mobile app
 * talks only to our controller — never to TheMealDB directly.
 */
@Service
public class MealDbClient {

    private static final Logger log = LoggerFactory.getLogger(MealDbClient.class);

    private final RestClient rc;

    public MealDbClient(@Value("${themealdb.api-key:1}") String apiKey) {
        SimpleClientHttpRequestFactory f = new SimpleClientHttpRequestFactory();
        f.setConnectTimeout(Duration.ofSeconds(6));
        f.setReadTimeout(Duration.ofSeconds(8));
        this.rc = RestClient.builder()
                .baseUrl("https://www.themealdb.com/api/json/v1/" + apiKey)
                .requestFactory(f)
                .build();
    }

    /** Full-text search by meal name. Returns [] when nothing matches. */
    @Cacheable("mealdb-search")
    public List<ExternalMeal> searchByName(String query) {
        JsonNode root = get("/search.php", "s", query);
        return mapMeals(root);
    }

    /** Full meal by TheMealDB id, or null when not found. */
    @Cacheable("mealdb-lookup")
    public ExternalMeal lookup(String id) {
        JsonNode root = get("/lookup.php", "i", id);
        List<ExternalMeal> meals = mapMeals(root);
        return meals.isEmpty() ? null : meals.get(0);
    }

    /** A random meal (never cached). */
    public ExternalMeal random() {
        JsonNode root = get("/random.php", null, null);
        List<ExternalMeal> meals = mapMeals(root);
        if (meals.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Could not fetch a random meal right now.");
        }
        return meals.get(0);
    }

    @Cacheable("mealdb-categories")
    public List<String> categories() {
        return names(get("/list.php", "c", "list"), "strCategory");
    }

    @Cacheable("mealdb-areas")
    public List<String> areas() {
        return names(get("/list.php", "a", "list"), "strArea");
    }

    @Cacheable("mealdb-ingredients")
    public List<String> ingredients() {
        return names(get("/list.php", "i", "list"), "strIngredient");
    }

    /** Filter by exactly one of category / area / ingredient — returns card summaries. */
    @Cacheable("mealdb-filter")
    public List<MealSummary> filter(String category, String area, String ingredient) {
        String param;
        String value;
        if (category != null && !category.isBlank()) { param = "c"; value = category.trim(); }
        else if (area != null && !area.isBlank()) { param = "a"; value = area.trim(); }
        else if (ingredient != null && !ingredient.isBlank()) { param = "i"; value = ingredient.trim(); }
        else throw ApiException.badRequest("Provide one of: category, area, or ingredient.");

        JsonNode root = get("/filter.php", param, value);
        List<MealSummary> out = new ArrayList<>();
        JsonNode meals = root.path("meals");
        if (meals.isArray()) {
            for (JsonNode m : meals) {
                out.add(new MealSummary(text(m, "idMeal"), text(m, "strMeal"), text(m, "strMealThumb")));
            }
        }
        return out;
    }

    // --- internals ---

    private JsonNode get(String path, String param, String value) {
        try {
            RestClient.RequestHeadersSpec<?> spec = rc.get().uri(uri -> {
                var b = uri.path(path);
                if (param != null) b.queryParam(param, value);
                return b.build();
            });
            JsonNode body = spec.retrieve().body(JsonNode.class);
            if (body == null) {
                throw new ApiException(HttpStatus.BAD_GATEWAY, "TheMealDB returned an empty response.");
            }
            return body;
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            // Timeouts / connection / parse failures — surface a clean 502 the app
            // can show a retry for, and log the full cause for ops.
            log.error("TheMealDB request failed ({} {}={}): {}", path, param, value, e.getMessage(), e);
            throw new ApiException(HttpStatus.BAD_GATEWAY,
                    "The meal service is unavailable right now. Please try again.");
        }
    }

    /** Maps a {"meals": [...]} / {"meals": null} payload into full ExternalMeals. */
    private List<ExternalMeal> mapMeals(JsonNode root) {
        List<ExternalMeal> out = new ArrayList<>();
        JsonNode meals = root.path("meals");
        if (meals.isArray()) {
            for (JsonNode m : meals) out.add(toMeal(m));
        }
        return out; // meals:null (no match) → empty list
    }

    private ExternalMeal toMeal(JsonNode m) {
        List<MealIngredient> ingredients = new ArrayList<>();
        for (int i = 1; i <= 20; i++) {
            String name = text(m, "strIngredient" + i);
            if (name == null || name.isBlank()) continue;
            String measure = text(m, "strMeasure" + i);
            ingredients.add(new MealIngredient(name.trim(), measure == null ? "" : measure.trim()));
        }
        List<String> tags = new ArrayList<>();
        String rawTags = text(m, "strTags");
        if (rawTags != null && !rawTags.isBlank()) {
            for (String t : rawTags.split(",")) if (!t.isBlank()) tags.add(t.trim());
        }
        return new ExternalMeal(
                text(m, "idMeal"),
                text(m, "strMeal"),
                text(m, "strCategory"),
                text(m, "strArea"),
                text(m, "strInstructions"),
                text(m, "strMealThumb"),
                text(m, "strYoutube"),
                tags,
                ingredients);
    }

    private List<String> names(JsonNode root, String field) {
        List<String> out = new ArrayList<>();
        JsonNode arr = root.path("meals");
        if (arr.isArray()) {
            for (JsonNode n : arr) {
                String v = text(n, field);
                if (v != null && !v.isBlank()) out.add(v.trim());
            }
        }
        return out;
    }

    private String text(JsonNode node, String field) {
        JsonNode v = node.get(field);
        return (v == null || v.isNull()) ? null : v.asText();
    }
}
