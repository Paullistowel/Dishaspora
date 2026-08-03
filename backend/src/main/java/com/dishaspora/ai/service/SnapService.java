package com.dishaspora.ai.service;

import com.dishaspora.ai.dto.SnapDtos.DetectedIngredient;
import com.dishaspora.ai.dto.SnapDtos.IngredientScanResult;
import com.dishaspora.ai.dto.SnapDtos.MissingIngredient;
import com.dishaspora.ai.dto.SnapDtos.RecipeMatch;
import com.dishaspora.ai.dto.SnapDtos.SnapIngredient;
import com.dishaspora.ai.dto.SnapDtos.SnapNutrition;
import com.dishaspora.ai.dto.SnapDtos.SnapResult;
import com.dishaspora.ai.dto.SnapDtos.SnapStep;
import com.dishaspora.recipe.entity.Ingredient;
import com.dishaspora.auth.entity.User;
import com.dishaspora.common.enums.Enums.ApprovalStatus;
import com.dishaspora.common.exception.ApiException;
import com.dishaspora.recipe.dto.RecipeDto;
import com.dishaspora.recipe.entity.Recipe;
import com.dishaspora.recipe.repository.RecipeRepository;
import com.dishaspora.recipe.service.RecipeMapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Base64;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * "Snap &amp; Cook": accepts a food photo, asks Claude vision to identify the dish,
 * draft a recipe and estimate nutrition, then attaches matching catalog recipes.
 * Never returns mock data — if the AI is not configured or the image cannot be
 * understood, it throws a clear {@link ApiException}.
 */
@Service
public class SnapService {

    private static final long MAX_BYTES = 8L * 1024 * 1024; // 8 MB after client compression
    private static final Set<String> ALLOWED_TYPES =
            Set.of("image/jpeg", "image/png", "image/webp", "image/heic", "image/heif");
    private static final Set<String> STOP_WORDS = Set.of(
            "with", "and", "the", "of", "in", "a", "sauce", "stew", "soup", "rice", "fried");

    private static final String SYSTEM_PROMPT = """
            You are the food-recognition engine for Dishaspora, an African (Ghana &amp; Nigeria) and
            world cuisine cooking app. You are shown ONE photo of a plated dish or raw ingredients.
            Identify it and respond with STRICT JSON only — no prose, no markdown, no code fences.

            Schema:
            {
              "isFood": boolean,               // false if the photo is clearly not food
              "dishName": string,              // best-guess dish name ("" if not food)
              "description": string,           // one warm sentence about the dish
              "cuisine": string,               // e.g. "Ghanaian", "Nigerian", "West African", "Italian"
              "confidence": integer,           // 0-100, your confidence in the identification
              "ingredients": [ { "name": string, "quantity": string } ],   // 4-12 items, realistic amounts
              "steps": [ string ],             // 4-8 concise cooking steps, imperative voice
              "nutrition": { "calories": integer, "protein": integer, "carbs": integer, "fat": integer, "servings": integer },
              // nutrition is PER SERVING; grams for protein/carbs/fat; servings is how many the recipe yields
              "allergens": [ string ]          // common allergens present, lowercase (e.g. "peanuts","shellfish","dairy","gluten","eggs","soy","fish","tree nuts"); [] if none
            }

            If the image is not food, set isFood=false and return empty ingredients/steps and zeroed nutrition.
            Prefer authentic African dish names when the photo matches one. Output JSON and nothing else.
            """;

    private static final String DETECT_PROMPT = """
            You are shown ONE photo of raw food ingredients (e.g. on a counter or in a fridge).
            List the distinct edible ingredients you can see. Respond with STRICT JSON only:
            { "ingredients": [ { "name": string, "confidence": integer } ] }
            Use simple, common singular names (e.g. "tomato", "onion", "egg", "spinach", "chicken").
            confidence is 0-100. Ignore packaging, utensils and non-food items. Max 20 ingredients.
            Output JSON and nothing else.
            """;

