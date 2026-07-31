import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api';
import { feedbackDeviceInfo, appVersion } from '@/device';
import type { CreateFeedbackRequest, Feedback } from '@/types';

const MINE_KEY = ['feedback', 'mine'] as const;

/** The current user's past feedback submissions, newest first. */
export function useMyFeedback() {
  return useQuery({
    queryKey: MINE_KEY,
    queryFn: () => api.get<Feedback[]>('/feedback/mine'),
  });
}

/**
 * Submit feedback. Device metadata + app version are attached automatically so
 * callers only pass the human-authored fields.
 */
export function useSubmitFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<CreateFeedbackRequest, 'deviceInfo' | 'appVersion'>) =>
      api.post<Feedback>('/feedback', {
        ...input,
        deviceInfo: feedbackDeviceInfo(),
        appVersion: appVersion(),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: MINE_KEY }),
  });
}
