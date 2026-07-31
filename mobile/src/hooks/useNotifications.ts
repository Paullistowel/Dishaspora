import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api';
import type { AppNotification, Page, UnreadCount } from '@/types';

const LIST_KEY = ['notifications'] as const;
const UNREAD_KEY = ['notifications', 'unread'] as const;

/** Full notification list (first page). */
export function useNotifications() {
  return useQuery({
    queryKey: LIST_KEY,
    queryFn: () => api.get<Page<AppNotification>>('/notifications', { page: 0, size: 50 }),
    select: (p) => p.content,
  });
}

/**
 * Unread badge count. Polls in the background so the badge stays fresh without a
 * manual refresh; cheap endpoint. Returns 0 until loaded.
 */
export function useUnreadCount() {
  return useQuery({
    queryKey: UNREAD_KEY,
    queryFn: () => api.get<UnreadCount>('/notifications/unread-count'),
    select: (r) => r.unread,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}

/** Shared invalidation so both the list and the badge refresh together. */
function useInvalidateNotifications() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: LIST_KEY });
    qc.invalidateQueries({ queryKey: UNREAD_KEY });
  };
}

export function useMarkNotificationRead() {
  const invalidate = useInvalidateNotifications();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.post(`/notifications/${id}/read`),
    // Optimistic: flip the row to read immediately, roll back on error.
    onMutate: async (id: number) => {
      await qc.cancelQueries({ queryKey: LIST_KEY });
      const prev = qc.getQueryData<Page<AppNotification>>(LIST_KEY);
      if (prev) {
        qc.setQueryData<Page<AppNotification>>(LIST_KEY, {
          ...prev,
          content: prev.content.map((n) => (n.id === id ? { ...n, read: true } : n)),
        });
      }
      return { prev };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(LIST_KEY, ctx.prev);
    },
    onSettled: invalidate,
  });
}

export function useMarkAllNotificationsRead() {
  const invalidate = useInvalidateNotifications();
  return useMutation({
    mutationFn: () => api.post('/notifications/read-all'),
    onSettled: invalidate,
  });
}

export function useDeleteNotification() {
  const invalidate = useInvalidateNotifications();
  return useMutation({
    mutationFn: (id: number) => api.del(`/notifications/${id}`),
    onSettled: invalidate,
  });
}
