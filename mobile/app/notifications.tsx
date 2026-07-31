import React, { useCallback, useRef } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '@/components/ScreenHeader';
import EmptyState from '@/components/EmptyState';
import { LoadingView, ErrorView } from '@/components/StatusViews';
import { useToast } from '@/context/ToastContext';
import {
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '@/hooks/useNotifications';
import { timeAgo } from '@/date';
import { colors, radius, spacing, type } from '@/theme';
import type { AppNotification, NotificationType, Page } from '@/types';

const LIST_KEY = ['notifications'] as const;

const ICONS: Record<NotificationType, { name: keyof typeof Ionicons.glyphMap; tint: string; bg: string }> = {
  ORDER_UPDATE: { name: 'bag-check-outline', tint: colors.blueDark, bg: colors.blueLight },
  MEAL_UPDATE: { name: 'restaurant-outline', tint: colors.brandDark, bg: colors.brandLight },
  RECOMMENDATION: { name: 'sparkles-outline', tint: colors.accentDark, bg: colors.accentLight },
  SECURITY: { name: 'shield-checkmark-outline', tint: colors.danger, bg: '#FDECEC' },
  ANNOUNCEMENT: { name: 'megaphone-outline', tint: colors.brandDark, bg: colors.brandLight },
  PROMOTION: { name: 'pricetag-outline', tint: colors.accentDark, bg: colors.accentLight },
};

const NotificationRow = React.memo(function NotificationRow({
  item,
  onPress,
  onDelete,
}: {
  item: AppNotification;
  onPress: (n: AppNotification) => void;
  onDelete: (id: number) => void;
}) {
  const cfg = ICONS[item.type] ?? ICONS.ANNOUNCEMENT;
  return (
    <TouchableOpacity
      style={[styles.row, !item.read && styles.rowUnread]}
      activeOpacity={0.7}
      onPress={() => onPress(item)}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}. ${item.body}. ${item.read ? 'Read' : 'Unread'}.`}
    >
      <View style={[styles.icon, { backgroundColor: cfg.bg }]}>
        <Ionicons name={cfg.name} size={18} color={cfg.tint} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
        </View>
        <Text style={styles.body} numberOfLines={2}>
          {item.body}
        </Text>
      </View>
      {!item.read && <View style={styles.dot} />}
      <TouchableOpacity
        hitSlop={10}
        onPress={() => onDelete(item.id)}
        accessibilityRole="button"
        accessibilityLabel="Delete notification"
        style={styles.delete}
      >
        <Ionicons name="close" size={16} color={colors.inkFaint} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
});

export default function Notifications() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch, isRefetching } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const remove = useDeleteNotification();
  // Pending delete timers, so Undo can cancel the real server delete.
  const pendingDeletes = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const onPressItem = useCallback(
    (n: AppNotification) => {
      if (!n.read) markRead.mutate(n.id);
      if (n.deepLink) router.push(n.deepLink as never);
    },
    [markRead, router]
  );

  // Delete with an Undo window: remove from the list immediately, but defer the
  // real server delete by a few seconds so "Undo" can cancel it and restore.
  const onDelete = useCallback(
    (id: number) => {
      queryClient.setQueryData<Page<AppNotification>>(LIST_KEY, (old) =>
        old ? { ...old, content: old.content.filter((n) => n.id !== id) } : old
      );
      const timer = setTimeout(() => {
        delete pendingDeletes.current[id];
        remove.mutate(id);
      }, 4500);
      pendingDeletes.current[id] = timer;
      toast.show('Notification deleted', 'info', {
        action: {
          label: 'Undo',
          onPress: () => {
            clearTimeout(pendingDeletes.current[id]);
            delete pendingDeletes.current[id];
            // Server still has it (delete was deferred) — refetch to restore.
            queryClient.invalidateQueries({ queryKey: LIST_KEY });
          },
        },
      });
    },
    [queryClient, remove, toast]
  );

  const hasUnread = (data ?? []).some((n) => !n.read);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.sm }]}>
      <ScreenHeader
        title="Notifications"
        right={
          hasUnread ? (
            <TouchableOpacity
              onPress={() =>
                markAll.mutate(undefined, {
                  onSuccess: () => toast.success('All caught up'),
                })
              }
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Mark all as read"
            >
              <Text style={styles.markAll}>Mark all</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />
      {isLoading ? (
        <LoadingView />
      ) : isError ? (
        <ErrorView onRetry={refetch} />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(n) => String(n.id)}
          renderItem={({ item }) => (
            <NotificationRow item={item} onPress={onPressItem} onDelete={onDelete} />
          )}
          contentContainerStyle={
            (data?.length ?? 0) === 0
              ? styles.emptyContainer
              : { paddingHorizontal: spacing.lg, paddingBottom: insets.bottom + spacing.xxl }
          }
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.brandDark} />
          }
          ListEmptyComponent={
            <EmptyState
              message="You're all caught up — no notifications yet."
              image={2}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  emptyContainer: { flexGrow: 1, justifyContent: 'center' },
  markAll: { color: colors.brandDark, fontSize: type.size.sm, fontWeight: type.weight.bold },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  rowUnread: { backgroundColor: colors.brandLight },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { flex: 1, fontSize: type.size.md, fontWeight: type.weight.bold, color: colors.ink },
  time: { fontSize: type.size.xs, color: colors.inkFaint, fontWeight: type.weight.medium },
  body: { fontSize: type.size.sm, color: colors.inkSoft, lineHeight: type.line.sm, marginTop: 2 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.brand },
  delete: { padding: spacing.xs },
});
