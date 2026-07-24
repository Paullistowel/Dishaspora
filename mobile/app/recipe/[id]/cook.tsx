import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '@/api';
import { useToast } from '@/context/ToastContext';
import CircleButton from '@/components/CircleButton';
import Flag from '@/components/Flag';
import PrimaryButton from '@/components/PrimaryButton';
import { ErrorView, LoadingView } from '@/components/StatusViews';
import { IMG } from '@/config';
import { colors, shadowStrong } from '@/theme';
import type { CookedResponse, Recipe } from '@/types';
import { scaleSteps } from '@/utils/scaling';

const CONFETTI = Array.from({ length: 14 }).map((_, i) => ({
  angle: (i / 14) * Math.PI * 2,
  distance: 90 + (i % 3) * 26,
  color: [colors.brand, colors.accent, colors.blue, colors.success][i % 4],
  delay: 120 + i * 24,
}));

function ConfettiDot({ dot }: { dot: (typeof CONFETTI)[number] }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(dot.delay, withSpring(1, { damping: 12, stiffness: 90 }));
  }, [t, dot.delay]);
  const style = useAnimatedStyle(() => ({
    opacity: 1 - t.value * 0.65,
    transform: [
      { translateX: Math.cos(dot.angle) * dot.distance * t.value },
      { translateY: Math.sin(dot.angle) * dot.distance * t.value },
      { scale: 0.6 + t.value * 0.7 },
    ],
  }));
  return <Animated.View style={[styles.confetti, { backgroundColor: dot.color }, style]} />;
}

