import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '@/components/ScreenHeader';
import SettingsRow from '@/components/SettingsRow';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useUnreadCount } from '@/hooks/useNotifications';
import { appVersion } from '@/device';
import { colors, radius, shadow, spacing, type } from '@/theme';

/**
 * Settings hub (Phase 10). Groups every account/preference/support destination in
 * one place. Security actions (password, email, delete) live on the dedicated
 * Security screen; theme/language are surfaced as "coming soon" while the app is
 * light-only and English-only (the token system is dark-ready for later).
 */
export default function Settings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const toast = useToast();
  const { data: unread = 0 } = useUnreadCount();

  const confirmLogout = () =>
    Alert.alert('Log out', 'Sign out of Dishaspora?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);

  const comingSoon = (what: string) => toast.info(`${what} is coming soon.`);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top + 6 }}>
      <ScreenHeader title="Settings" />
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xxxl, gap: spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        <Section title="Account">
          <SettingsRow icon="person-outline" label="Edit profile" onPress={() => router.push('/edit-profile')} />
          <SettingsRow
            icon="notifications-outline"
            label="Notifications"
            badge={unread}
            onPress={() => router.push('/notifications')}
          />
          <SettingsRow
            icon="shield-checkmark-outline"
            label="Security"
            value={user?.emailVerified ? undefined : 'Verify email'}
            onPress={() => router.push('/security')}
            last
          />
        </Section>

        <Section title="Preferences">
          <SettingsRow icon="color-palette-outline" label="Theme" value="Light" onPress={() => comingSoon('Dark mode')} />
          <SettingsRow icon="language-outline" label="Language" value="English" onPress={() => comingSoon('More languages')} last />
        </Section>

        <Section title="Support">
          <SettingsRow icon="help-circle-outline" label="Help & Support" onPress={() => router.push('/help')} />
          <SettingsRow icon="chatbox-ellipses-outline" label="Send feedback" onPress={() => router.push('/feedback')} />
          <SettingsRow icon="information-circle-outline" label="About Dishaspora" value={`v${appVersion()}`} onPress={() => router.push('/about')} last />
        </Section>

        <View style={styles.card}>
          <SettingsRow icon="log-out-outline" label="Log out" danger onPress={confirmLogout} last />
        </View>

        <Text style={styles.footer}>Dishaspora · v{appVersion()}</Text>
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
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
  footer: {
    textAlign: 'center',
    color: colors.inkFaint,
    fontSize: type.size.xs,
    marginTop: spacing.sm,
  },
});
