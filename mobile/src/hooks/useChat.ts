import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { api, ApiError } from '@/api';
import type { ChatThread } from '@/types';

/** The signed-in user's vendor conversation threads. Shared by the list and thread screens. */
export function useChatThreads() {
  return useQuery({
    queryKey: ['chat-threads'],
    queryFn: () => api.get<ChatThread[]>('/chat/threads'),
  });
}

/**
 * Returns a `startChat(vendorId)` action that opens (or creates) a conversation
 * with a vendor and navigates to it. Centralises the premium-gate handling that
 * was previously duplicated on the recipe and vendor screens.
 */
export function useStartChat() {
  const router = useRouter();
  return useCallback(
    async (vendorId: number) => {
      try {
        const thread = await api.post<{ id: number }>('/chat/threads', { vendorId });
        router.push({ pathname: '/chat/[id]', params: { id: String(thread.id) } });
      } catch (e: any) {
        if (e?.premiumRequired) {
          Alert.alert('Premium feature', 'Chatting with vendors is a Premium feature.', [
            { text: 'Not now', style: 'cancel' },
            { text: 'Go Premium', onPress: () => router.push('/subscription') },
          ]);
        } else {
          Alert.alert(
            'Could not start chat',
            e instanceof ApiError ? e.message : 'Please try again in a moment.'
          );
        }
      }
    },
    [router]
  );
}
