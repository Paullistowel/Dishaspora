import React from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Avatar from '@/components/Avatar';
import EmptyState from '@/components/EmptyState';
import PressableScale from '@/components/PressableScale';
import ScreenHeader from '@/components/ScreenHeader';
import { Skeleton } from '@/components/Skeleton';
import { useChatThreads } from '@/hooks/useChat';
import { colors, shadow } from '@/theme';

function timeAgo(iso: string | null): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default function ChatThreads() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const threads = useChatThreads();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top + 6 }}>
      <ScreenHeader title="Messages" />
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 60, gap: 12 }}
        refreshControl={
          <RefreshControl
            refreshing={threads.isRefetching}
            onRefresh={() => threads.refetch()}
            tintColor={colors.brandDark}
          />
        }
      >
        {threads.isLoading ? (
          <>
            <Skeleton height={72} radius={20} />
            <Skeleton height={72} radius={20} />
          </>
        ) : threads.isError ? (
          <EmptyState
            image={3}
            message="We couldn't load your messages. Check your connection and try again."
            actionLabel="Retry"
            onAction={() => threads.refetch()}
          />
        ) : (threads.data ?? []).length === 0 ? (
          <EmptyState
            image={3}
            message="No conversations yet. Message a vendor from their storefront or a recipe page."
            actionLabel="Explore the market"
            onAction={() => router.push('/(tabs)/market')}
          />
        ) : (
          (threads.data ?? []).map((thread, i) => (
            <Animated.View key={thread.id} entering={FadeInDown.delay(i * 60).duration(300)}>
              <PressableScale
                scaleTo={0.98}
                onPress={() =>
                  router.push({ pathname: '/chat/[id]', params: { id: String(thread.id) } })
                }
              >
                <View style={styles.threadCard}>
                  <Avatar url={thread.vendorLogoUrl} name={thread.vendorName} size={46} square />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.threadName}>{thread.vendorName}</Text>
                    <Text style={styles.threadLast} numberOfLines={1}>
                      {thread.lastMessage ?? 'Start the conversation'}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 5 }}>
                    <Text style={styles.threadTime}>{timeAgo(thread.lastAt)}</Text>
                    {thread.unread > 0 ? (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadText}>{thread.unread}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </PressableScale>
            </Animated.View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  threadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 12,
    ...shadow,
  },
  threadName: { fontSize: 14.5, fontWeight: '700', color: colors.ink },
  threadLast: { fontSize: 12.5, color: colors.inkSoft, marginTop: 2 },
  threadTime: { fontSize: 11, color: colors.inkFaint },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadText: { color: '#FFFFFF', fontSize: 10.5, fontWeight: '800' },
});
