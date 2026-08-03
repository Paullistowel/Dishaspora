import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '@/components/ScreenHeader';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';
import { radius, spacing, type, type ThemeColors } from '@/theme';

// Key open-source dependencies and their licenses. Most of the RN/Expo ecosystem
// is MIT-licensed. This is a human-readable acknowledgement; generate a full
// manifest at build time if your compliance process requires one.
const LICENSES: { name: string; license: string }[] = [
  { name: 'React', license: 'MIT' },
  { name: 'React Native', license: 'MIT' },
  { name: 'Expo & Expo modules', license: 'MIT' },
  { name: 'expo-router', license: 'MIT' },
  { name: 'TanStack Query', license: 'MIT' },
  { name: 'react-native-reanimated', license: 'MIT' },
  { name: 'react-native-gesture-handler', license: 'MIT' },
  { name: 'react-native-safe-area-context', license: 'MIT' },
  { name: 'react-native-screens', license: 'MIT' },
  { name: 'react-native-svg', license: 'MIT' },
  { name: '@react-native-async-storage/async-storage', license: 'MIT' },
  { name: '@react-native-community/netinfo', license: 'MIT' },
  { name: '@expo/vector-icons (Ionicons)', license: 'MIT' },
];

export default function Licenses() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top + 6 }}>
      <ScreenHeader title={t('support.openSourceLicenses')} />
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xxxl }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.intro}>{t('support.licensesIntro')}</Text>
        <View style={styles.card}>
          {LICENSES.map((l, i) => (
            <View key={l.name} style={[styles.row, i < LICENSES.length - 1 && styles.divider]}>
              <Text style={styles.name}>{l.name}</Text>
              <Text style={styles.license}>{l.license}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    intro: { fontSize: type.size.md, color: colors.inkSoft, lineHeight: type.line.md, marginBottom: spacing.lg },
    card: { backgroundColor: colors.card, borderRadius: radius.lg, paddingHorizontal: spacing.lg },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md },
    divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.surfaceAlt },
    name: { flex: 1, fontSize: type.size.md, color: colors.ink, fontWeight: type.weight.medium },
    license: { fontSize: type.size.sm, color: colors.inkSoft, fontWeight: type.weight.semibold },
  });
