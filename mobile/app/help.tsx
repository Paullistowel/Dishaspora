import React, { useState } from 'react';
import { LayoutAnimation, Platform, Pressable, ScrollView, StyleSheet, Text, UIManager, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as MailComposer from 'expo-mail-composer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '@/components/ScreenHeader';
import SettingsRow from '@/components/SettingsRow';
import { useToast } from '@/context/ToastContext';
import { feedbackDeviceInfo } from '@/device';
import { colors, radius, shadow, spacing, type } from '@/theme';

const SUPPORT_EMAIL = 'support@dishaspora.app';

const FAQS: { q: string; a: string }[] = [
  {
    q: 'How do I save a recipe?',
    a: 'Open any recipe and tap the heart icon. Saved recipes appear under Profile → My favorites.',
  },
  {
    q: 'How does ordering work?',
    a: 'Add ingredients or dishes to your basket from a vendor, then check out. You pay securely via Paystack and can track the order status under Profile → My orders.',
  },
  {
    q: 'What is Snap & Cook?',
    a: 'Snap a photo of a dish or your ingredients and Dishaspora suggests recipes you can make, with steps and nutrition.',
  },
  {
    q: 'How do I become a vendor?',
    a: 'Go to Profile → Become a vendor and submit your store details. Once approved you can list dishes and ingredients.',
  },
  {
    q: 'I forgot my password',
    a: 'On the sign-in screen tap “Forgot password” and follow the emailed link to reset it.',
  },
];

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Pressable
      onPress={() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setOpen((o) => !o);
      }}
      style={styles.faqItem}
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      accessibilityLabel={q}
    >
      <View style={styles.faqQRow}>
        <Text style={styles.faqQ}>{q}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={colors.inkFaint} />
      </View>
      {open ? <Text style={styles.faqA}>{a}</Text> : null}
    </Pressable>
  );
}

export default function Help() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();

  const emailSupport = async () => {
    const available = await MailComposer.isAvailableAsync();
    if (!available) {
      toast.info(`Email us at ${SUPPORT_EMAIL}`);
      return;
    }
    await MailComposer.composeAsync({
      recipients: [SUPPORT_EMAIL],
      subject: 'Dishaspora support request',
      body: `\n\n—\nDevice: ${feedbackDeviceInfo()}`,
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top + 6 }}>
      <ScreenHeader title="Help & Support" />
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xxxl, gap: spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <Text style={styles.sectionTitle}>Frequently asked</Text>
          <View style={styles.card}>
            {FAQS.map((f) => (
              <FaqItem key={f.q} q={f.q} a={f.a} />
            ))}
          </View>
        </View>

        <View>
          <Text style={styles.sectionTitle}>Get in touch</Text>
          <View style={styles.card}>
            <SettingsRow icon="mail-outline" label="Email support" onPress={emailSupport} />
            <SettingsRow
              icon="bug-outline"
              label="Report a bug"
              onPress={() => router.push('/feedback?type=BUG')}
            />
            <SettingsRow
              icon="bulb-outline"
              label="Request a feature"
              onPress={() => router.push('/feedback?type=FEATURE')}
              last
            />
          </View>
        </View>

        <View>
          <Text style={styles.sectionTitle}>Legal</Text>
          <View style={styles.card}>
            <SettingsRow icon="lock-closed-outline" label="Privacy Policy" onPress={() => router.push('/legal?doc=privacy')} />
            <SettingsRow icon="document-text-outline" label="Terms & Conditions" onPress={() => router.push('/legal?doc=terms')} />
            <SettingsRow icon="code-slash-outline" label="Open source licenses" onPress={() => router.push('/licenses')} last />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: type.size.sm,
    fontWeight: type.weight.bold,
    color: colors.inkFaint,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    ...shadow,
  },
  faqItem: {
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.surfaceAlt,
  },
  faqQRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  faqQ: { flex: 1, fontSize: type.size.md, fontWeight: type.weight.semibold, color: colors.ink },
  faqA: { fontSize: type.size.sm, color: colors.inkSoft, lineHeight: type.line.md, marginTop: spacing.sm },
});
