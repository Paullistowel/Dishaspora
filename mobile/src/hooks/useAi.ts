import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { aiService } from '@/services/aiService';
import { useAuth } from '@/context/AuthContext';
import type { UpdatePreferencesRequest } from '@/types';

/** Personalized meal suggestions (breakfast/lunch/dinner). Cached for a session. */
export function useMealSuggestions() {
  return useQuery({
    queryKey: ['ai', 'meal-suggestions'],
    queryFn: () => aiService.mealSuggestions(),
    staleTime: 10 * 60_000,
  });
}

/** Send a chat turn to the AI Chef. */
export function useAssistantChat() {
  return useMutation({
    mutationFn: ({
      message,
      history,
    }: {
      message: string;
      history: { role: 'user' | 'assistant'; content: string }[];
    }) => aiService.chat(message, history),
  });
}

/**
 * Update dietary preferences. Syncs the returned user into AuthContext and
 * invalidates meal suggestions so personalization refreshes immediately.
 */
export function useUpdatePreferences() {
  const { updateUser } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (prefs: UpdatePreferencesRequest) => aiService.updatePreferences(prefs),
    onSuccess: async (user) => {
      await updateUser(user);
      qc.invalidateQueries({ queryKey: ['ai', 'meal-suggestions'] });
    },
  });
}
