// Centralized AI service — the single entry point for every AI feature in the app
// (food recognition, ingredient scan, recipe/meal recommendations, nutrition
// assistant, preference-driven personalization). Screens/hooks call this facade
// instead of hitting `api` directly, so the AI surface is discoverable in one
// place and easy to evolve (swap models, add caching, etc.).
//
// It composes the existing typed `api` layer (which already handles auth headers,
// timeouts, 401→refresh and error parsing) — no duplicate networking here.

import { api } from '@/api';
import type {
  AssistantResponse,
  IngredientScanResult,
  MealSuggestions,
  SnapResult,
  UpdatePreferencesRequest,
  User,
} from '@/types';

type ImageFile = { uri: string; name: string; mimeType: string };

export const aiService = {
  /** Food recognition: photo → dish, ingredients, steps, nutrition, allergens, matches. */
  analyzeFood(file: ImageFile): Promise<SnapResult> {
    return api.snap<SnapResult>(file);
  },

  /** Ingredient scan: photo of ingredients → detected items + recipe recommendations. */
  scanIngredients(file: ImageFile): Promise<IngredientScanResult> {
    return api.snapIngredients<IngredientScanResult>(file);
  },

  /** Type-your-ingredients fallback (no photo/AI): names → recipe recommendations. */
  recommendFromIngredients(ingredients: string[]): Promise<IngredientScanResult> {
    return api.post<IngredientScanResult>('/snap/recommend', { ingredients });
  },

  /** Nutrition assistant / AI Chef chat. Personalized server-side from user prefs. */
  chat(message: string, history: { role: 'user' | 'assistant'; content: string }[] = []) {
    return api.post<AssistantResponse>('/assistant/chat', { message, history });
  },

  /** Personalized breakfast/lunch/dinner suggestions (allergen-safe, goal-tuned). */
  mealSuggestions(): Promise<MealSuggestions> {
    return api.get<MealSuggestions>('/assistant/recommendations');
  },

  /** Update the dietary preferences that drive personalization + allergen warnings. */
  updatePreferences(prefs: UpdatePreferencesRequest): Promise<User> {
    return api.put<User>('/users/me/preferences', prefs);
  },
};
