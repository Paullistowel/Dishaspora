import React, { useEffect, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '@/api';
import Avatar from '@/components/Avatar';
import Flag from '@/components/Flag';
import PressableScale from '@/components/PressableScale';
import SegmentChips from '@/components/SegmentChips';
import { Skeleton } from '@/components/Skeleton';
import StampCard from '@/components/StampCard';
import { IMG } from '@/config';
import { useAuth } from '@/context/AuthContext';
import { useUnreadCount } from '@/hooks/useNotifications';
import { colors, shadow } from '@/theme';
import type { Passport, Recipe } from '@/types';

function CountUp({ value, style }: { value: number; style?: any }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let n = 0;
    const step = Math.max(1, Math.ceil(value / 24));
    const timer = setInterval(() => {
      n = Math.min(value, n + step);
      setDisplay(n);
      if (n >= value) clearInterval(timer);
    }, 32);
    return () => clearInterval(timer);
  }, [value]);
  return <Text style={style}>{display}</Text>;
}

function Row({
  icon,
  label,
  value,
  badge,
  onPress,
  danger,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  /** Optional unread-count pill shown before the chevron. */
  badge?: number;
  onPress?: () => void;
  danger?: boolean;
}) {
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.98}
      accessibilityRole="button"
      accessibilityLabel={
        badge ? `${label}, ${badge} unread` : value ? `${label}, ${value}` : label
      }
    >
      <View style={styles.row}>
        <View style={[styles.rowIcon, danger && { backgroundColor: '#FDECEC' }]}>
          <Ionicons name={icon} size={17} color={danger ? colors.danger : colors.brandDark} />
        </View>
        <Text style={[styles.rowLabel, danger && { color: colors.danger }]}>{label}</Text>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
          </View>
        ) : null}
        <Ionicons name="chevron-forward" size={16} color={colors.inkFaint} />
      </View>
    </PressableScale>
  );
}

