import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '@/api';
import { ErrorView } from '@/components/StatusViews';
import { IMG } from '@/config';
import { useToast } from '@/context/ToastContext';
import { addDays, dayNum, startOfWeek, today, weekdayShort, weekDays } from '@/date';
import { colors, radius, shadow, shadowStrong } from '@/theme';
import type { MealSlot, PlannedMeal } from '@/types';

const SLOTS: { key: MealSlot; label: string; icon: keyof typeof Ionicons.glyphMap; tint: string; bg: string }[] = [
  { key: 'BREAKFAST', label: 'Breakfast', icon: 'cafe', tint: colors.accentDark, bg: colors.accentLight },
  { key: 'LUNCH', label: 'Lunch', icon: 'restaurant', tint: colors.brandDark, bg: colors.brandLight },
  { key: 'DINNER', label: 'Dinner', icon: 'moon', tint: colors.blueDark, bg: colors.blueLight },
  { key: 'SNACK', label: 'Snacks', icon: 'nutrition', tint: colors.success, bg: '#E4F7EC' },
];

export default function Planner() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const [selected, setSelected] = useState(today());
  const weekStart = startOfWeek(selected);
  const days = weekDays(weekStart);
  const weekEnd = days[6];

  const meals = useQuery({
    queryKey: ['plan', weekStart, weekEnd],
    queryFn: () => api.get<PlannedMeal[]>('/plan', { from: weekStart, to: weekEnd }),
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ['plan'] });

  const dayMeals = (meals.data ?? []).filter((m) => m.date === selected);
  const bySlot = (slot: MealSlot) => dayMeals.filter((m) => m.slot === slot);
  const dayTotal = dayMeals.reduce((sum, m) => sum + m.calories, 0);
  const weekTotal = (meals.data ?? []).reduce((sum, m) => sum + m.calories, 0);

  const del = (m: PlannedMeal) => {
    Alert.alert('Delete meal', `Remove “${m.title}”?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.del(`/plan/${m.id}`);
            refresh();
          } catch {
            toast.error("Couldn't delete that meal. Try again.");
          }
        },
      },
    ]);
  };
  const duplicateTomorrow = async (m: PlannedMeal) => {
    Haptics.selectionAsync().catch(() => {});
    try {
      await api.post(`/plan/${m.id}/duplicate`, { date: addDays(m.date, 1), slot: m.slot });
      refresh();
      toast.success('Copied to tomorrow.');
    } catch {
      toast.error("Couldn't copy that meal. Try again.");
    }
  };

  const generate = useMutation({
    mutationFn: () => api.post('/plan/generate', { startDate: weekStart, days: 7 }),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      refresh();
      toast.success('Week planned ✨ — built a balanced week from your recipes.');
    },
    onError: (e: any) => toast.error(e?.message ?? 'Could not generate the plan. Please try again.'),
  });

  if (meals.isError) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top + 40 }}>
        <ErrorView
          message="We couldn't load your meal plan. Check your connection and try again."
          onRetry={() => meals.refetch()}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        {/* Gradient header */}
        <LinearGradient colors={[colors.brand, colors.blue]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.hero, { paddingTop: insets.top + 10 }]}>
          <View style={styles.heroTop}>
            <TouchableOpacity onPress={() => router.back()} hitSlop={10} style={styles.heroIcon}>
              <Ionicons name="chevron-back" size={22} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.heroTitle}>Meal planner</Text>
            <TouchableOpacity onPress={() => router.push('/tracker')} hitSlop={10} style={styles.heroIcon}>
              <Ionicons name="stats-chart" size={18} color="#FFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.heroWeek}>{weekTotal.toLocaleString()} kcal planned this week</Text>

          {/* week strip */}
          <View style={styles.weekStrip}>
            {days.map((d) => {
              const active = d === selected;
              const has = (meals.data ?? []).some((m) => m.date === d);
              return (
                <TouchableOpacity key={d} onPress={() => setSelected(d)} style={styles.dayCell}>
                  <View style={[styles.dayPill, active && styles.dayActive]}>
                    <Text style={[styles.dow, active && styles.dowActive]}>{weekdayShort(d)}</Text>
                    <Text style={[styles.dnum, active && styles.dnumActive]}>{dayNum(d)}</Text>
                  </View>
                  <View style={[styles.dot, { opacity: has ? 1 : 0, backgroundColor: active ? '#FFF' : 'rgba(255,255,255,0.7)' }]} />
                </TouchableOpacity>
              );
            })}
          </View>
        </LinearGradient>

        <View style={styles.body}>
          <View style={styles.dayHeadRow}>
            <View>
              <Text style={styles.dayHeadLabel}>{selected === today() ? 'Today' : weekdayShort(selected)}</Text>
              <Text style={styles.dayHeadTotal}>{dayTotal} kcal</Text>
            </View>
            <TouchableOpacity style={styles.genBtn} onPress={() => generate.mutate()} disabled={generate.isPending}>
              <LinearGradient colors={[colors.accent, colors.accentDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.genGrad}>
                <Ionicons name="sparkles" size={15} color="#FFF" />
                <Text style={styles.genText}>{generate.isPending ? 'Planning…' : 'Generate week'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {SLOTS.map((slot, si) => (
            <Animated.View key={slot.key} entering={FadeInDown.delay(si * 80).duration(400)} style={styles.slotBlock}>
              <View style={styles.slotHead}>
                <View style={[styles.slotIcon, { backgroundColor: slot.bg }]}>
                  <Ionicons name={slot.icon} size={15} color={slot.tint} />
                </View>
                <Text style={styles.slotLabel}>{slot.label}</Text>
                <Text style={styles.slotKcal}>{bySlot(slot.key).reduce((s, m) => s + m.calories, 0)} kcal</Text>
                <TouchableOpacity
                  style={[styles.addBtn, { backgroundColor: slot.bg }]}
                  onPress={() => router.push({ pathname: '/add-meal', params: { date: selected, slot: slot.key } })}
                >
                  <Ionicons name="add" size={18} color={slot.tint} />
                </TouchableOpacity>
              </View>
              {bySlot(slot.key).length === 0 ? (
                <TouchableOpacity
                  style={styles.slotEmpty}
                  onPress={() => router.push({ pathname: '/add-meal', params: { date: selected, slot: slot.key } })}
                >
                  <Text style={styles.slotEmptyText}>Tap + to add a {slot.label.toLowerCase()} meal</Text>
                </TouchableOpacity>
              ) : (
                bySlot(slot.key).map((m) => (
                  <Animated.View key={m.id} entering={FadeIn.duration(300)}>
                    <View style={styles.mealRow}>
                      <TouchableOpacity
                        style={styles.mealMain}
                        onPress={() => router.push({ pathname: '/add-meal', params: { date: selected, slot: slot.key, id: String(m.id) } })}
                      >
                        {m.imageUrl ? (
                          <Image source={{ uri: IMG(m.imageUrl) }} style={styles.mealImg} contentFit="cover" />
                        ) : (
                          <View style={[styles.mealImg, styles.mealImgFallback]}>
                            <Ionicons name="restaurant" size={16} color={colors.inkFaint} />
                          </View>
                        )}
                        <View style={{ flex: 1 }}>
                          <Text style={styles.mealTitle} numberOfLines={1}>{m.title}</Text>
                          <Text style={styles.mealMeta}>{m.calories} kcal · P{m.protein} C{m.carbs} F{m.fat}</Text>
                        </View>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => duplicateTomorrow(m)} hitSlop={6} style={styles.iconBtn}>
                        <Ionicons name="copy-outline" size={17} color={colors.inkSoft} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => del(m)} hitSlop={6} style={styles.iconBtn}>
                        <Ionicons name="trash-outline" size={17} color={colors.danger} />
                      </TouchableOpacity>
                    </View>
                  </Animated.View>
                ))
              )}
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { borderBottomLeftRadius: 30, borderBottomRightRadius: 30, paddingHorizontal: 18, paddingBottom: 18, ...shadowStrong },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  heroTitle: { color: '#FFF', fontSize: 17, fontWeight: '800' },
  heroWeek: { color: 'rgba(255,255,255,0.9)', fontSize: 12.5, fontWeight: '600', textAlign: 'center', marginTop: 10 },
  weekStrip: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, gap: 3 },
  dayCell: { flex: 1, alignItems: 'center', gap: 5 },
  dayPill: { alignItems: 'center', paddingVertical: 8, paddingHorizontal: 4, borderRadius: 14, width: '100%', gap: 2 },
  dayActive: { backgroundColor: '#FFF' },
  dow: { fontSize: 10.5, color: 'rgba(255,255,255,0.85)', fontWeight: '700' },
  dowActive: { color: colors.blueDark },
  dnum: { fontSize: 15, fontWeight: '800', color: '#FFF' },
  dnumActive: { color: colors.ink },
  dot: { width: 5, height: 5, borderRadius: 3 },

  body: { padding: 20, gap: 6 },
  dayHeadRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  dayHeadLabel: { fontSize: 12.5, color: colors.inkSoft, fontWeight: '600' },
  dayHeadTotal: { fontSize: 22, fontWeight: '800', color: colors.ink },
  genBtn: { borderRadius: 999, overflow: 'hidden', ...shadow },
  genGrad: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 11 },
  genText: { color: '#FFF', fontSize: 13, fontWeight: '800' },

  slotBlock: { marginTop: 16 },
  slotHead: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 10 },
  slotIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  slotLabel: { flex: 1, fontSize: 15, fontWeight: '800', color: colors.ink },
  slotKcal: { fontSize: 12, color: colors.inkFaint, fontWeight: '700', marginRight: 6 },
  addBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  slotEmpty: { paddingVertical: 14, paddingHorizontal: 14, borderRadius: radius.md, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.surfaceAlt },
  slotEmptyText: { fontSize: 12.5, color: colors.inkFaint, fontWeight: '500' },
  mealRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.surface, borderRadius: radius.md, padding: 10, marginBottom: 8, ...shadow },
  mealMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 11 },
  mealImg: { width: 44, height: 44, borderRadius: 11, backgroundColor: colors.surfaceAlt },
  mealImgFallback: { alignItems: 'center', justifyContent: 'center' },
  mealTitle: { fontSize: 14, fontWeight: '700', color: colors.ink },
  mealMeta: { fontSize: 11.5, color: colors.inkSoft, marginTop: 2 },
  iconBtn: { padding: 5 },
});
