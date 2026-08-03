import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PrimaryButton from '@/components/PrimaryButton';
import ScreenHeader from '@/components/ScreenHeader';
import { api } from '@/api';
import { useToast } from '@/context/ToastContext';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';
import { radius, type ThemeColors } from '@/theme';
import type { Goals } from '@/types';

const num = (s: string) => Math.max(0, parseInt(s.replace(/[^0-9]/g, '') || '0', 10));

export default function NutritionGoals() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [g, setG] = useState<Record<keyof Goals, string>>({
    calorieGoal: '',
    proteinGoal: '',
    carbGoal: '',
    fatGoal: '',
    waterGoalMl: '',
  });
  const [busy, setBusy] = useState(false);

  const goals = useQuery({ queryKey: ['diary', 'goals'], queryFn: () => api.get<Goals>('/diary/goals') });
  useEffect(() => {
    if (goals.data) {
      setG({
        calorieGoal: String(goals.data.calorieGoal),
        proteinGoal: String(goals.data.proteinGoal),
        carbGoal: String(goals.data.carbGoal),
        fatGoal: String(goals.data.fatGoal),
        waterGoalMl: String(goals.data.waterGoalMl),
      });
    }
  }, [goals.data]);

  const save = async () => {
    setBusy(true);
    try {
      await api.put<Goals>('/diary/goals', {
        calorieGoal: num(g.calorieGoal),
        proteinGoal: num(g.proteinGoal),
        carbGoal: num(g.carbGoal),
        fatGoal: num(g.fatGoal),
        waterGoalMl: num(g.waterGoalMl),
      });
      qc.invalidateQueries({ queryKey: ['diary'] });
      router.back();
    } catch (e: any) {
      toast.error(e?.message ?? t('nutrition.goalsSaveError'));
    } finally {
      setBusy(false);
    }
  };

  const rows: { key: keyof Goals; label: string; unit: string }[] = [
    { key: 'calorieGoal', label: t('nutrition.dailyCalories'), unit: 'kcal' },
    { key: 'proteinGoal', label: t('nutrition.protein'), unit: 'g' },
    { key: 'carbGoal', label: t('nutrition.carbs'), unit: 'g' },
    { key: 'fatGoal', label: t('nutrition.fat'), unit: 'g' },
    { key: 'waterGoalMl', label: t('nutrition.water'), unit: 'ml' },
  ];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ flex: 1, paddingTop: insets.top + 6 }}>
        <ScreenHeader title={t('nutrition.goalsTitle')} />
        <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }} keyboardShouldPersistTaps="handled">
          <Text style={styles.hint}>{t('nutrition.goalsHint')}</Text>
          {goals.isError ? (
            <Text style={styles.loadError}>{t('nutrition.goalsLoadError')}</Text>
          ) : null}
          {rows.map((r) => (
            <View key={r.key} style={styles.row}>
              <Text style={styles.rowLabel}>{r.label}</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  value={g[r.key]}
                  onChangeText={(text) => setG((prev) => ({ ...prev, [r.key]: text }))}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={colors.inkFaint}
                />
                <Text style={styles.unit}>{r.unit}</Text>
              </View>
            </View>
          ))}
          <PrimaryButton title={t('nutrition.saveGoals')} loading={busy} onPress={save} style={{ marginTop: 10 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    loadError: { fontSize: 12.5, color: colors.danger, lineHeight: 18 },
    hint: { fontSize: 13.5, color: colors.inkSoft, lineHeight: 20 },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    rowLabel: { fontSize: 15, color: colors.ink, fontWeight: '600' },
    inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: 14, height: 48, width: 150 },
    input: { flex: 1, fontSize: 15, color: colors.ink, textAlign: 'right' },
    unit: { fontSize: 13, color: colors.inkFaint, fontWeight: '600' },
  });