    private final AiClient aiClient;
    private final RecipeRepository recipeRepository;
    private final RecipeMapper recipeMapper;
    private final ObjectMapper objectMapper;
    private final SubstitutionService substitutionService;

    public SnapService(AiClient aiClient,
                       RecipeRepository recipeRepository,
                       RecipeMapper recipeMapper,
                       ObjectMapper objectMapper,
                       SubstitutionService substitutionService) {
        this.aiClient = aiClient;
        this.recipeRepository = recipeRepository;
        this.recipeMapper = recipeMapper;
        this.objectMapper = objectMapper;
        this.substitutionService = substitutionService;
    }

    public SnapResult analyze(MultipartFile image, User user) {
        validate(image);
        if (!aiClient.isConfigured()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Snap & Cook is not available right now. The AI vision service is not configured on the server.");
        }

        String base64 = encode(image);
        String mediaType = normalizeType(image.getContentType());
        String raw = aiClient.vision(SYSTEM_PROMPT, base64, mediaType,
                "Identify this dish and return the JSON described in your instructions.", 1200);
        if (raw == null || raw.isBlank()) {
            throw new ApiException(HttpStatus.BAD_GATEWAY,
                    "The AI vision service could not process that photo. Please try again.");
        }

        JsonNode node = parseJson(raw);
        boolean isFood = node.path("isFood").asBoolean(true);
        String dishName = node.path("dishName").asText("").trim();
        if (!isFood || dishName.isEmpty()) {
            throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "That doesn't look like a dish we can recognise. Try a clearer photo of the food.");
        }

        List<SnapIngredient> ingredients = new ArrayList<>();
        for (JsonNode ing : node.path("ingredients")) {
            String name = ing.path("name").asText("").trim();
            if (name.isEmpty()) continue;
            ingredients.add(new SnapIngredient(name, ing.path("quantity").asText("").trim()));
        }

        List<SnapStep> steps = new ArrayList<>();
        int n = 1;
        for (JsonNode step : node.path("steps")) {
            String text = step.asText("").trim();
            if (!text.isEmpty()) steps.add(new SnapStep(n++, text));
        }

        JsonNode nut = node.path("nutrition");
        SnapNutrition nutrition = new SnapNutrition(
                nut.path("calories").asInt(0),
                nut.path("protein").asInt(0),
                nut.path("carbs").asInt(0),
                nut.path("fat").asInt(0),
                Math.max(1, nut.path("servings").asInt(1)));

        // Allergens present in the dish, plus the subset the user is allergic to.
        List<String> allergens = new ArrayList<>();
        for (JsonNode a : node.path("allergens")) {
            String name = a.asText("").trim().toLowerCase();
            if (!name.isEmpty() && !allergens.contains(name)) allergens.add(name);
        }
        List<String> warnings = allergenWarnings(allergens, user);

        List<RecipeDto> matched = matchCatalog(dishName, node.path("cuisine").asText(""), user);

