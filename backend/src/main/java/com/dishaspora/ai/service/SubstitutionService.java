package com.dishaspora.ai.service;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * Curated ingredient substitutions for the "missing ingredients" step of an
 * ingredient scan. Keys are matched as substrings against an ingredient name.
 */
@Service
public class SubstitutionService {

    private static final Map<String, String> SUBS = Map.ofEntries(
            Map.entry("butter", "olive oil or margarine"),
            Map.entry("cream", "evaporated milk or coconut cream"),
            Map.entry("milk", "evaporated milk or a nut milk"),
            Map.entry("yogurt", "sour cream or buttermilk"),
            Map.entry("tomato paste", "blended fresh tomatoes, reduced"),
            Map.entry("tomato", "canned tomatoes or tomato puree"),
            Map.entry("onion", "shallots or leeks"),
            Map.entry("garlic", "garlic powder or ginger"),
            Map.entry("ginger", "a pinch of ground ginger"),
            Map.entry("scotch bonnet", "habanero or cayenne pepper"),
            Map.entry("pepper", "chilli flakes or paprika"),
            Map.entry("spinach", "kale, cocoyam leaves or ugu"),
            Map.entry("kale", "spinach or collard greens"),
            Map.entry("plantain", "green banana or sweet potato"),
            Map.entry("egg", "2 tbsp yogurt or a flax egg (baking)"),
            Map.entry("chicken", "turkey or firm tofu"),
            Map.entry("beef", "goat, lamb or mushrooms"),
            Map.entry("fish", "prawns or chicken"),
            Map.entry("rice", "couscous, bulgur or quinoa"),
            Map.entry("groundnut", "peanut butter or cashew paste"),
            Map.entry("peanut", "groundnut paste or almond butter"),
            Map.entry("palm oil", "vegetable oil with a little paprika"),
            Map.entry("stock", "a bouillon cube in water"),
            Map.entry("lime", "lemon or vinegar"),
            Map.entry("lemon", "lime or a splash of vinegar"),
            Map.entry("coconut milk", "cream or blended soaked cashews"),
            Map.entry("flour", "cassava or plantain flour"),
            Map.entry("sugar", "honey or mashed ripe banana"));

    /** Returns a suggested substitution for the ingredient, or null if none known. */
    public String suggest(String ingredientName) {
        if (ingredientName == null) return null;
        String n = ingredientName.toLowerCase();
        // longest-key match first so "tomato paste" wins over "tomato"
        return SUBS.entrySet().stream()
                .filter(e -> n.contains(e.getKey()))
                .sorted((a, b) -> Integer.compare(b.getKey().length(), a.getKey().length()))
                .map(Map.Entry::getValue)
                .findFirst()
                .orElse(null);
    }

    public List<String> knownKeys() {
        return SUBS.keySet().stream().sorted().toList();
    }
}
