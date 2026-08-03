import React, { useMemo } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '@/components/ScreenHeader';
import SettingsRow from '@/components/SettingsRow';
import { useAuth } from '@/context/AuthContext';
import { useTheme, type ThemeMode } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';
import { useUnreadCount } from '@/hooks/useNotifications';
import { LOCALES, type Locale } from '@/i18n';
import { appVersion } from '@/device';
import { radius, shadow, spacing, type, type ThemeColors } from '@/theme';

/**
 * Settings hub. Groups every account/preference/support destination in one place.
 * Theme (System/Light/Dark) and Language (English/French/Twi) are live settings
 * backed by ThemeContext and I18nContext — they persist and apply immediately.
 */
export default function Settings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { colors, mode, setMode } = useTheme();
  const { t, locale, setLocale } = useI18n();
  const { data: unread = 0 } = useUnreadCount();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const confirmLogout = () =>
    Alert.alert(t('settings.logoutTitle'), t('settings.logoutMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.logout'),
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);

  const themeLabel = (m: ThemeMode) => t(`theme.${m}`);
  const chooseTheme = () =>
    Alert.alert(t('theme.choose'), undefined, [
      { text: themeLabel('system'), onPress: () => setMode('system') },
      { text: themeLabel('light'), onPress: () => setMode('light') },
      { text: themeLabel('dark'), onPress: () => setMode('dark') },
      { text: t('common.cancel'), style: 'cancel' },
    ]);

  const localeLabel = LOCALES.find((l) => l.code === locale)?.label ?? 'English';
  const chooseLanguage = () =>
    Alert.alert(t('language.choose'), undefined, [
      ...LOCALES.map((l) => ({ text: l.label, onPress: () => setLocale(l.code as Locale) })),
      { text: t('common.cancel'), style: 'cancel' as const },
    ]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top + 6 }}>
      <ScreenHeader title={t('settings.title')} />
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xxxl, gap: spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        <Section title={t('settings.account')} colors={colors} styles={styles}>
          <SettingsRow icon="person-outline" label={t('settings.editProfile')} onPress={() => router.push('/edit-profile')} />
          <SettingsRow icon="nutrition-outline" label={t('settings.dietaryPreferences')} onPress={() => router.push('/preferences')} />
          <SettingsRow
            icon="notifications-outline"
            label={t('settings.notifications')}
            badge={unread}
            onPress={() => router.push('/notifications')}
          />
          <SettingsRow
            icon="shield-checkmark-outline"
            label={t('settings.security')}
            value={user?.emailVerified ? undefined : t('settings.verifyEmail')}
            onPress={() => router.push('/security')}
            last
          />
        </Section>

        <Section title={t('settings.preferences')} colors={colors} styles={styles}>
          <SettingsRow icon="color-palette-outline" label={t('settings.theme')} value={themeLabel(mode)} onPress={chooseTheme} />
          <SettingsRow icon="language-outline" label={t('settings.language')} value={localeLabel} onPress={chooseLanguage} last />
        </Section>

        <Section title={t('settings.support')} colors={colors} styles={styles}>
          <SettingsRow icon="help-circle-outline" label={t('settings.help')} onPress={() => router.push('/help')} />
          <SettingsRow icon="chatbox-ellipses-outline" label={t('settings.feedback')} onPress={() => router.push('/feedback')} />
          <SettingsRow icon="information-circle-outline" label={t('settings.about')} value={`v${appVersion()}`} onPress={() => router.push('/about')} last />
        </Section>

        <View style={styles.card}>
          <SettingsRow icon="log-out-outline" label={t('settings.logout')} danger onPress={confirmLogout} last />
        </View>

        <Text style={styles.footer}>Dishaspora · v{appVersion()}</Text>
      </ScrollView>
    </View>
  );
}

function Section({
  title,
  children,
  styles,
}: {
  title: string;
  children: React.ReactNode;
  colors: ThemeColors;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
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
    footer: {
      textAlign: 'center',
      color: colors.inkFaint,
      fontSize: type.size.xs,
      marginTop: spacing.sm,
    },
  });
