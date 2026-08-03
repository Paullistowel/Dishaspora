import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ChoiceChip from '@/components/ChoiceChip';
import PrimaryButton from '@/components/PrimaryButton';
import ScreenHeader from '@/components/ScreenHeader';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';
import { useToast } from '@/context/ToastContext';
import { useUpdatePreferences } from '@/hooks/useAi';
import { ApiError } from '@/api';
import { radius, shadow, spacing, type, type ThemeColors } from '@/theme';

// `value` is the stable English token used for matching + storage; `labelKey`
// is the i18n key resolved at render time so labels follow the active language.
const ALLERGENS: { value: string; labelKey: string }[] = [
  { value: 'Peanuts', labelKey: 'account.allergenPeanuts' },
  { value: 'Tree nuts', labelKey: 'account.allergenTreeNuts' },
  { value: 'Dairy', labelKey: 'account.allergenDairy' },
  { value: 'Eggs', labelKey: 'account.allergenEggs' },
  { value: 'Gluten', labelKey: 'account.allergenGluten' },
  { value: 'Soy', labelKey: 'account.allergenSoy' },
  { value: 'Shellfish', labelKey: 'account.allergenShellfish' },
  { value: 'Fish', labelKey: 'account.allergenFish' },
  { value: 'Sesame', labelKey: 'account.allergenSesame' },
];
const DIETS: { value: string; labelKey: string }[] = [
  { value: 'Vegetarian', labelKey: 'account.dietVegetarian' },
  { value: 'Vegan', labelKey: 'account.dietVegan' },
  { value: 'Pescatarian', labelKey: 'account.dietPescatarian' },
  { value: 'Halal', labelKey: 'account.dietHalal' },
  { value: 'Gluten-free', labelKey: 'account.dietGlutenFree' },
  { value: 'Dairy-free', labelKey: 'account.dietDairyFree' },
  { value: 'Low-carb', labelKey: 'account.dietLowCarb' },
];
const GOALS: { key: string; labelKey: string }[] = [
  { key: 'lose_weight', labelKey: 'account.goalLoseWeight' },
  { key: 'build_muscle', labelKey: 'account.goalBuildMuscle' },
  { key: 'maintain', labelKey: 'account.goalMaintain' },
];

/** Parse a comma-separated pref string into a normalized set for chip matching. */
function toSet(csv: string | undefined): Set<string> {
  return new Set(
    (csv ?? '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
}

export default function Preferences() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const toast = useToast();
  const save = useUpdatePreferences();

  const [allergies, setAllergies] = useState<Set<string>>(() => toSet(user?.allergies));
  const [diets, setDiets] = useState<Set<string>>(() => toSet(user?.dietaryPreferences));
  const [goal, setGoal] = useState<string>(user?.fitnessGoal ?? '');

  const toggle = (set: Set<string>, setter: (s: Set<string>) => void, value: string) => {
    const key = value.toLowerCase();
    const next = new Set(set);
    next.has(key) ? next.delete(key) : next.add(key);
    setter(next);
  };

  const dirty = useMemo(() => {
    const a = [...allergies].sort().join(',');
    const d = [...diets].sort().join(',');
    return (
      a !== [...toSet(user?.allergies)].sort().join(',') ||
      d !== [...toSet(user?.dietaryPreferences)].sort().join(',') ||
      goal !== (user?.fitnessGoal ?? '')
    );
  }, [allergies, diets, goal, user]);

  const onSave = () => {
    save.mutate(
      {
        allergies: [...allergies].join(','),
        dietaryPreferences: [...diets].join(','),
        fitnessGoal: goal,
      },
      {
        onSuccess: () => toast.success(t('account.preferencesSaved')),
        onError: (e) =>
          toast.error(e instanceof ApiError ? e.message : t('account.couldNotSavePreferences')),
      }
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top + 6 }}>
      <ScreenHeader title={t('account.dietaryPreferences')} />
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xxxl }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.intro}>
          {t('account.preferencesIntro')}
        </Text>

        <Text style={styles.section}>{t('account.allergies')}</Text>
        <Text style={styles.hint}>{t('account.allergiesHint')}</Text>
        <View style={styles.chips}>
          {ALLERGENS.map((a) => (
            <ChoiceChip
              key={a.value}
              label={t(a.labelKey)}
              selected={allergies.has(a.value.toLowerCase())}
              onPress={() => toggle(allergies, setAllergies, a.value)}
            />
          ))}
        </View>

        <Text style={styles.section}>{t('account.dietaryPreferences')}</Text>
        <View style={styles.chips}>
          {DIETS.map((d) => (
            <ChoiceChip
              key={d.value}
              label={t(d.labelKey)}
              selected={diets.has(d.value.toLowerCase())}
              onPress={() => toggle(diets, setDiets, d.value)}
            />
          ))}
        </View>

        <Text style={styles.section}>{t('account.fitnessGoal')}</Text>
        <View style={styles.chips}>
          {GOALS.map((g) => (
            <ChoiceChip
              key={g.key}
              label={t(g.labelKey)}
              selected={goal === g.key}
              onPress={() => setGoal(goal === g.key ? '' : g.key)}
            />
          ))}
        </View>

        <PrimaryButton
          title={t('account.savePreferences')}
          onPress={onSave}
          loading={save.isPending}
          disabled={!dirty}
          style={{ marginTop: spacing.xxl }}
        />
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  intro: { fontSize: type.size.md, color: colors.inkSoft, lineHeight: type.line.md, marginBottom: spacing.xl },
  section: {
    fontSize: type.size.lg,
    fontWeight: type.weight.bold,
    color: colors.ink,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  hint: { fontSize: type.size.sm, color: colors.inkSoft, marginBottom: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
