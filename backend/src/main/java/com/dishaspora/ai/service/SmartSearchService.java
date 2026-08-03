package com.dishaspora.ai.service;

import com.dishaspora.common.enums.Enums.ApprovalStatus;
import com.dishaspora.recipe.entity.Ingredient;
import com.dishaspora.recipe.entity.Recipe;
import com.dishaspora.recipe.repository.RecipeRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Rule-based natural language parser: turns a free-text query into recipe
 * filters and matches recipes from the DB. Used by /search/smart and as the
 * assistant fallback when no Anthropic key is configured.
 */
@Service
public class SmartSearchService {

    private static final Pattern UNDER_MINUTES =
            Pattern.compile("(?:under|less than|below|within|in)\\s*(\\d{1,3})\\s*(?:min|mins|minutes)");
    private static final Pattern UNDER_CALORIES =
            Pattern.compile("(?:under|less than|below|max)\\s*(\\d{2,5})\\s*(?:kcal|cal|cals|calories)");

    private static final Map<String, String> CUISINE_WORDS = Map.ofEntries(
            Map.entry("ghanaian", "Ghanaian"), Map.entry("ghana", "Ghanaian"),
            Map.entry("nigerian", "Nigerian"), Map.entry("nigeria", "Nigerian"),
            Map.entry("naija", "Nigerian"),
            Map.entry("italian", "Italian"), Map.entry("american", "American"),
            Map.entry("lebanese", "Lebanese"), Map.entry("chinese", "Chinese"),
            Map.entry("arabian", "Arabian"), Map.entry("continental", "Continental"),
            Map.entry("french", "French"), Map.entry("france", "French"),
            Map.entry("greek", "Greek"), Map.entry("greece", "Greek"),
            Map.entry("spanish", "Spanish"), Map.entry("spain", "Spanish"),
            Map.entry("japanese", "Japanese"), Map.entry("japan", "Japanese"),
            Map.entry("thai", "Thai"), Map.entry("thailand", "Thai"),
            Map.entry("korean", "Korean"), Map.entry("korea", "Korean"),
            Map.entry("indian", "Indian"), Map.entry("india", "Indian"),
            Map.entry("mexican", "Mexican"), Map.entry("mexico", "Mexican"),
            Map.entry("middle eastern", "Middle Eastern"));

    private static final Map<String, String> CATEGORY_WORDS = Map.of(
            "drink", "DRINK", "drinks", "DRINK", "juice", "DRINK", "smoothie", "DRINK",
            "local", "LOCAL", "continental", "CONTINENTAL", "foreign", "FOREIGN");

    private static final List<String> STOP_WORDS = List.of(
            "i", "want", "something", "with", "and", "or", "the", "a", "an", "for", "me", "please",
            "recipe", "recipes", "food", "dish", "meal", "make", "cook", "eat", "what", "can", "show",
            "give", "find", "under", "less", "than", "minutes", "min", "mins", "calories", "kcal",
            "cal", "quick", "fast", "easy", "healthy", "to", "that", "is", "are", "some", "of", "in",
            "my", "have", "need", "like", "would", "tonight", "today", "dinner", "lunch", "breakfast");

    private final RecipeRepository recipeRepository;

    public SmartSearchService(RecipeRepository recipeRepository) {
        this.recipeRepository = recipeRepository;
    }

    public record ParsedFilters(String q, String category, Integer maxCalories,
                                Integer maxMinutes, String cuisine, List<String> keywords) {

        public Map<String, Object> asMap() {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("q", q);
            map.put("category", category);
            map.put("maxCalories", maxCalories);
            map.put("maxMinutes", maxMinutes);
            map.put("cuisine", cuisine);
            return map;
        }
    }

