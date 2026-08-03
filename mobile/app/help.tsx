import React, { useMemo, useState } from 'react';
import { LayoutAnimation, Platform, Pressable, ScrollView, StyleSheet, Text, UIManager, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as MailComposer from 'expo-mail-composer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '@/components/ScreenHeader';
import SettingsRow from '@/components/SettingsRow';
import { useToast } from '@/context/ToastContext';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';
import { feedbackDeviceInfo } from '@/device';
import { radius, shadow, spacing, type, type ThemeColors } from '@/theme';

const SUPPORT_EMAIL = 'support@dishaspora.app';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
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
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const FAQS: { q: string; a: string }[] = [
    { q: t('support.faqSaveQ'), a: t('support.faqSaveA') },
    { q: t('support.faqOrderQ'), a: t('support.faqOrderA') },
    { q: t('support.faqSnapQ'), a: t('support.faqSnapA') },
    { q: t('support.faqVendorQ'), a: t('support.faqVendorA') },
    { q: t('support.faqPasswordQ'), a: t('support.faqPasswordA') },
  ];

  const emailSupport = async () => {
    const available = await MailComposer.isAvailableAsync();
    if (!available) {
      toast.info(`${t('support.emailUsAt')} ${SUPPORT_EMAIL}`);
      return;
    }
    await MailComposer.composeAsync({
      recipients: [SUPPORT_EMAIL],
      subject: t('support.emailSubject'),
      body: `\n\n—\nDevice: ${feedbackDeviceInfo()}`,
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top + 6 }}>
      <ScreenHeader title={t('support.helpTitle')} />
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xxxl, gap: spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <Text style={styles.sectionTitle}>{t('support.frequentlyAsked')}</Text>
          <View style={styles.card}>
            {FAQS.map((f) => (
              <FaqItem key={f.q} q={f.q} a={f.a} />
            ))}
          </View>
        </View>

        <View>
          <Text style={styles.sectionTitle}>{t('support.getInTouch')}</Text>
          <View style={styles.card}>
            <SettingsRow icon="mail-outline" label={t('support.emailSupport')} onPress={emailSupport} />
            <SettingsRow
              icon="bug-outline"
              label={t('support.reportABug')}
              onPress={() => router.push('/feedback?type=BUG')}
            />
            <SettingsRow
              icon="bulb-outline"
              label={t('support.requestAFeature')}
              onPress={() => router.push('/feedback?type=FEATURE')}
              last
            />
          </View>
        </View>

        <View>
          <Text style={styles.sectionTitle}>{t('support.legal')}</Text>
          <View style={styles.card}>
            <SettingsRow icon="lock-closed-outline" label={t('support.privacyPolicy')} onPress={() => router.push('/legal?doc=privacy')} />
            <SettingsRow icon="document-text-outline" label={t('support.termsConditions')} onPress={() => router.push('/legal?doc=terms')} />
            <SettingsRow icon="code-slash-outline" label={t('support.openSourceLicenses')} onPress={() => router.push('/licenses')} last />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
      backgroundColor: colors.card,
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
