import React, { useMemo } from 'react';
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
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';
import { shadow, type ThemeColors } from '@/theme';

function timeAgo(iso: string | null, t: (key: string) => string): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('chat.timeNow');
  if (mins < 60) return `${mins}${t('chat.minuteSuffix')}`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}${t('chat.hourSuffix')}`;
  return `${Math.floor(hours / 24)}${t('chat.daySuffix')}`;
}

export default function ChatThreads() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const threads = useChatThreads();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top + 6 }}>
      <ScreenHeader title={t('chat.messages')} />
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
            message={t('chat.loadError')}
            actionLabel={t('chat.retry')}
            onAction={() => threads.refetch()}
          />
        ) : (threads.data ?? []).length === 0 ? (
          <EmptyState
            image={3}
            message={t('chat.emptyMessage')}
            actionLabel={t('chat.exploreMarket')}
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
                      {thread.lastMessage ?? t('chat.startConversation')}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 5 }}>
                    <Text style={styles.threadTime}>{timeAgo(thread.lastAt, t)}</Text>
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

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    threadCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.card,
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
