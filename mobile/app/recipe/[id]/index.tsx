import React, { useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Animated, {
  FadeInDown,
  interpolate,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollViewOffset,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '@/api';
import Avatar from '@/components/Avatar';
import BasketSheet from '@/components/BasketSheet';
import CircleButton from '@/components/CircleButton';
import MetaRow from '@/components/MetaRow';
import PressableScale from '@/components/PressableScale';
import PrimaryButton from '@/components/PrimaryButton';
import RatingStars from '@/components/RatingStars';
import { Skeleton } from '@/components/Skeleton';
import { ErrorView, LoadingView } from '@/components/StatusViews';
import TwoToneTitle from '@/components/TwoToneTitle';
import Input from '@/components/Input';
import { IMG } from '@/config';
import { useAuth } from '@/context/AuthContext';
import { useStartChat } from '@/hooks/useChat';
import { colors, shadow, shadowStrong } from '@/theme';
import type { Listing, Page, Recipe, Review } from '@/types';
import { MAX_SERVINGS, MIN_SERVINGS, scaleRecipe } from '@/utils/scaling';

const { width: SCREEN_W } = Dimensions.get('window');
const HERO_H = 320;

export default function RecipeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const recipeId = Number(id);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const startChat = useStartChat();
  const queryClient = useQueryClient();
  const [basketOpen, setBasketOpen] = useState(false);
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  /** null until the cook overrides it, so we always track the recipe's own yield. */
  const [servingsOverride, setServingsOverride] = useState<number | null>(null);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);

  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const offset = useScrollViewOffset(scrollRef);
  const heroStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(offset.value, [-HERO_H, 0, HERO_H], [-HERO_H / 2, 0, HERO_H * 0.55]) },
      { scale: interpolate(offset.value, [-HERO_H, 0], [1.8, 1], 'clamp') },
    ],
  }));

  const recipe = useQuery({
    queryKey: ['recipe', recipeId],
    queryFn: () => api.get<Recipe>(`/recipes/${recipeId}`),
  });
  const reviews = useQuery({
    queryKey: ['recipe-reviews', recipeId],
    queryFn: () => api.get<Review[]>(`/recipes/${recipeId}/reviews`),
  });
  // find a linked FOOD listing for the "Order meal" pathway
  const listings = useQuery({
    queryKey: ['listings-for-recipe', recipeId, user?.country],
    queryFn: () =>
      api.get<Page<Listing>>('/listings', { type: 'FOOD', country: user?.country, page: 0, size: 50 }),
  });
  const linkedListing = useMemo(
    () => (listings.data?.content ?? []).find((l) => l.linkedRecipeId === recipeId),
    [listings.data, recipeId]
  );

  const saveMutation = useMutation({
    mutationFn: (save: boolean) =>
      save
        ? api.post(`/recipes/${recipeId}/save`)
        : api.del(`/recipes/${recipeId}/save`),
    // optimistic heart
    onMutate: async (save: boolean) => {
      await queryClient.cancelQueries({ queryKey: ['recipe', recipeId] });
      const prev = queryClient.getQueryData<Recipe>(['recipe', recipeId]);
      if (prev) queryClient.setQueryData(['recipe', recipeId], { ...prev, savedByMe: save });
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['recipe', recipeId], ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['saved'] });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: () =>
      api.post<Review>(`/recipes/${recipeId}/reviews`, {
        rating: reviewRating,
        comment: reviewText.trim(),
      }),
    onSuccess: () => {
      setReviewText('');
      queryClient.invalidateQueries({ queryKey: ['recipe-reviews', recipeId] });
    },
    onError: () => Alert.alert('Could not post review', 'Please try again.'),
  });

  // Premium media players (expo-video / expo-audio, SDK 54).
  // Hooks must run unconditionally, so sources are derived before early returns
  // and swapped in via replace() once the recipe loads.
  const videoSource = user?.premium ? IMG(recipe.data?.videoUrl) ?? null : null;
  const audioSource = user?.premium ? IMG(recipe.data?.audioUrl) ?? null : null;
  const videoPlayer = useVideoPlayer(null);
  const audioPlayer = useAudioPlayer(null);
  const audioStatus = useAudioPlayerStatus(audioPlayer);
  React.useEffect(() => {
    if (videoSource) videoPlayer.replace(videoSource);
  }, [videoSource, videoPlayer]);
  React.useEffect(() => {
    if (audioSource) audioPlayer.replace(audioSource);
  }, [audioSource, audioPlayer]);
  const audioPlaying = audioStatus.playing;

  const toggleAudio = () => {
    try {
      if (audioPlaying) {
        audioPlayer.pause();
      } else {
        audioPlayer.play();
      }
    } catch {
      Alert.alert('Playback error', 'Could not play the audio guide.');
    }
  };

  if (recipe.isLoading) return <LoadingView />;
  if (recipe.isError || !recipe.data)
    return <ErrorView message="Could not load this recipe." onRetry={() => recipe.refetch()} />;

  const rec = recipe.data;
  const servings = servingsOverride ?? rec.servings;
  const scaled = scaleRecipe(rec, servings);
  const totalMin = scaled.totalMinutes;
  const isRescaled = servings !== rec.servings;
  const setServings = (next: number) =>
    setServingsOverride(Math.min(MAX_SERVINGS, Math.max(MIN_SERVINGS, next)));

  const watchPreparation = async () => {
    const url = rec.videoSearchUrl;
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Could not open YouTube', 'Try searching for this dish manually.');
    }
  };
  const contactVendor = () => {
    if (rec.vendorId) startChat(rec.vendorId);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Animated.ScrollView
        ref={scrollRef}
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Parallax hero */}
        <View style={styles.heroWrap}>
          <Animated.View style={[StyleSheet.absoluteFill, heroStyle]}>
            <Image source={{ uri: IMG(rec.imageUrl) }} style={styles.hero} contentFit="cover" />
          </Animated.View>
        </View>

        <View style={styles.body}>
          {/* Two-tone title + calorie badge */}
          <Animated.View entering={FadeInDown.duration(320)} style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <TwoToneTitle text={rec.title} size={26} />
              <Text style={styles.description} numberOfLines={2}>
                {rec.description}
              </Text>
            </View>
            <View style={styles.calBadge}>
              <Text style={styles.calValue}>{scaled.caloriesPerServing}</Text>
              <Text style={styles.calUnit}>kcal each</Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(50).duration(320)} style={{ marginTop: 8 }}>
            <RatingStars rating={rec.rating} reviewCount={rec.reviewCount} />
          </Animated.View>

          {/* Meta row */}
          <Animated.View entering={FadeInDown.delay(90).duration(320)} style={{ marginTop: 14 }}>
            <MetaRow
              items={[
                { icon: 'people-outline', label: `${servings} servings` },
                { icon: 'time-outline', label: `${totalMin} min total` },
                { icon: 'flame-outline', label: `${scaled.caloriesTotal} Kcal total` },
              ]}
            />
          </Animated.View>

          {/* Servings scaler — drives ingredients, times and total calories */}
          <Animated.View entering={FadeInDown.delay(110).duration(320)} style={styles.servingsCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.servingsTitle}>Cooking for</Text>
              <Text style={styles.servingsHint}>
                {isRescaled
                  ? `Scaled from the original ${rec.servings}`
                  : 'Adjust to rescale the whole recipe'}
              </Text>
            </View>
            {isRescaled ? (
              <TouchableOpacity
                onPress={() => setServingsOverride(null)}
                style={styles.resetBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.resetText}>Reset</Text>
              </TouchableOpacity>
            ) : null}
            <View style={styles.stepper}>
              <TouchableOpacity
                onPress={() => setServings(servings - 1)}
                disabled={servings <= MIN_SERVINGS}
                style={[styles.stepBtn, servings <= MIN_SERVINGS && styles.stepBtnOff]}
                activeOpacity={0.7}
                accessibilityLabel="Fewer servings"
              >
                <Ionicons name="remove" size={18} color={colors.brandDark} />
              </TouchableOpacity>
              <Text style={styles.stepValue}>{servings}</Text>
              <TouchableOpacity
                onPress={() => setServings(servings + 1)}
                disabled={servings >= MAX_SERVINGS}
                style={[styles.stepBtn, servings >= MAX_SERVINGS && styles.stepBtnOff]}
                activeOpacity={0.7}
                accessibilityLabel="More servings"
              >
                <Ionicons name="add" size={18} color={colors.brandDark} />
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Meal frequency card */}
          <Animated.View entering={FadeInDown.delay(130).duration(320)} style={styles.freqCard}>
            <View style={styles.freqIcon}>
              <Ionicons name="calendar-outline" size={17} color={colors.brandDark} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.freqTitle}>Meal frequency: {rec.mealFrequency}</Text>
              <Text style={styles.freqReason}>{rec.mealFrequencyReason}</Text>
            </View>
          </Animated.View>

          {/* Ingredients checklist */}
          <Animated.View entering={FadeInDown.delay(170).duration(320)}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            <View style={styles.card}>
              {scaled.ingredients.map((ingredient, i) => {
                const on = !!checked[i];
                return (
                  <TouchableOpacity
                    key={i}
                    style={styles.ingredientRow}
                    onPress={() => setChecked((c) => ({ ...c, [i]: !c[i] }))}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkbox, on && styles.checkboxOn]}>
                      {on ? <Ionicons name="checkmark" size={13} color="#FFFFFF" /> : null}
                    </View>
                    <Text style={[styles.ingredientName, on && styles.ingredientDone]}>
                      {ingredient.name}
                    </Text>
                    <Text style={styles.ingredientQty}>
                      {ingredient.quantity} {ingredient.unit}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>

          {/* Steps preview */}
          <Animated.View entering={FadeInDown.delay(210).duration(320)}>
            <View style={styles.stepsHeader}>
              <Text style={styles.sectionTitle}>Steps</Text>
              <Text style={styles.stepsCount}>{rec.steps.length} steps</Text>
            </View>
            <View style={styles.card}>
              {rec.steps.slice(0, 3).map((step) => (
                <View key={step.stepNumber} style={styles.stepRow}>
                  <View style={styles.stepNum}>
                    <Text style={styles.stepNumText}>{step.stepNumber}</Text>
                  </View>
                  <Text style={styles.stepText} numberOfLines={2}>
                    {step.instruction}
                  </Text>
                </View>
              ))}
              {rec.steps.length > 3 ? (
                <Text style={styles.moreSteps}>
                  + {rec.steps.length - 3} more in Snap & Cook mode
                </Text>
              ) : null}
            </View>
          </Animated.View>

          {/* Watch someone cook it — opens a YouTube search, free for everyone */}
          {rec.videoSearchUrl ? (
            <Animated.View entering={FadeInDown.delay(230).duration(320)}>
              <TouchableOpacity
                style={styles.watchBtn}
                onPress={watchPreparation}
                activeOpacity={0.85}
                accessibilityRole="link"
                accessibilityLabel={`Watch how to prepare ${rec.title} on YouTube`}
              >
                <View style={styles.watchIcon}>
                  <Ionicons name="logo-youtube" size={19} color="#FF0000" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.watchTitle}>Watch the preparation</Text>
                  <Text style={styles.watchSub}>See {rec.title} made on YouTube</Text>
                </View>
                <Ionicons name="open-outline" size={17} color={colors.brandDark} />
              </TouchableOpacity>
            </Animated.View>
          ) : null}

          {/* Food Story */}
          {rec.story ? (
            <Animated.View entering={FadeInDown.delay(250).duration(320)}>
              <Text style={styles.sectionTitle}>Food Story</Text>
              <PressableScale
                tilt
                onPress={() =>
                  router.push({
                    pathname: '/story/[id]',
                    params: { id: '0', recipeId: String(rec.id) },
                  })
                }
              >
                <View style={styles.storyCard}>
                  <Image
                    source={{ uri: IMG(rec.storyImageUrl ?? rec.imageUrl) }}
                    style={styles.storyImg}
                    contentFit="cover"
                  />
                  <View style={{ flex: 1, padding: 14 }}>
                    <Text style={styles.storyText} numberOfLines={4}>
                      {rec.story}
                    </Text>
                    <Text style={styles.storyLink}>Read the full story</Text>
                  </View>
                </View>
              </PressableScale>
            </Animated.View>
          ) : null}

          {/* Premium media */}
          {(rec.hasVideo || rec.hasAudio) ? (
            <Animated.View entering={FadeInDown.delay(290).duration(320)}>
              <Text style={styles.sectionTitle}>Cook-along guides</Text>
              {user?.premium && (rec.videoUrl || rec.audioUrl) ? (
                <View style={{ gap: 12 }}>
                  {rec.videoUrl ? (
                    <VideoView
                      player={videoPlayer}
                      style={styles.video}
                      nativeControls
                      contentFit="cover"
                    />
                  ) : null}
                  {rec.audioUrl ? (
                    <TouchableOpacity
                      style={styles.audioRow}
                      onPress={toggleAudio}
                      activeOpacity={0.8}
                    >
                      <View style={styles.audioBtn}>
                        <Ionicons
                          name={audioPlaying ? 'pause' : 'play'}
                          size={18}
                          color="#FFFFFF"
                        />
                      </View>
                      <View>
                        <Text style={styles.audioTitle}>Audio cook-along</Text>
                        <Text style={styles.audioSub}>
                          {audioPlaying ? 'Playing — tap to pause' : 'Listen while you cook'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : (
                <View style={styles.lockedCard}>
                  <View style={styles.lockIcon}>
                    <Ionicons name="lock-closed" size={18} color={colors.accentDark} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.lockedTitle}>Video & audio guides are Premium</Text>
                    <Text style={styles.lockedSub}>
                      Cook along with{' '}
                      {rec.vendorName ?? 'our chefs'} step by step.
                    </Text>
                  </View>
                  <PrimaryButton
                    title="Go Premium"
                    small
                    onPress={() => router.push('/subscription')}
                  />
                </View>
              )}
            </Animated.View>
          ) : null}

          {/* Reviews */}
          <Animated.View entering={FadeInDown.delay(330).duration(320)}>
            <Text style={styles.sectionTitle}>Reviews</Text>
            <View style={styles.card}>
              <View style={styles.addReview}>
                <RatingStars rating={reviewRating} onRate={setReviewRating} />
                <Input
                  placeholder="Share how it turned out..."
                  value={reviewText}
                  onChangeText={setReviewText}
                  style={{ marginTop: 10 }}
                />
                <PrimaryButton
                  title="Post review"
                  small
                  loading={reviewMutation.isPending}
                  disabled={reviewText.trim().length === 0}
                  onPress={() => reviewMutation.mutate()}
                  style={{ marginTop: 10, alignSelf: 'flex-start' }}
                />
              </View>
              {reviews.isLoading ? (
                <Skeleton height={60} radius={14} style={{ marginTop: 12 }} />
              ) : (
                (reviews.data ?? []).map((review) => (
                  <View key={review.id} style={styles.reviewRow}>
                    <Avatar url={review.userAvatarUrl} name={review.userName} size={34} />
                    <View style={{ flex: 1 }}>
                      <View style={styles.reviewTop}>
                        <Text style={styles.reviewName}>{review.userName}</Text>
                        <RatingStars rating={review.rating} size={12} />
                      </View>
                      <Text style={styles.reviewComment}>{review.comment}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </Animated.View>

          {/* Vendor contact row */}
          {rec.vendorName ? (
            <Animated.View entering={FadeInDown.delay(370).duration(320)} style={styles.contactRow}>
              <Avatar url={null} name={rec.vendorName} size={44} />
              <View style={{ flex: 1 }}>
                <Text style={styles.contactName}>{rec.vendorName}</Text>
                <Text style={styles.contactRole}>Recipe vendor</Text>
              </View>
              <TouchableOpacity style={styles.contactBtn} onPress={contactVendor}>
                <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.ink} />
              </TouchableOpacity>
              {rec.vendorId ? (
                <TouchableOpacity
                  style={styles.contactBtn}
                  onPress={() =>
                    router.push({ pathname: '/vendor/[id]', params: { id: String(rec.vendorId) } })
                  }
                >
                  <Ionicons name="storefront-outline" size={18} color={colors.ink} />
                </TouchableOpacity>
              ) : null}
            </Animated.View>
          ) : null}
        </View>
      </Animated.ScrollView>

      {/* Floating hero buttons */}
      <View style={[styles.floatingRow, { top: insets.top + 8 }]}>
        <CircleButton icon="chevron-back" onPress={() => router.back()} />
        <CircleButton
          icon={rec.savedByMe ? 'heart' : 'heart-outline'}
          color={rec.savedByMe ? colors.danger : colors.ink}
          onPress={() => saveMutation.mutate(!rec.savedByMe)}
        />
      </View>

      {/* Sticky pathways bar */}
      <View style={[styles.pathways, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        <PrimaryButton
          title="Snap & Cook"
          variant="outline"
          small
          onPress={() =>
            router.push({
              pathname: '/recipe/[id]/cook',
              params: { id: String(rec.id), servings: String(servings) },
            })
          }
          style={{ flex: 1 }}
        />
        <PrimaryButton
          title="Buy ingredients"
          small
          onPress={() => setBasketOpen(true)}
          style={{ flex: 1 }}
        />
        {linkedListing ? (
          <PrimaryButton
            title="Order meal"
            variant="black"
            small
            onPress={() =>
              router.push({
                pathname: '/vendor/[id]',
                params: { id: String(linkedListing.vendorId) },
              })
            }
            style={{ flex: 1 }}
          />
        ) : null}
      </View>

      <BasketSheet recipeId={recipeId} visible={basketOpen} onClose={() => setBasketOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  heroWrap: { height: HERO_H, overflow: 'hidden', backgroundColor: colors.surfaceAlt },
  hero: { width: SCREEN_W, height: HERO_H },
  body: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -24,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  titleRow: { flexDirection: 'row', gap: 12 },
  description: { fontSize: 12.5, color: colors.inkFaint, marginTop: 6, lineHeight: 18 },
  calBadge: {
    backgroundColor: colors.accentLight,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  calValue: { fontSize: 18, fontWeight: '800', color: colors.accentDark },
  calUnit: { fontSize: 10, color: colors.accentDark, fontWeight: '600' },
  servingsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.brandLight,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 14,
    ...shadow,
  },
  servingsTitle: { fontSize: 14, fontWeight: '700', color: colors.brandDark },
  servingsHint: { fontSize: 11, color: colors.inkSoft, marginTop: 2 },
  resetBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  resetText: { fontSize: 12, fontWeight: '700', color: colors.accentDark },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.brandLight,
    borderRadius: 14,
    padding: 4,
  },
  stepBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnOff: { opacity: 0.35 },
  stepValue: {
    minWidth: 28,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '800',
    color: colors.brandDark,
  },
  watchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.brandLight,
    padding: 14,
    marginTop: 14,
    ...shadow,
  },
  watchIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: colors.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  watchTitle: { fontSize: 14, fontWeight: '700', color: colors.brandDark },
  watchSub: { fontSize: 11, color: colors.inkSoft, marginTop: 2 },
  freqCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.brandLight,
    borderRadius: 20,
    padding: 14,
    marginTop: 18,
  },
  freqIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  freqTitle: { fontSize: 13.5, fontWeight: '700', color: colors.ink },
  freqReason: { fontSize: 12, color: colors.inkSoft, marginTop: 3, lineHeight: 17 },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: colors.ink, marginTop: 22, marginBottom: 10 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    ...shadow,
  },
  ingredientRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.inkFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: colors.brandDark, borderColor: colors.brandDark },
  ingredientName: { flex: 1, fontSize: 14, color: colors.ink },
  ingredientDone: { textDecorationLine: 'line-through', color: colors.inkFaint },
  ingredientQty: { fontSize: 12.5, color: colors.inkSoft, fontWeight: '600' },
  stepsHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  stepsCount: { fontSize: 12.5, color: colors.inkFaint },
  stepRow: { flexDirection: 'row', gap: 10, paddingVertical: 7, alignItems: 'flex-start' },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: { fontSize: 12, fontWeight: '700', color: colors.accentDark },
  stepText: { flex: 1, fontSize: 13.5, color: colors.inkSoft, lineHeight: 19 },
  moreSteps: { fontSize: 12.5, color: colors.blueDark, fontWeight: '600', marginTop: 6 },
  storyCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    ...shadow,
  },
  storyImg: { width: 110, minHeight: 130, backgroundColor: colors.surfaceAlt },
  storyText: { fontSize: 12.5, color: colors.inkSoft, lineHeight: 18 },
  storyLink: { fontSize: 12.5, color: colors.blueDark, fontWeight: '700', marginTop: 8 },
  video: { width: '100%', height: 200, borderRadius: 20, backgroundColor: colors.ink },
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 12,
    ...shadow,
  },
  audioBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.brandDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioTitle: { fontSize: 14, fontWeight: '700', color: colors.ink },
  audioSub: { fontSize: 12, color: colors.inkSoft, marginTop: 1 },
  lockedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.accentLight,
    borderRadius: 20,
    padding: 14,
  },
  lockIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedTitle: { fontSize: 13.5, fontWeight: '700', color: colors.ink },
  lockedSub: { fontSize: 11.5, color: colors.inkSoft, marginTop: 2 },
  addReview: { paddingBottom: 12, borderBottomWidth: 1, borderColor: colors.surfaceAlt },
  reviewRow: { flexDirection: 'row', gap: 10, paddingTop: 12 },
  reviewTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reviewName: { fontSize: 13, fontWeight: '700', color: colors.ink },
  reviewComment: { fontSize: 12.5, color: colors.inkSoft, marginTop: 3, lineHeight: 18 },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 22,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 12,
    ...shadow,
  },
  contactName: { fontSize: 14.5, fontWeight: '700', color: colors.ink },
  contactRole: { fontSize: 12, color: colors.inkSoft, marginTop: 1 },
  contactBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingRow: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pathways: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    ...shadowStrong,
  },
});