export default function Profile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [segment, setSegment] = useState('My recipes');
  const { data: unread = 0 } = useUnreadCount();

  const passport = useQuery({
    queryKey: ['passport'],
    queryFn: () => api.get<Passport>('/passport'),
  });
  const saved = useQuery({
    queryKey: ['saved'],
    queryFn: () => api.get<Recipe[]>('/users/me/saved'),
  });

  const confirmLogout = () =>
    Alert.alert('Log out', 'Sign out of Dishaspora?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);

  const savedFour = (saved.data ?? []).slice(0, 4);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={passport.isRefetching || saved.isRefetching}
          onRefresh={() => queryClient.invalidateQueries()}
          tintColor={colors.brandDark}
        />
      }
    >
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(350)} style={styles.header}>
        <Avatar url={user?.avatarUrl} name={user?.name} size={64} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{user?.name}</Text>
          <View style={styles.emailRow}>
            <Flag country={user?.country ?? 'GH'} size={12} />
            <Text style={styles.email} numberOfLines={1}>
              {user?.country === 'NG' ? 'Nigeria' : 'Ghana'} · {user?.email}
            </Text>
          </View>
        </View>
        {user?.premium ? (
          <View style={styles.premiumChip}>
            <Text style={styles.premiumChipText}>Premium</Text>
          </View>
        ) : null}
      </Animated.View>

      <View style={styles.segmentWrap}>
        <SegmentChips segments={['My recipes', 'My profile']} value={segment} onChange={setSegment} />
      </View>

      {segment === 'My recipes' ? (
        <View style={styles.body}>
          {/* Passport */}
          <Animated.View entering={FadeInDown.duration(320)}>
            <View style={styles.passportHeader}>
              <Text style={styles.sectionTitle}>Food Passport</Text>
              <View style={styles.passportStats}>
                <CountUp value={passport.data?.totalCooked ?? 0} style={styles.statNumber} />
                <Text style={styles.statLabel}> dishes · </Text>
                <CountUp value={passport.data?.countriesStamped ?? 0} style={styles.statNumber} />
                <Text style={styles.statLabel}> stamps</Text>
              </View>
            </View>
            {passport.isLoading ? (
              <View style={styles.stampGrid}>
                <Skeleton height={128} radius={20} style={{ flex: 1 }} />
                <Skeleton height={128} radius={20} style={{ flex: 1 }} />
              </View>
            ) : (
              <View style={styles.stampGridWrap}>
                {(passport.data?.stamps ?? []).map((stamp, i) => (
                  <Animated.View
                    key={stamp.country}
                    entering={FadeInDown.delay(i * 60).duration(320)}
                    style={styles.stampCell}
                  >
                    <StampCard stamp={stamp} />
                  </Animated.View>
                ))}
              </View>
            )}
          </Animated.View>

          {/* Favorites 2x2 card */}
          <Animated.View entering={FadeInDown.delay(120).duration(320)}>
            <PressableScale tilt onPress={() => router.push('/saved')}>
              <View style={styles.favCard}>
                <Text style={styles.favTitle}>My favorites</Text>
                {savedFour.length === 0 ? (
                  <Text style={styles.favEmpty}>Tap the heart on any recipe to save it here.</Text>
                ) : (
                  <View style={styles.favGrid}>
                    {savedFour.map((recipe) => (
                      <Image
                        key={recipe.id}
                        source={{ uri: IMG(recipe.imageUrl) }}
                        style={styles.favImg}
                        contentFit="cover"
                      />
                    ))}
                  </View>
                )}
              </View>
            </PressableScale>
          </Animated.View>
        </View>
      ) : (
        <View style={styles.body}>
          <Animated.View entering={FadeInDown.duration(320)} style={styles.rowsCard}>
            <Row
              icon="notifications-outline"
              label="Notifications"
              badge={unread}
              onPress={() => router.push('/notifications')}
            />
            <Row icon="receipt-outline" label="My orders" onPress={() => router.push('/orders')} />
            <Row
              icon="chatbubbles-outline"
              label="Messages"
              onPress={() => router.push('/chat')}
            />
            <Row
              icon="sparkles-outline"
              label={user?.premium ? 'Premium subscription' : 'Go Premium'}
              value={user?.premium ? 'Active' : undefined}
              onPress={() => router.push('/subscription')}
            />
            {user?.vendorId ? (
              <Row
                icon="storefront-outline"
                label="Vendor dashboard"
                onPress={() => router.push('/dashboard')}
              />
            ) : (
              <Row
                icon="storefront-outline"
                label="Become a vendor"
                onPress={() => router.push('/vendor-apply')}
              />
            )}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(100).duration(320)} style={styles.rowsCard}>
            <Row
              icon="create-outline"
              label="Edit profile"
              onPress={() => router.push('/edit-profile')}
            />
            <Row
              icon="flag-outline"
              label="Country"
              value={user?.country === 'NG' ? 'Nigeria' : 'Ghana'}
              onPress={() => router.push('/edit-profile')}
            />
            <Row
              icon="settings-outline"
              label="Settings"
              onPress={() => router.push('/settings')}
            />
            <Row icon="log-out-outline" label="Log out" danger onPress={confirmLogout} />
          </Animated.View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
  },
  name: { fontSize: 19, fontWeight: '700', color: colors.ink },
  emailRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  email: { fontSize: 12.5, color: colors.inkSoft, flexShrink: 1 },
  premiumChip: {
    backgroundColor: colors.brandLight,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  premiumChipText: { color: colors.brandDark, fontSize: 11, fontWeight: '700' },
  segmentWrap: { paddingHorizontal: 20, marginTop: 20 },
  body: { paddingHorizontal: 20, marginTop: 20, gap: 20 },
  passportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: colors.ink },
  passportStats: { flexDirection: 'row', alignItems: 'baseline' },
  statNumber: { fontSize: 15, fontWeight: '800', color: colors.brandDark },
  statLabel: { fontSize: 12, color: colors.inkSoft },
  stampGrid: { flexDirection: 'row', gap: 12 },
  stampGridWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  stampCell: { width: '47%', flexGrow: 1 },
  favCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    ...shadow,
  },
  favTitle: { fontSize: 15, fontWeight: '700', color: colors.ink, marginBottom: 10 },
  favEmpty: { fontSize: 12.5, color: colors.inkSoft, paddingBottom: 6 },
  favGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  favImg: {
    width: '47%',
    flexGrow: 1,
    aspectRatio: 1.4,
    borderRadius: 14,
    backgroundColor: colors.surfaceAlt,
  },
  rowsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 4,
    ...shadow,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: colors.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { flex: 1, fontSize: 14.5, fontWeight: '500', color: colors.ink },
  rowValue: { fontSize: 13, color: colors.inkSoft },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
});
