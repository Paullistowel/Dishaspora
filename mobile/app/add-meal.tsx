import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PrimaryButton from '@/components/PrimaryButton';
import ScreenHeader from '@/components/ScreenHeader';
import { api } from '@/api';
import { prettyDate } from '@/date';
import { colors, radius } from '@/theme';
import type { MealSlot, PlannedMeal } from '@/types';

const SLOTS: MealSlot[] = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];
const num = (s: string) => Math.max(0, parseInt(s.replace(/[^0-9]/g, '') || '0', 10));

export default function AddMeal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const params = useLocalSearchParams<{ date: string; slot?: MealSlot; id?: string }>();
  const date = params.date;
  const editing = !!params.id;

  const [slot, setSlot] = useState<MealSlot>(params.slot ?? 'BREAKFAST');
  const [title, setTitle] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [busy, setBusy] = useState(false);

  // In edit mode, load the meal from the day's list.
  const existing = useQuery({
    queryKey: ['plan', 'day', date],
    queryFn: () => api.get<PlannedMeal[]>('/plan', { from: date, to: date }),
    enabled: editing,
  });
  useEffect(() => {
    if (!editing || !existing.data) return;
    const m = existing.data.find((x) => String(x.id) === params.id);
    if (m) {
      setSlot(m.slot);
      setTitle(m.title);
      setCalories(String(m.calories));
      setProtein(String(m.protein));
      setCarbs(String(m.carbs));
      setFat(String(m.fat));
    }
  }, [existing.data, editing, params.id]);

  const save = async () => {
    if (!title.trim()) return Alert.alert('Missing name', 'Give the meal a name.');
    setBusy(true);
    const body = {
      date,
      slot,
      title: title.trim(),
      calories: num(calories),
      protein: num(protein),
      carbs: num(carbs),
      fat: num(fat),
    };
    try {
      if (editing) await api.put(`/plan/${params.id}`, body);
      else await api.post('/plan', body);
      qc.invalidateQueries({ queryKey: ['plan'] });
      qc.invalidateQueries({ queryKey: ['diary'] });
      router.back();
    } catch (e: any) {
      Alert.alert('Could not save', e?.message ?? 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ flex: 1, paddingTop: insets.top + 6 }}>
        <ScreenHeader title={editing ? 'Edit meal' : 'Add meal'} />
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled">
          <Text style={styles.date}>{prettyDate(date)}</Text>

          <View style={styles.slotRow}>
            {SLOTS.map((sl) => (
              <TouchableOpacity
                key={sl}
                style={[styles.slotChip, slot === sl && styles.slotChipActive]}
                onPress={() => setSlot(sl)}
              >
                <Text style={[styles.slotChipText, slot === sl && styles.slotChipTextActive]}>
                  {sl.charAt(0) + sl.slice(1).toLowerCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Field label="Meal">
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Jollof rice with chicken"
              placeholderTextColor={colors.inkFaint}
            />
          </Field>
          <Field label="Calories (kcal)">
            <TextInput
              style={styles.input}
              value={calories}
              onChangeText={setCalories}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={colors.inkFaint}
            />
          </Field>
          <View style={styles.macroRow}>
            <Field label="Protein (g)" style={{ flex: 1 }}>
              <TextInput style={styles.input} value={protein} onChangeText={setProtein} keyboardType="number-pad" placeholder="0" placeholderTextColor={colors.inkFaint} />
            </Field>
            <Field label="Carbs (g)" style={{ flex: 1 }}>
              <TextInput style={styles.input} value={carbs} onChangeText={setCarbs} keyboardType="number-pad" placeholder="0" placeholderTextColor={colors.inkFaint} />
            </Field>
            <Field label="Fat (g)" style={{ flex: 1 }}>
              <TextInput style={styles.input} value={fat} onChangeText={setFat} keyboardType="number-pad" placeholder="0" placeholderTextColor={colors.inkFaint} />
            </Field>
          </View>

          <PrimaryButton title={editing ? 'Save changes' : 'Add to plan'} loading={busy} onPress={save} style={{ marginTop: 8 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

function Field({ label, children, style }: { label: string; children: React.ReactNode; style?: any }) {
  return (
    <View style={style}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  date: { fontSize: 14, fontWeight: '700', color: colors.accentDark },
  slotRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  slotChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: colors.surface },
  slotChipActive: { backgroundColor: colors.accent },
  slotChipText: { fontSize: 13, fontWeight: '600', color: colors.inkSoft },
  slotChipTextActive: { color: '#FFF' },
  label: { fontSize: 12.5, fontWeight: '700', color: colors.inkSoft, marginBottom: 6 },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 15,
    color: colors.ink,
  },
  macroRow: { flexDirection: 'row', gap: 10 },
});
