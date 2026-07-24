import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '@/api';
import { ErrorView } from '@/components/StatusViews';
import { IMG } from '@/config';
import { useToast } from '@/context/ToastContext';
import { addDays, prettyDate, today, weekdayShort } from '@/date';
import { colors, radius, shadow, shadowStrong } from '@/theme';
import type { DaySummary, DayTotals, PlannedMeal } from '@/types';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** Big animated calorie ring rendered on the gradient hero. */
function CalorieRing({ consumed, goal }: { consumed: number; goal: number }) {
  const size = 190;
  const stroke = 16;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = goal > 0 ? Math.min(1, consumed / goal) : 0;
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(pct, { duration: 1100, easing: Easing.out(Easing.cubic) });
  }, [pct]);
  const props = useAnimatedProps(() => ({ strokeDashoffset: c * (1 - progress.value) }));
  const left = Math.max(0, goal - consumed);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.28)" strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#FFFFFF"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          animatedProps={props}
          strokeLinecap="round"
        />
      </Svg>
      <Text style={styles.ringValue}>{left}</Text>
      <Text style={styles.ringUnit}>kcal left</Text>
      <View style={styles.ringChip}>
        <Text style={styles.ringChipText}>{consumed} eaten</Text>
      </View>
    </View>
  );
}

function MacroCard({ label, p, tint, delay }: { label: string; p: { consumed: number; goal: number }; tint: string; delay: number }) {
  const pct = p.goal > 0 ? Math.min(1, p.consumed / p.goal) : 0;
  const w = useSharedValue(0);
  useEffect(() => {
    w.value = withDelay(delay, withTiming(pct, { duration: 800, easing: Easing.out(Easing.cubic) }));
  }, [pct]);
  const barStyle = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(400)} style={styles.macroCard}>
      <View style={[styles.macroDot, { backgroundColor: tint }]} />
      <Text style={styles.macroLabel}>{label}</Text>
      <Text style={styles.macroValue}>
        {p.consumed}<Text style={styles.macroGoal}> /{p.goal}g</Text>
      </Text>
      <View style={styles.macroTrack}>
        <Animated.View style={[styles.macroFill, { backgroundColor: tint }, barStyle]} />
      </View>
      <Text style={[styles.macroPct, { color: tint }]}>{Math.round(pct * 100)}%</Text>
    </Animated.View>
  );
}

function ChartBar({ d, maxCal, selected, delay }: { d: DayTotals; maxCal: number; selected: boolean; delay: number }) {
  const h = useSharedValue(0);
  const target = Math.min(1, d.calories / maxCal);
  useEffect(() => {
    h.value = withDelay(delay, withSpring(target, { damping: 14, stiffness: 120 }));
  }, [target]);
  const style = useAnimatedStyle(() => ({ height: `${Math.max(2, h.value * 100)}%` }));
  return (
    <View style={styles.chartCol}>
      <View style={styles.barTrack}>
        <Animated.View style={[styles.bar, style]}>
          <LinearGradient
            colors={selected ? [colors.accent, colors.accentDark] : [colors.brand, colors.blueDark]}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
      <Text style={[styles.chartLabel, selected && { color: colors.accentDark, fontWeight: '800' }]}>
        {weekdayShort(d.date)[0]}
      </Text>
    </View>
  );
}

