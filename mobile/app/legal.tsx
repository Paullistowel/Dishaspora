import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '@/components/ScreenHeader';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';
import { spacing, type, type ThemeColors } from '@/theme';

export default function Legal() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { doc } = useLocalSearchParams<{ doc?: string }>();

  // Static in-app legal copy. Kept in the bundle so it's readable offline. Replace
  // with your reviewed legal text (or point these at a hosted policy) before launch.
  const DOCS: Record<string, { title: string; updated: string; sections: { h: string; p: string }[] }> = {
    privacy: {
      title: t('support.privacyPolicy'),
      updated: t('support.lastUpdated'),
      sections: [
        { h: t('support.privacyCollectH'), p: t('support.privacyCollectP') },
        { h: t('support.privacyUseH'), p: t('support.privacyUseP') },
        { h: t('support.privacyPaymentsH'), p: t('support.privacyPaymentsP') },
        { h: t('support.privacyChoicesH'), p: t('support.privacyChoicesP') },
        { h: t('support.privacyContactH'), p: t('support.privacyContactP') },
      ],
    },
    terms: {
      title: t('support.termsConditions'),
      updated: t('support.lastUpdated'),
      sections: [
        { h: t('support.termsUsingH'), p: t('support.termsUsingP') },
        { h: t('support.termsOrdersH'), p: t('support.termsOrdersP') },
        { h: t('support.termsContentH'), p: t('support.termsContentP') },
        { h: t('support.termsVendorsH'), p: t('support.termsVendorsP') },
        { h: t('support.termsLiabilityH'), p: t('support.termsLiabilityP') },
        { h: t('support.termsContactH'), p: t('support.termsContactP') },
      ],
    },
  };

  const content = DOCS[doc ?? 'privacy'] ?? DOCS.privacy;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top + 6 }}>
      <ScreenHeader title={content.title} />
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xxxl }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.updated}>{content.updated}</Text>
        {content.sections.map((s) => (
          <View key={s.h} style={styles.section}>
            <Text style={styles.h}>{s.h}</Text>
            <Text style={styles.p}>{s.p}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    updated: { fontSize: type.size.xs, color: colors.inkFaint, marginBottom: spacing.lg },
    section: { marginBottom: spacing.xl },
    h: { fontSize: type.size.lg, fontWeight: type.weight.bold, color: colors.ink, marginBottom: spacing.sm },
    p: { fontSize: type.size.md, color: colors.inkSoft, lineHeight: type.line.md },
  });
