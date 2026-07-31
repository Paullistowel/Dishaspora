import React, { useCallback, useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '@/api';
import Avatar from '@/components/Avatar';
import Flag from '@/components/Flag';
import PressableScale from '@/components/PressableScale';
import RecipeCard from '@/components/RecipeCard';
import SearchRow from '@/components/SearchRow';
import SectionHeader from '@/components/SectionHeader';
import { Skeleton, SkeletonGrid, SkeletonRow } from '@/components/Skeleton';
import StoryRing from '@/components/StoryRing';
import VerifyEmailBanner from '@/components/VerifyEmailBanner';
import { IMG } from '@/config';
import { useAuth } from '@/context/AuthContext';
import { colors, shadow, shadowStrong } from '@/theme';
import type { Page, Recipe, Story, Vendor } from '@/types';

function DishOfTheDay({ recipes }: { recipes: Recipe[] }) {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const featured = recipes.slice(0, 5);

  // slow 3D float loop on the hero (UI thread)
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(
      withTiming(1, { duration: 3600, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [t]);
  const float = useAnimatedStyle(() => ({
    transform: [
      { perspective: 900 },
      { rotateX: `${(t.value - 0.5) * 3}deg` },
      { rotateY: `${(0.5 - t.value) * 3}deg` },
    ],
  }));
  const photoFloat = useAnimatedStyle(() => ({
    transform: [{ translateY: (t.value - 0.5) * 8 }],
  }));

  if (featured.length === 0) return null;
  const dish = featured[Math.min(page, featured.length - 1)];

  return (
    <Animated.View style={float}>
      <PressableScale
        tilt
        onPress={() =>
          router.push({ pathname: '/recipe/[id]', params: { id: String(dish.id) } })
        }
      >
        <LinearGradient
          colors={[colors.blue, colors.brand]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroLeft}>
            <View style={styles.heroPill}>
              <Text style={styles.heroPillText}>DISH OF THE DAY</Text>
            </View>
            <View style={styles.heroTitleRow}>
              <Text style={styles.heroTitle} numberOfLines={2}>
                {dish.title}
              </Text>
              {dish.countryOfOrigin === 'GH' || dish.countryOfOrigin === 'NG' ? (
                <Flag country={dish.countryOfOrigin} size={15} style={{ marginTop: 8 }} />
              ) : null}
            </View>
            <Text style={styles.heroSub} numberOfLines={2}>
              {dish.description}
            </Text>
            <View style={styles.heroBtn}>
              <Text style={styles.heroBtnText}>View Recipe ›</Text>
            </View>
            <View style={styles.dots}>
              {featured.map((_, i) => (
                <TouchableOpacity key={i} onPress={() => setPage(i)} hitSlop={6}>
                  <View style={[styles.dot, i === page && styles.dotActive]} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <Animated.View style={[styles.heroPhotoWrap, photoFloat]}>
            <Image source={{ uri: IMG(dish.imageUrl) }} style={styles.heroPhoto} contentFit="cover" />
          </Animated.View>
        </LinearGradient>
      </PressableScale>
    </Animated.View>
  );
}

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const trending = useQuery({
    queryKey: ['trending'],
    queryFn: () => api.get<Recipe[]>('/recipes/trending'),
  });
  const stories = useQuery({
    queryKey: ['stories'],
    queryFn: () => api.get<Page<Story>>('/stories', { country: user?.country }),
  });
  const vendors = useQuery({
    queryKey: ['vendors', user?.country],
    queryFn: () => api.get<Vendor[]>('/vendors', { country: user?.country }),
  });

  const refreshing = trending.isRefetching || stories.isRefetching || vendors.isRefetching;

  // Refresh only what this screen owns, not the entire query cache.
  const onRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['trending'] });
    queryClient.invalidateQueries({ queryKey: ['stories'] });
    queryClient.invalidateQueries({ queryKey: ['vendors'] });
  }, [queryClient]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: insets.top + 10, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.brandDark}
        />
      }
    >
      {/* Header: orange lowercase wordmark + greeting + avatar */}
      <Animated.View entering={FadeInDown.duration(350)} style={styles.header}>
        <View style={{ flex: 1 }}>
          <View style={styles.wordmarkRow}>
            <Text style={styles.wordmark}>dishaspora</Text>
            <Ionicons name="restaurant" size={14} color={colors.accent} style={{ marginTop: 2 }} />
          </View>
          <View style={styles.greetingRow}>
            <Text style={styles.greeting}>
              Akwaaba, {user?.name?.split(' ')[0] ?? 'chef'}
            </Text>
            <Flag country={user?.country ?? 'GH'} size={13} />
          </View>
        </View>
        <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
          <Avatar url={user?.avatarUrl} name={user?.name} size={42} />
        </TouchableOpacity>
      </Animated.View>

      {/* Email verification nudge (hidden once verified) */}
      <VerifyEmailBanner />

      {/* Search row navigates to Search tab */}
      <Animated.View entering={FadeInDown.delay(60).duration(350)} style={styles.section}>
        <SearchRow onPressInput={() => router.push('/(tabs)/search')} />
      </Animated.View>

      {/* Feed-wide load failure (backend unreachable): don't silently show empty
          sections — surface a retry. Partial failures still degrade gracefully. */}
      {trending.isError && stories.isError && vendors.isError ? (
        <View style={styles.section}>
          <View style={styles.loadError} accessibilityRole="alert">
            <Ionicons name="cloud-offline-outline" size={18} color={colors.inkSoft} />
            <Text style={styles.loadErrorText}>We couldn't load your feed.</Text>
            <TouchableOpacity onPress={onRefresh} hitSlop={8} accessibilityRole="button">
              <Text style={styles.loadErrorRetry}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {/* Snap & Cook — photograph a dish for an AI recipe + nutrition */}
      <Animated.View entering={FadeInDown.delay(90).duration(350)} style={styles.section}>
        <PressableScale tilt onPress={() => router.push('/snap')}>
          <View style={styles.snapBanner}>
            <View style={styles.snapIcon}>
              <Ionicons name="camera" size={22} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.snapTitle}>Snap & Cook</Text>
              <Text style={styles.snapSub} numberOfLines={1}>
                Photograph any dish — get the recipe & nutrition.
              </Text>
            </View>
            <Ionicons name="arrow-forward-circle" size={26} color={colors.accent} />
          </View>
        </PressableScale>
      </Animated.View>

      {/* Plan & Track quick actions */}
      <Animated.View entering={FadeInDown.delay(105).duration(350)} style={[styles.section, styles.quickRow]}>
        <PressableScale tilt onPress={() => router.push('/planner')} style={{ flex: 1 }}>
          <View style={[styles.quickCard, { backgroundColor: colors.brandLight }]}>
            <Ionicons name="calendar-outline" size={22} color={colors.brandDark} />
            <Text style={styles.quickTitle}>Meal plan</Text>
            <Text style={styles.quickSub}>Plan your week</Text>
          </View>
        </PressableScale>
        <PressableScale tilt onPress={() => router.push('/tracker')} style={{ flex: 1 }}>
          <View style={[styles.quickCard, { backgroundColor: colors.blueLight }]}>
            <Ionicons name="flame-outline" size={22} color={colors.blueDark} />
            <Text style={styles.quickTitle}>Track</Text>
            <Text style={styles.quickSub}>Calories & water</Text>
          </View>
        </PressableScale>
      </Animated.View>

      {/* Dish of the day (cyan gradient hero) */}
      <Animated.View entering={FadeInDown.delay(120).duration(350)} style={styles.section}>
        {trending.isLoading ? (
          <Skeleton height={190} radius={28} />
        ) : (
          <DishOfTheDay recipes={trending.data ?? []} />
        )}
      </Animated.View>

      {/* Stories strip */}
      <Animated.View entering={FadeInDown.delay(180).duration(350)}>
        <View style={styles.sectionHeaderPad}>
          <SectionHeader title="Food Stories" />
        </View>
        {stories.isLoading ? (
          <View style={{ paddingHorizontal: 20 }}>
            <SkeletonRow count={4} cardWidth={64} />
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.storiesRow}
          >
            {(stories.data?.content ?? []).map((story) => (
              <StoryRing
                key={story.id}
                story={story}
                onPress={() =>
                  router.push({ pathname: '/story/[id]', params: { id: String(story.id) } })
                }
              />
            ))}
          </ScrollView>
        )}
      </Animated.View>

      {/* Trending recipes 2-col */}
      <Animated.View entering={FadeInDown.delay(240).duration(350)} style={styles.sectionHeaderPad}>
        <SectionHeader
          title="Trending recipes"
          onAction={() => router.push('/(tabs)/search')}
        />
        {trending.isLoading ? (
          <SkeletonGrid count={4} />
        ) : (
          <View style={styles.grid}>
            {(trending.data ?? []).slice(0, 6).map((recipe, i) => (
              <Animated.View
                key={recipe.id}
                entering={FadeInDown.delay(280 + i * 60).duration(350)}
                style={styles.gridCell}
              >
                <RecipeCard recipe={recipe} />
              </Animated.View>
            ))}
          </View>
        )}
      </Animated.View>

      {/* Vendor spotlights */}
      <Animated.View entering={FadeInDown.delay(300).duration(350)}>
        <View style={styles.sectionHeaderPad}>
          <SectionHeader title="Vendor spotlights" onAction={() => router.push('/(tabs)/market')} />
        </View>
        {vendors.isLoading ? (
          <View style={{ paddingHorizontal: 20 }}>
            <SkeletonRow count={2} cardWidth={220} />
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.vendorRow}
          >
            {(vendors.data ?? []).map((vendor) => (
              <PressableScale
                key={vendor.id}
                tilt
                onPress={() =>
                  router.push({ pathname: '/vendor/[id]', params: { id: String(vendor.id) } })
                }
                style={styles.vendorCardWrap}
              >
                <View style={styles.vendorCard}>
                  <Image
                    source={{ uri: IMG(vendor.coverUrl) }}
                    style={styles.vendorCover}
                    contentFit="cover"
                  />
                  <View style={styles.vendorBody}>
                    <Avatar url={vendor.logoUrl} name={vendor.name} size={38} square />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.vendorName} numberOfLines={1}>
                        {vendor.name}
                      </Text>
                      <View style={styles.vendorMetaRow}>
                        <Ionicons name="star" size={11} color={colors.star} />
                        <Text style={styles.vendorMeta} numberOfLines={1}>
                          {vendor.rating.toFixed(1)} ({vendor.reviewCount}+) · {vendor.specialty}
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="arrow-forward-circle" size={26} color={colors.accent} />
                  </View>
                </View>
              </PressableScale>
            ))}
          </ScrollView>
        )}
      </Animated.View>

      {/* Premium upsell */}
      {user && !user.premium ? (
        <Animated.View entering={FadeInDown.delay(360).duration(350)} style={styles.section}>
          <PressableScale tilt onPress={() => router.push('/subscription')}>
            <View style={styles.premiumBanner}>
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumD}>D</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.premiumTitle}>Go Premium</Text>
                <Text style={styles.premiumSub}>
                  Ask Dishaspora AI, video cook-alongs & vendor chat.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.brandDark} />
            </View>
          </PressableScale>
        </Animated.View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  wordmarkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 3 },
  wordmark: { fontSize: 24, fontWeight: '800', color: colors.accent, letterSpacing: -0.5 },
  greetingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  greeting: { fontSize: 13, color: colors.inkSoft },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  loadError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  loadErrorText: { flex: 1, fontSize: 13.5, color: colors.inkSoft, fontWeight: '600' },
  loadErrorRetry: { fontSize: 13.5, color: colors.brandDark, fontWeight: '800' },
  sectionHeaderPad: { paddingHorizontal: 20, marginBottom: 12 },
  hero: {
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    height: 200,
    ...shadowStrong,
  },
  heroLeft: { flex: 1, padding: 18, justifyContent: 'center' },
  heroPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  heroPillText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  heroTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 8 },
  heroTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '800', flexShrink: 1 },
  heroSub: { color: 'rgba(255,255,255,0.9)', fontSize: 12, marginTop: 4, lineHeight: 17 },
  heroBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 12,
  },
  heroBtnText: { color: colors.blueDark, fontSize: 12.5, fontWeight: '700' },
  dots: { flexDirection: 'row', gap: 5, marginTop: 12 },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  dotActive: { backgroundColor: '#FFFFFF', width: 16 },
  heroPhotoWrap: {
    width: 176,
    height: 176,
    borderRadius: 88,
    marginRight: -44,
    overflow: 'hidden',
    borderWidth: 5,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(255,255,255,0.2)',
    ...shadowStrong,
  },
  heroPhoto: {
    width: 176,
    height: 176,
  },
  storiesRow: { paddingHorizontal: 20, gap: 14, paddingBottom: 4, marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  gridCell: { width: '47%', flexGrow: 1 },
  vendorRow: { paddingHorizontal: 20, gap: 14, paddingBottom: 8 },
  vendorCardWrap: { width: 250 },
  vendorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    ...shadow,
  },
  vendorCover: { width: '100%', height: 96, backgroundColor: colors.surfaceAlt },
  vendorBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
  },
  vendorName: { fontSize: 13.5, fontWeight: '700', color: colors.ink },
  vendorMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 1 },
  vendorMeta: { fontSize: 11, color: colors.inkSoft, flexShrink: 1 },
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.brandLight,
    borderRadius: 20,
    padding: 16,
  },
  premiumBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumD: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  premiumTitle: { fontSize: 15, fontWeight: '700', color: colors.ink },
  premiumSub: { fontSize: 12, color: colors.inkSoft, marginTop: 2 },
  snapBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.accentLight,
    borderRadius: 20,
    padding: 14,
    ...shadow,
  },
  snapIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  snapTitle: { fontSize: 15, fontWeight: '800', color: colors.ink },
  snapSub: { fontSize: 12, color: colors.inkSoft, marginTop: 2 },
  quickRow: { flexDirection: 'row', gap: 12 },
  quickCard: { borderRadius: 18, padding: 16, gap: 6, ...shadow },
  quickTitle: { fontSize: 15, fontWeight: '800', color: colors.ink, marginTop: 4 },
  quickSub: { fontSize: 12, color: colors.inkSoft },
});