export default function Tracker() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const [date, setDate] = React.useState(today());
  const weekStart = addDays(date, -6);

  const summary = useQuery({
    queryKey: ['diary', 'day', date],
    queryFn: () => api.get<DaySummary>('/diary/day', { date }),
  });
  const week = useQuery({
    queryKey: ['diary', 'range', weekStart, date],
    queryFn: () => api.get<DayTotals[]>('/diary/range', { from: weekStart, to: date }),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['diary'] });
  const water = async (delta: number) => {
    Haptics.selectionAsync().catch(() => {});
    try {
      await api.post<DaySummary>('/diary/water', { date, milliliters: delta });
      refresh();
    } catch {
      toast.error("Couldn't update your water log. Try again.");
    }
  };
  const toggleEaten = async (m: PlannedMeal) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    try {
      await api.post(`/plan/${m.id}/eaten`, { eaten: !m.eaten });
      refresh();
    } catch {
      toast.error("Couldn't update that meal. Try again.");
    }
  };

  // Don't render a page of default 2000-kcal goals as if it were real logged data.
  if (summary.isError) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top + 40 }}>
        <ErrorView
          message="We couldn't load your nutrition for today. Check your connection and try again."
          onRetry={() => summary.refetch()}
        />
      </View>
    );
  }

  const s = summary.data;
  const maxCal = Math.max(s?.calorieGoal ?? 2000, ...(week.data ?? []).map((d) => d.calories), 1);
  const glasses = Math.round((s?.waterMl ?? 0) / 250);
  const goalGlasses = Math.max(1, Math.round((s?.waterGoalMl ?? 2000) / 250));
  const waterPct = Math.min(1, (s?.waterMl ?? 0) / (s?.waterGoalMl ?? 2000));

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        {/* Gradient hero */}
        <LinearGradient colors={[colors.blue, colors.brand]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.hero, { paddingTop: insets.top + 10 }]}>
          <View style={styles.heroTop}>
            <TouchableOpacity onPress={() => router.back()} hitSlop={10} style={styles.heroIcon}>
              <Ionicons name="chevron-back" size={22} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.dateStepper}>
              <TouchableOpacity onPress={() => setDate(addDays(date, -1))} hitSlop={10}>
                <Ionicons name="chevron-back" size={18} color="rgba(255,255,255,0.9)" />
              </TouchableOpacity>
              <Text style={styles.heroDate}>{date === today() ? 'Today' : prettyDate(date)}</Text>
              <TouchableOpacity onPress={() => date < today() && setDate(addDays(date, 1))} hitSlop={10} disabled={date >= today()}>
                <Ionicons name="chevron-forward" size={18} color={date >= today() ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.9)'} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => router.push('/nutrition-goals')} hitSlop={10} style={styles.heroIcon}>
              <Ionicons name="options-outline" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.ringWrap}>
            <CalorieRing consumed={s?.caloriesConsumed ?? 0} goal={s?.calorieGoal ?? 2000} />
          </View>
          <View style={styles.heroStats}>
            <HeroStat label="Goal" value={s?.calorieGoal ?? 2000} />
            <View style={styles.heroDivider} />
            <HeroStat label="Eaten" value={s?.caloriesConsumed ?? 0} />
            <View style={styles.heroDivider} />
            <HeroStat label="Planned" value={s?.caloriesPlanned ?? 0} />
          </View>
        </LinearGradient>

        <View style={styles.body}>
          {/* Macros */}
          <View style={styles.macroRow}>
            {s ? (
              <>
                <MacroCard label="Protein" p={s.protein} tint={colors.brandDark} delay={80} />
                <MacroCard label="Carbs" p={s.carbs} tint={colors.blueDark} delay={160} />
                <MacroCard label="Fat" p={s.fat} tint={colors.accent} delay={240} />
              </>
            ) : null}
          </View>

          {/* Water */}
          <Animated.View entering={FadeInDown.delay(300).duration(420)} style={styles.card}>
            <View style={styles.cardHead}>
              <View style={styles.cardTitleRow}>
                <View style={[styles.iconBadge, { backgroundColor: colors.blueLight }]}>
                  <Ionicons name="water" size={16} color={colors.blueDark} />
                </View>
                <Text style={styles.cardTitle}>Water</Text>
              </View>
              <Text style={styles.waterMl}>{s?.waterMl ?? 0} / {s?.waterGoalMl ?? 2000} ml</Text>
            </View>
            <View style={styles.glasses}>
              {Array.from({ length: goalGlasses }).map((_, i) => (
                <Ionicons key={i} name={i < glasses ? 'water' : 'water-outline'} size={24} color={i < glasses ? colors.blue : colors.surfaceAlt} />
              ))}
            </View>
            <View style={styles.waterTrack}>
              <View style={[styles.waterFill, { width: `${waterPct * 100}%` }]} />
            </View>
            <View style={styles.waterBtns}>
              <TouchableOpacity style={styles.waterBtn} onPress={() => water(-250)}>
                <Ionicons name="remove" size={18} color={colors.ink} />
                <Text style={styles.waterBtnText}>250ml</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.waterBtn, styles.waterAdd]} onPress={() => water(250)}>
                <Ionicons name="add" size={18} color="#FFF" />
                <Text style={[styles.waterBtnText, { color: '#FFF' }]}>250ml</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Weekly chart */}
          <Animated.View entering={FadeInDown.delay(360).duration(420)} style={styles.card}>
            <View style={styles.cardTitleRow}>
              <View style={[styles.iconBadge, { backgroundColor: colors.brandLight }]}>
                <Ionicons name="bar-chart" size={16} color={colors.brandDark} />
              </View>
              <Text style={styles.cardTitle}>Last 7 days</Text>
            </View>
            <View style={styles.chart}>
              {(week.data ?? []).map((d, i) => (
                <ChartBar key={d.date} d={d} maxCal={maxCal} selected={d.date === date} delay={400 + i * 60} />
              ))}
            </View>
          </Animated.View>

          {/* Meals */}
          <View style={styles.mealsHead}>
            <Text style={styles.sectionTitle}>Meals</Text>
            <TouchableOpacity onPress={() => router.push('/planner')} style={styles.plannerLink}>
              <Ionicons name="calendar-outline" size={14} color={colors.brandDark} />
              <Text style={styles.link}>Planner</Text>
            </TouchableOpacity>
          </View>
          {(s?.meals ?? []).length === 0 ? (
            <TouchableOpacity style={styles.emptyMeals} onPress={() => router.push({ pathname: '/add-meal', params: { date, slot: 'BREAKFAST' } })}>
              <Ionicons name="add-circle" size={26} color={colors.accent} />
              <Text style={styles.emptyText}>Log your first meal for this day</Text>
            </TouchableOpacity>
          ) : (
            (s?.meals ?? []).map((m, i) => (
              <Animated.View key={m.id} entering={FadeInDown.delay(420 + i * 50).duration(360)}>
                <TouchableOpacity style={styles.mealRow} onPress={() => toggleEaten(m)} activeOpacity={0.8}>
                  {m.imageUrl ? (
                    <Image source={{ uri: IMG(m.imageUrl) }} style={styles.mealImg} contentFit="cover" />
                  ) : (
                    <View style={[styles.mealImg, styles.mealImgFallback]}>
                      <Ionicons name="restaurant" size={18} color={colors.inkFaint} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.mealTitle} numberOfLines={1}>{m.title}</Text>
                    <Text style={styles.mealMeta}>{m.slot.toLowerCase()} · {m.calories} kcal · P{m.protein} C{m.carbs} F{m.fat}</Text>
                  </View>
                  <Ionicons name={m.eaten ? 'checkmark-circle' : 'ellipse-outline'} size={26} color={m.eaten ? colors.success : colors.inkFaint} />
                </TouchableOpacity>
              </Animated.View>
            ))
          )}

          <TouchableOpacity style={styles.addMealBtn} onPress={() => router.push({ pathname: '/add-meal', params: { date, slot: 'SNACK' } })}>
            <Ionicons name="add" size={18} color={colors.accent} />
            <Text style={styles.addMealText}>Add meal</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function HeroStat({ label, value }: { label: string; value: number }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={styles.heroStatValue}>{value}</Text>
      <Text style={styles.heroStatLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { borderBottomLeftRadius: 32, borderBottomRightRadius: 32, paddingHorizontal: 20, paddingBottom: 22, ...shadowStrong },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  dateStepper: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroDate: { color: '#FFF', fontSize: 16, fontWeight: '800', minWidth: 90, textAlign: 'center' },
  ringWrap: { alignItems: 'center', marginTop: 10 },
  ringValue: { fontSize: 46, fontWeight: '800', color: '#FFF' },
  ringUnit: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: -4 },
  ringChip: { marginTop: 8, backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 3 },
  ringChipText: { color: '#FFF', fontSize: 11.5, fontWeight: '700' },
  heroStats: { flexDirection: 'row', alignItems: 'center', marginTop: 18 },
  heroDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.25)' },
  heroStatValue: { color: '#FFF', fontSize: 19, fontWeight: '800' },
  heroStatLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11.5, marginTop: 1 },

  body: { padding: 20, gap: 16, marginTop: 4 },
  macroRow: { flexDirection: 'row', gap: 10 },
  macroCard: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, padding: 12, ...shadow },
  macroDot: { width: 8, height: 8, borderRadius: 4 },
  macroLabel: { fontSize: 12, color: colors.inkSoft, fontWeight: '600', marginTop: 6 },
  macroValue: { fontSize: 16, fontWeight: '800', color: colors.ink, marginTop: 2 },
  macroGoal: { fontSize: 11, color: colors.inkFaint, fontWeight: '500' },
  macroTrack: { height: 6, borderRadius: 3, backgroundColor: colors.surfaceAlt, overflow: 'hidden', marginTop: 8 },
  macroFill: { height: '100%', borderRadius: 3 },
  macroPct: { fontSize: 11, fontWeight: '800', marginTop: 5 },

  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 18, ...shadow },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  iconBadge: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 14.5, fontWeight: '800', color: colors.ink },
  waterMl: { fontSize: 13, color: colors.blueDark, fontWeight: '700' },
  glasses: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 16 },
  waterTrack: { height: 8, borderRadius: 4, backgroundColor: colors.surfaceAlt, overflow: 'hidden', marginTop: 14 },
  waterFill: { height: '100%', borderRadius: 4, backgroundColor: colors.blue },
  waterBtns: { flexDirection: 'row', gap: 12, marginTop: 16 },
  waterBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 46, borderRadius: 999, backgroundColor: colors.surfaceAlt },
  waterAdd: { backgroundColor: colors.blue },
  waterBtnText: { fontSize: 14, fontWeight: '700', color: colors.ink },

  chart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 128, marginTop: 16 },
  chartCol: { flex: 1, alignItems: 'center', gap: 7 },
  barTrack: { width: 18, height: 100, backgroundColor: colors.surfaceAlt, borderRadius: 9, justifyContent: 'flex-end', overflow: 'hidden' },
  bar: { width: '100%', borderRadius: 9, overflow: 'hidden' },
  chartLabel: { fontSize: 11, color: colors.inkFaint, fontWeight: '600' },

  mealsHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.ink },
  plannerLink: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.brandLight, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  link: { color: colors.brandDark, fontSize: 13, fontWeight: '700' },
  emptyMeals: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 22, borderRadius: radius.lg, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.surfaceAlt },
  emptyText: { fontSize: 13.5, color: colors.inkSoft, fontWeight: '600' },
  mealRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: radius.md, padding: 12, ...shadow },
  mealImg: { width: 46, height: 46, borderRadius: 12, backgroundColor: colors.surfaceAlt },
  mealImgFallback: { alignItems: 'center', justifyContent: 'center' },
  mealTitle: { fontSize: 14.5, fontWeight: '700', color: colors.ink },
  mealMeta: { fontSize: 11.5, color: colors.inkSoft, marginTop: 2, textTransform: 'capitalize' },
  addMealBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 48, borderRadius: 999, backgroundColor: colors.accentLight, marginTop: 4 },
  addMealText: { fontSize: 14, fontWeight: '700', color: colors.accentDark },
});