function StampModal({
  result,
  onClose,
}: {
  result: CookedResponse;
  onClose: () => void;
}) {
  const scale = useSharedValue(0);
  const rotate = useSharedValue(-30);
  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    scale.value = withSpring(1, { damping: 10, stiffness: 120 });
    rotate.value = withSpring(0, { damping: 9, stiffness: 100 });
  }, [scale, rotate]);
  const stampStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
  }));
  const { stamp, newStamp } = result;
  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <Animated.View entering={FadeIn} style={styles.modalCard}>
          <View style={styles.confettiWrap}>
            {CONFETTI.map((dot, i) => (
              <ConfettiDot key={i} dot={dot} />
            ))}
            <Animated.View style={[styles.stampSeal, stampStyle]}>
              <Flag country={stamp.country} size={30} />
              <View style={styles.stampCheck}>
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              </View>
            </Animated.View>
          </View>
          <Text style={styles.modalTitle}>
            {newStamp ? 'New passport stamp!' : 'Dish cooked!'}
          </Text>
          <Text style={styles.modalSub}>
            {newStamp
              ? `Welcome to ${stamp.countryName} — your ${stamp.cuisine} journey begins.`
              : `${stamp.countryName} progress: ${stamp.recipesCooked}/${stamp.totalRecipes} dishes cooked.`}
          </Text>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(100, (stamp.recipesCooked / Math.max(stamp.totalRecipes, 1)) * 100)}%` },
              ]}
            />
          </View>
          <PrimaryButton title="Continue" onPress={onClose} style={{ marginTop: 20, alignSelf: 'stretch' }} />
        </Animated.View>
      </View>
    </Modal>
  );
}

export default function SnapAndCook() {
  const { id, servings } = useLocalSearchParams<{ id: string; servings?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [index, setIndex] = useState(0);
  const [stampResult, setStampResult] = useState<CookedResponse | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const recipe = useQuery({
    queryKey: ['recipe', Number(id)],
    queryFn: () => api.get<Recipe>(`/recipes/${id}`),
  });

  const cooked = useMutation({
    mutationFn: () => api.post<CookedResponse>(`/recipes/${id}/cooked`),
    onSuccess: (res) => {
      setStampResult(res);
      queryClient.invalidateQueries({ queryKey: ['passport'] });
      queryClient.invalidateQueries({ queryKey: ['recipe', Number(id)] });
    },
    onError: () => toast.error("Couldn't save this to your passport. Try again."),
  });

  // Honour the serving count chosen on the detail screen so the step timers
  // match the batch actually being cooked.
  const steps = useMemo(() => {
    const rec = recipe.data;
    if (!rec) return [];
    const target = Number(servings);
    if (!Number.isFinite(target) || target < 1) return rec.steps;
    return scaleSteps(rec.steps, target / (rec.servings > 0 ? rec.servings : 1));
  }, [recipe.data, servings]);
  const step = steps[index];

  // countdown timer for steps with a duration
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!step?.durationMinutes) {
      setSecondsLeft(null);
      return;
    }
    setSecondsLeft(step.durationMinutes * 60);
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s === null) return null;
        if (s <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [index, step?.durationMinutes]);

  const progress = useMemo(
    () => (steps.length > 0 ? (index + 1) / steps.length : 0),
    [index, steps.length]
  );

  if (recipe.isLoading) return <LoadingView />;
  if (recipe.isError || !recipe.data || steps.length === 0)
    return <ErrorView message="No cooking steps available for this recipe." onRetry={() => recipe.refetch()} />;

  const isLast = index === steps.length - 1;
  const fmtTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(Math.max(0, s % 60)).padStart(2, '0')}`;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top + 8 }}>
      {/* top bar */}
      <View style={styles.topBar}>
        <CircleButton icon="close" onPress={() => router.back()} />
        <View style={styles.stepChip}>
          <Text style={styles.stepChipText}>
            Step {index + 1} of {steps.length}
          </Text>
        </View>
        <View style={{ width: 42 }} />
      </View>

      {/* progress bar */}
      <View style={styles.progressTrackTop}>
        <Animated.View style={[styles.progressFillTop, { width: `${progress * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 160 }} showsVerticalScrollIndicator={false}>
        {step.imageUrl || recipe.data.imageUrl ? (
          <Animated.View key={`img-${index}`} entering={FadeIn.duration(300)}>
            <Image
              source={{ uri: IMG(step.imageUrl ?? recipe.data.imageUrl) }}
              style={styles.stepImage}
              contentFit="cover"
            />
          </Animated.View>
        ) : null}

        <Animated.View key={`text-${index}`} entering={FadeInDown.duration(320)} style={styles.stepBody}>
          <Text style={styles.instruction}>{step.instruction}</Text>
          {step.durationMinutes ? (
            <View style={[styles.timerPill, secondsLeft === 0 && styles.timerDone]}>
              <Ionicons name="timer-outline" size={18} color="#FFFFFF" />
              <Text style={styles.timerText}>
                {secondsLeft === 0
                  ? 'Time is up!'
                  : secondsLeft !== null
                    ? fmtTime(secondsLeft)
                    : `${step.durationMinutes} min`}
              </Text>
            </View>
          ) : null}
        </Animated.View>
      </ScrollView>

      {/* prev / next */}
      <View style={[styles.controls, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <CircleButton
          icon="chevron-back"
          size={56}
          onPress={() => index > 0 && setIndex(index - 1)}
          style={{ opacity: index === 0 ? 0.35 : 1 }}
        />
        {isLast ? (
          <PrimaryButton
            title="Mark as cooked"
            loading={cooked.isPending}
            onPress={() => cooked.mutate()}
            style={{ flex: 1, marginHorizontal: 14 }}
          />
        ) : (
          <View style={styles.stepDots}>
            {steps.map((_, i) => (
              <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
            ))}
          </View>
        )}
        <CircleButton
          icon="chevron-forward"
          size={56}
          bg={isLast ? '#FFFFFF' : colors.accent}
          color={isLast ? colors.ink : '#FFFFFF'}
          onPress={() => !isLast && setIndex(index + 1)}
          style={{ opacity: isLast ? 0.35 : 1 }}
        />
      </View>

      {stampResult ? (
        <StampModal
          result={stampResult}
          onClose={() => {
            setStampResult(null);
            router.back();
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  stepChip: {
    backgroundColor: colors.brandLight,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  stepChipText: { color: colors.brandDark, fontSize: 13, fontWeight: '700' },
  progressTrackTop: {
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.surfaceAlt,
    marginHorizontal: 20,
    marginTop: 14,
    overflow: 'hidden',
  },
  progressFillTop: { height: '100%', borderRadius: 3, backgroundColor: colors.accent },
  stepImage: {
    width: '100%',
    height: 260,
    marginTop: 16,
    backgroundColor: colors.surfaceAlt,
  },
  stepBody: { padding: 24 },
  instruction: { fontSize: 22, fontWeight: '700', color: colors.ink, lineHeight: 32 },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginTop: 20,
    ...shadowStrong,
  },
  timerDone: { backgroundColor: colors.success },
  timerText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', fontVariant: ['tabular-nums'] },
  controls: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  stepDots: { flex: 1, flexDirection: 'row', gap: 5, justifyContent: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.surfaceAlt },
  dotActive: { backgroundColor: colors.accent, width: 16 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(23,37,42,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 26,
    alignItems: 'center',
    alignSelf: 'stretch',
    ...shadowStrong,
  },
  confettiWrap: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confetti: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  stampSeal: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: colors.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.brand,
  },
  stampCheck: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.brandDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  modalTitle: { fontSize: 21, fontWeight: '800', color: colors.ink, marginTop: 10 },
  modalSub: {
    fontSize: 13.5,
    color: colors.inkSoft,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  progressTrack: {
    alignSelf: 'stretch',
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceAlt,
    marginTop: 18,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 4, backgroundColor: colors.brandDark },
});