        return new SnapResult(
                dishName,
                node.path("description").asText("").trim(),
                node.path("cuisine").asText("").trim(),
                clampConfidence(node.path("confidence").asInt(0)),
                true,
                ingredients,
                steps,
                nutrition,
                allergens,
                warnings,
                matched);
    }

    /** Which of the dish's allergens the user has flagged (substring match both ways). */
    private List<String> allergenWarnings(List<String> allergens, User user) {
        List<String> userAllergies = user == null ? List.of() : user.allergyList();
        if (userAllergies.isEmpty() || allergens.isEmpty()) return List.of();
        List<String> hits = new ArrayList<>();
        for (String allergen : allergens) {
            for (String ua : userAllergies) {
                if (allergen.contains(ua) || ua.contains(allergen)) {
                    if (!hits.contains(allergen)) hits.add(allergen);
                    break;
                }
            }
        }
        return hits;
    }

    /**
     * Ingredient scan: detect the ingredients in a photo, then recommend catalog
     * recipes you can (mostly) make from them — with cook time, difficulty, nutrition,
     * steps, and the missing ingredients + substitutions for each.
     */
    public IngredientScanResult scanIngredients(MultipartFile image, User user) {
        validate(image);
        if (!aiClient.isConfigured()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Snap & Cook is not available right now. The AI vision service is not configured on the server.");
        }
        String base64 = encode(image);
        String mediaType = normalizeType(image.getContentType());
        String raw = aiClient.vision(DETECT_PROMPT, base64, mediaType,
                "Detect the ingredients and return the JSON described.", 800);
        if (raw == null || raw.isBlank()) {
            throw new ApiException(HttpStatus.BAD_GATEWAY,
                    "The AI vision service could not process that photo. Please try again.");
        }

        JsonNode node = parseJson(raw);
        List<DetectedIngredient> detected = new ArrayList<>();
        Set<String> detectedNames = new HashSet<>();
        for (JsonNode ing : node.path("ingredients")) {
            String name = ing.path("name").asText("").trim().toLowerCase();
            if (name.isEmpty() || !detectedNames.add(name)) continue;
            detected.add(new DetectedIngredient(name, clampConfidence(ing.path("confidence").asInt(70))));
        }
        if (detected.isEmpty()) {
            throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "We couldn't spot any ingredients in that photo. Try a clearer, well-lit shot.");
        }
        return new IngredientScanResult(detected, recommend(detectedNames, user));
    }

    /** Recommend recipes from a typed ingredient list — no photo/AI required. */
    public IngredientScanResult recommendFromNames(List<String> names, User user) {
        if (names == null || names.isEmpty()) {
            throw ApiException.badRequest("Add at least one ingredient.");
        }
        List<DetectedIngredient> detected = new ArrayList<>();
        Set<String> set = new HashSet<>();
        for (String n : names) {
            String name = n == null ? "" : n.trim().toLowerCase();
            if (!name.isEmpty() && set.add(name)) {
                detected.add(new DetectedIngredient(name, 100));
            }
        }
        if (detected.isEmpty()) throw ApiException.badRequest("Add at least one ingredient.");
        return new IngredientScanResult(detected, recommend(set, user));
    }

    /** Package-visible so the recommendation logic can be unit-tested without the AI. */
    List<RecipeMatch> recommend(Set<String> detected, User user) {
        List<RecipeMatch> matches = new ArrayList<>();
        for (Recipe r : recipeRepository.findByStatus(ApprovalStatus.APPROVED)) {
            List<Ingredient> ings = r.getIngredients();
            if (ings == null || ings.isEmpty()) continue;
            List<String> have = new ArrayList<>();
            List<MissingIngredient> missing = new ArrayList<>();
            for (Ingredient ing : ings) {
                if (ingredientMatched(ing.getName(), detected)) {
                    have.add(ing.getName());
                } else {
                    missing.add(new MissingIngredient(ing.getName(), ing.getQuantity(),
                            substitutionService.suggest(ing.getName())));
                }
            }
            if (have.isEmpty()) continue; // need at least one detected ingredient
            int matchPercent = (int) Math.round(100.0 * have.size() / ings.size());
            matches.add(new RecipeMatch(recipeMapper.toDto(r, user), difficulty(r),
                    r.totalMinutes(), matchPercent, have, missing));
        }
        matches.sort(Comparator
                .comparingInt(RecipeMatch::matchPercent).reversed()
                .thenComparingInt((RecipeMatch m) -> m.missingIngredients().size())
                .thenComparingInt(RecipeMatch::cookTimeMinutes));
        return matches.stream().limit(8).toList();
    }

    private boolean ingredientMatched(String recipeIngredient, Set<String> detected) {
        if (recipeIngredient == null) return false;
        String ri = recipeIngredient.toLowerCase();
        for (String d : detected) {
            if (d.length() < 3) continue;
            String ds = singular(d);
            if (ds.length() >= 3 && (ri.contains(ds) || ds.contains(ri))) return true;
        }
        return false;
    }

    private String singular(String s) {
        return s.endsWith("es") ? s.substring(0, s.length() - 2)
                : s.endsWith("s") ? s.substring(0, s.length() - 1) : s;
    }

    private String difficulty(Recipe r) {
        int minutes = r.totalMinutes();
        int steps = r.getSteps() == null ? 0 : r.getSteps().size();
        if (minutes <= 30 && steps <= 5) return "Easy";
        if (minutes <= 60 && steps <= 9) return "Medium";
        return "Hard";
    }

    private void validate(MultipartFile image) {
        if (image == null || image.isEmpty()) {
            throw ApiException.badRequest("No image was uploaded.");
        }
        if (image.getSize() > MAX_BYTES) {
            throw ApiException.badRequest("Image is too large. Please use a photo under 8 MB.");
        }
        String type = image.getContentType();
        if (type != null && !ALLOWED_TYPES.contains(type.toLowerCase())) {
            throw ApiException.badRequest("Unsupported image type. Please upload a JPEG, PNG or WebP photo.");
        }
    }

    private String encode(MultipartFile image) {
        try {
            return Base64.getEncoder().encodeToString(image.getBytes());
        } catch (IOException e) {
            throw ApiException.badRequest("Could not read the uploaded image.");
        }
    }

    private String normalizeType(String contentType) {
        if (contentType == null) return "image/jpeg";
        String lower = contentType.toLowerCase();
        // Anthropic vision supports jpeg/png/webp/gif; map heic/heif (unsupported) — clients send jpeg.
        return switch (lower) {
            case "image/png", "image/webp", "image/gif" -> lower;
            default -> "image/jpeg";
        };
    }

    private JsonNode parseJson(String raw) {
        String json = extractJsonObject(raw);
        try {
            return objectMapper.readTree(json);
        } catch (IOException e) {
            throw new ApiException(HttpStatus.BAD_GATEWAY,
                    "The AI returned an unexpected response. Please try again.");
        }
    }

    /** Claude usually returns bare JSON, but tolerate code fences or leading prose. */
    private String extractJsonObject(String raw) {
        String trimmed = raw.trim();
        if (trimmed.startsWith("```")) {
            int firstNl = trimmed.indexOf('\n');
            if (firstNl >= 0) trimmed = trimmed.substring(firstNl + 1);
            if (trimmed.endsWith("```")) trimmed = trimmed.substring(0, trimmed.length() - 3);
        }
        int start = trimmed.indexOf('{');
        int end = trimmed.lastIndexOf('}');
        if (start >= 0 && end > start) {
            return trimmed.substring(start, end + 1);
        }
        return trimmed;
    }

    private int clampConfidence(int c) {
        return Math.max(0, Math.min(100, c));
    }

    /** Token-overlap match of the recognised dish against approved catalog recipes (top 4). */
    private List<RecipeDto> matchCatalog(String dishName, String cuisine, User user) {
        Set<String> wanted = tokens(dishName + " " + cuisine);
        if (wanted.isEmpty()) return List.of();
        List<Recipe> approved = recipeRepository.findByStatus(ApprovalStatus.APPROVED);
        return approved.stream()
                .map(r -> new Scored(r, overlap(wanted, r)))
                .filter(s -> s.score() > 0)
                .sorted(Comparator.comparingInt(Scored::score).reversed())
                .limit(4)
                .map(s -> recipeMapper.toDto(s.recipe(), user))
                .toList();
    }

    private int overlap(Set<String> wanted, Recipe recipe) {
        Set<String> have = tokens(recipe.getTitle() + " " + recipe.getCuisine());
        int score = 0;
        for (String w : wanted) {
            if (have.contains(w)) score += 2;
        }
        return score;
    }

    private Set<String> tokens(String text) {
        Set<String> out = new HashSet<>();
        for (String t : Arrays.asList(text.toLowerCase().split("[^a-z0-9]+"))) {
            if (t.length() >= 3 && !STOP_WORDS.contains(t)) out.add(t);
        }
        return out;
    }

    private record Scored(Recipe recipe, int score) {}
}