    public ParsedFilters parse(String query) {
        String text = query == null ? "" : query.toLowerCase(Locale.ROOT);

        Integer maxMinutes = null;
        Matcher minutesMatcher = UNDER_MINUTES.matcher(text);
        if (minutesMatcher.find()) {
            maxMinutes = Integer.parseInt(minutesMatcher.group(1));
        } else if (text.contains("quick") || text.contains("fast") || text.contains("in a hurry")) {
            maxMinutes = 30;
        }

        Integer maxCalories = null;
        Matcher caloriesMatcher = UNDER_CALORIES.matcher(text);
        if (caloriesMatcher.find()) {
            maxCalories = Integer.parseInt(caloriesMatcher.group(1));
        } else if (text.contains("low calorie") || text.contains("light meal")) {
            maxCalories = 450;
        }

        String cuisine = null;
        for (Map.Entry<String, String> entry : CUISINE_WORDS.entrySet()) {
            if (text.contains(entry.getKey())) {
                cuisine = entry.getValue();
                break;
            }
        }

        String category = null;
        for (Map.Entry<String, String> entry : CATEGORY_WORDS.entrySet()) {
            if (text.contains(entry.getKey())) {
                category = entry.getValue();
                break;
            }
        }

        List<String> keywords = new ArrayList<>();
        for (String token : text.split("[^a-z]+")) {
            if (token.length() >= 3 && !STOP_WORDS.contains(token)
                    && !CUISINE_WORDS.containsKey(token) && !CATEGORY_WORDS.containsKey(token)) {
                keywords.add(token);
            }
        }

        return new ParsedFilters(query, category, maxCalories, maxMinutes, cuisine, keywords);
    }

    /** Matches approved recipes against parsed filters, best matches first. */
    public List<Recipe> match(ParsedFilters filters, int limit) {
        List<Recipe> approved = recipeRepository.findByStatus(ApprovalStatus.APPROVED);
        record Scored(Recipe recipe, int score) {}
        List<Scored> scored = new ArrayList<>();
        for (Recipe recipe : approved) {
            if (filters.maxMinutes() != null && recipe.totalMinutes() > filters.maxMinutes()) continue;
            if (filters.maxCalories() != null && recipe.getCalories() > filters.maxCalories()) continue;
            if (filters.category() != null
                    && !recipe.getCategory().name().equalsIgnoreCase(filters.category())) continue;
            if (filters.cuisine() != null && (recipe.getCuisine() == null
                    || !recipe.getCuisine().equalsIgnoreCase(filters.cuisine()))) continue;

            int score = 0;
            int matchedKeywords = 0;
            String title = recipe.getTitle().toLowerCase(Locale.ROOT);
            String description = recipe.getDescription() == null ? ""
                    : recipe.getDescription().toLowerCase(Locale.ROOT);
            for (String keyword : filters.keywords()) {
                boolean hit = false;
                if (title.contains(keyword)) { score += 3; hit = true; }
                if (description.contains(keyword)) { score += 1; hit = true; }
                for (Ingredient ingredient : recipe.getIngredients()) {
                    if (ingredient.getName() != null
                            && ingredient.getName().toLowerCase(Locale.ROOT).contains(keyword)) {
                        score += 2;
                        hit = true;
                        break;
                    }
                }
                if (hit) matchedKeywords++;
            }
            boolean hasConstraint = filters.maxMinutes() != null || filters.maxCalories() != null
                    || filters.category() != null || filters.cuisine() != null;

            if (!filters.keywords().isEmpty()) {
                if (hasConstraint) {
                    // Constraint-scoped natural-language query (e.g. "high-protein
                    // Nigerian meal"): the cuisine/category/time/calorie filters have
                    // already been applied above; keep any-keyword scoring so relevant
                    // dishes still surface.
                    if (score > 0) scored.add(new Scored(recipe, score));
                } else {
                    // Pure name-style query (e.g. "Jollof Pizza"): require EVERY typed
                    // word to match somewhere, so a non-existent dish returns nothing
                    // instead of a partial/unrelated meal ("Jollof Rice").
                    if (matchedKeywords == filters.keywords().size()) {
                        scored.add(new Scored(recipe, score));
                    }
                }
            } else {
                // No keywords — browse (optionally within constraints).
                scored.add(new Scored(recipe, 0));
            }
        }
        return scored.stream()
                .sorted(Comparator.comparingInt(Scored::score).reversed()
                        .thenComparing(s -> -s.recipe().getRating()))
                .limit(limit)
                .map(Scored::recipe)
                .toList();
    }
}
