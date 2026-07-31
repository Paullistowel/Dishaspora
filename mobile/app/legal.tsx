import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '@/components/ScreenHeader';
import { colors, spacing, type } from '@/theme';

// Static in-app legal copy. Kept in the bundle so it's readable offline. Replace
// with your reviewed legal text (or point these at a hosted policy) before launch.
const DOCS: Record<string, { title: string; updated: string; sections: { h: string; p: string }[] }> = {
  privacy: {
    title: 'Privacy Policy',
    updated: 'Last updated: 2026',
    sections: [
      { h: 'What we collect', p: 'Account details you provide (name, email, country), content you create (recipes, reviews, orders), and basic device information used to keep the app secure and diagnose issues.' },
      { h: 'How we use it', p: 'To operate your account, process orders and payments, personalise recommendations, and improve the app. We do not sell your personal data.' },
      { h: 'Payments', p: 'Payments are processed by Paystack. We never store your full card details on our servers.' },
      { h: 'Your choices', p: 'You can edit your profile, change or delete your account at any time from Settings → Security. Deleting your account removes your personal data, subject to records we must keep for legal and accounting reasons.' },
      { h: 'Contact', p: 'Questions about privacy? Email support@dishaspora.app.' },
    ],
  },
  terms: {
    title: 'Terms & Conditions',
    updated: 'Last updated: 2026',
    sections: [
      { h: 'Using Dishaspora', p: 'By using the app you agree to use it lawfully and respectfully, and not to misuse vendor listings, reviews or messaging.' },
      { h: 'Orders & payments', p: 'Orders are agreements between you and the vendor. Prices, availability and delivery are set by vendors. Payments are handled securely via Paystack.' },
      { h: 'Content', p: 'You retain rights to content you post but grant Dishaspora a licence to display it in the app. Content that is unlawful or infringes others may be removed.' },
      { h: 'Vendors', p: 'Vendors are responsible for the accuracy of their listings and for fulfilling orders. Dishaspora moderates listings but is not a party to every transaction.' },
      { h: 'Liability', p: 'The app is provided “as is”. To the extent permitted by law, Dishaspora is not liable for indirect or consequential losses.' },
      { h: 'Contact', p: 'Questions about these terms? Email support@dishaspora.app.' },
    ],
  },
};

export default function Legal() {
  const insets = useSafeAreaInsets();
  const { doc } = useLocalSearchParams<{ doc?: string }>();
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

const styles = StyleSheet.create({
  updated: { fontSize: type.size.xs, color: colors.inkFaint, marginBottom: spacing.lg },
  section: { marginBottom: spacing.xl },
  h: { fontSize: type.size.lg, fontWeight: type.weight.bold, color: colors.ink, marginBottom: spacing.sm },
  p: { fontSize: type.size.md, color: colors.inkSoft, lineHeight: type.line.md },
});
