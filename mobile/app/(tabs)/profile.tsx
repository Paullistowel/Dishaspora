import React, { useEffect, useMemo, useState } from 'react';
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
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';
import { useUnreadCount } from '@/hooks/useNotifications';
import { shadow, type ThemeColors } from '@/theme';
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
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
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
        <View style={[styles.rowIcon, danger && styles.rowIconDanger]}>
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
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const queryClient = useQueryClient();
  // Store the tab index (stable) not the localized label, so language switches
  // don't break the active-segment comparison.
  const [segIndex, setSegIndex] = useState(0);
  const { data: unread = 0 } = useUnreadCount();
  const segments = [t('profile.myRecipes'), t('profile.myProfile')];

  const passport = useQuery({
    queryKey: ['passport'],
    queryFn: () => api.get<Passport>('/passport'),
  });
  const saved = useQuery({
    queryKey: ['saved'],
    queryFn: () => api.get<Recipe[]>('/users/me/saved'),
  });

  const confirmLogout = () =>
    Alert.alert(t('settings.logoutTitle'), t('settings.logoutMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.logout'),
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);

  const savedFour = (saved.data ?? []).slice(0, 4);
  const countryLabel = user?.country === 'NG' ? t('country.nigeria') : t('country.ghana');

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
              {countryLabel} · {user?.email}
            </Text>
          </View>
        </View>
        {user?.premium ? (
          <View style={styles.premiumChip}>
            <Text style={styles.premiumChipText}>{t('profile.premium')}</Text>
          </View>
        ) : null}
      </Animated.View>

      <View style={styles.segmentWrap}>
        <SegmentChips
          segments={segments}
          value={segments[segIndex]}
          onChange={(v) => setSegIndex(Math.max(0, segments.indexOf(v)))}
        />
      </View>

      {segIndex === 0 ? (
        <View style={styles.body}>
          {/* Passport */}
          <Animated.View entering={FadeInDown.duration(320)}>
            <View style={styles.passportHeader}>
              <Text style={styles.sectionTitle}>{t('profile.foodPassport')}</Text>
              <View style={styles.passportStats}>
                <CountUp value={passport.data?.totalCooked ?? 0} style={styles.statNumber} />
                <Text style={styles.statLabel}> {t('profile.dishes')} · </Text>
                <CountUp value={passport.data?.countriesStamped ?? 0} style={styles.statNumber} />
                <Text style={styles.statLabel}> {t('profile.stamps')}</Text>
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
                <Text style={styles.favTitle}>{t('profile.favorites')}</Text>
                {savedFour.length === 0 ? (
                  <Text style={styles.favEmpty}>{t('profile.favEmpty')}</Text>
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
              label={t('settings.notifications')}
              badge={unread}
              onPress={() => router.push('/notifications')}
            />
            <Row icon="receipt-outline" label={t('profile.orders')} onPress={() => router.push('/orders')} />
            <Row
              icon="chatbubbles-outline"
              label={t('profile.messages')}
              onPress={() => router.push('/chat')}
            />
            <Row
              icon="sparkles-outline"
              label={user?.premium ? t('profile.premiumSub') : t('profile.goPremium')}
              value={user?.premium ? t('profile.active') : undefined}
              onPress={() => router.push('/subscription')}
            />
            {user?.vendorId ? (
              <Row
                icon="storefront-outline"
                label={t('profile.vendorDashboard')}
                onPress={() => router.push('/dashboard')}
              />
            ) : (
              <Row
                icon="storefront-outline"
                label={t('profile.becomeVendor')}
                onPress={() => router.push('/vendor-apply')}
              />
            )}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(100).duration(320)} style={styles.rowsCard}>
            <Row
              icon="create-outline"
              label={t('settings.editProfile')}
              onPress={() => router.push('/edit-profile')}
            />
            <Row
              icon="flag-outline"
              label={t('profile.country')}
              value={countryLabel}
              onPress={() => router.push('/edit-profile')}
            />
            <Row
              icon="settings-outline"
              label={t('settings.title')}
              onPress={() => router.push('/settings')}
            />
            <Row icon="log-out-outline" label={t('settings.logout')} danger onPress={confirmLogout} />
          </Animated.View>
        </View>
      )}
    </ScrollView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
      backgroundColor: colors.card,
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
      backgroundColor: colors.card,
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
    rowIconDanger: { backgroundColor: colors.accentLight },
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
