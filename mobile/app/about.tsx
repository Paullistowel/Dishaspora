import React from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '@/components/ScreenHeader';
import SettingsRow from '@/components/SettingsRow';
import PressableScale from '@/components/PressableScale';
import { useToast } from '@/context/ToastContext';
import { appVersion, buildNumber } from '@/device';
import { colors, radius, shadow, spacing, type } from '@/theme';

const WEBSITE = 'https://dishaspora.app';
const SOCIALS: { icon: keyof typeof Ionicons.glyphMap; label: string; url: string }[] = [
  { icon: 'logo-instagram', label: 'Instagram', url: 'https://instagram.com/dishaspora' },
  { icon: 'logo-twitter', label: 'X', url: 'https://x.com/dishaspora' },
  { icon: 'logo-tiktok', label: 'TikTok', url: 'https://tiktok.com/@dishaspora' },
];

export default function About() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();

  const open = async (url: string) => {
    try {
      const ok = await Linking.canOpenURL(url);
      if (ok) await Linking.openURL(url);
      else toast.info(url);
    } catch {
      toast.error('Could not open the link.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top + 6 }}>
      <ScreenHeader title="About" />
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xxxl, gap: spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand header */}
        <View style={styles.brand}>
          <View style={styles.logoBadge}>
            <Image
              source={require('../assets/images/dishaspora-logo.png')}
              style={styles.logo}
              contentFit="cover"
            />
          </View>
          <Text style={styles.name}>Dishaspora</Text>
          <Text style={styles.version}>
            Version {appVersion()} (build {buildNumber()})
          </Text>
        </View>

        {/* Mission */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Our mission</Text>
          <Text style={styles.body}>
            Dishaspora brings the recipes, stories and markets of home to the diaspora — helping
            you cook the dishes you grew up with, discover new ones, and buy authentic ingredients
            from trusted vendors, wherever you are.
          </Text>
        </View>

        {/* Company */}
        <View style={styles.card}>
          <SettingsRow icon="business-outline" label="Company" value="Dishaspora Ltd" onPress={() => open(WEBSITE)} />
          <SettingsRow icon="globe-outline" label="Website" value="dishaspora.app" onPress={() => open(WEBSITE)} last />
        </View>

        {/* Socials */}
        <View>
          <Text style={styles.sectionTitle}>Follow us</Text>
          <View style={styles.socialRow}>
            {SOCIALS.map((s) => (
              <PressableScale
                key={s.label}
                onPress={() => open(s.url)}
                scaleTo={0.94}
                accessibilityRole="button"
                accessibilityLabel={s.label}
              >
                <View style={styles.socialChip}>
                  <Ionicons name={s.icon} size={22} color={colors.brandDark} />
                </View>
              </PressableScale>
            ))}
          </View>
        </View>

        {/* Legal */}
        <View style={styles.card}>
          <SettingsRow icon="lock-closed-outline" label="Privacy Policy" onPress={() => router.push('/legal?doc=privacy')} />
          <SettingsRow icon="document-text-outline" label="Terms & Conditions" onPress={() => router.push('/legal?doc=terms')} />
          <SettingsRow icon="code-slash-outline" label="Open source licenses" onPress={() => router.push('/licenses')} last />
        </View>

        <Text style={styles.copyright}>© {new Date().getFullYear()} Dishaspora. Made with love for the diaspora.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  brand: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg },
  logoBadge: {
    width: 84,
    height: 84,
    borderRadius: 26,
    backgroundColor: colors.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...shadow,
  },
  logo: { width: 84, height: 84 },
  name: { fontSize: type.size.xxl, fontWeight: type.weight.heavy, color: colors.ink, marginTop: spacing.sm },
  version: { fontSize: type.size.sm, color: colors.inkSoft },
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
    padding: spacing.lg,
    paddingVertical: spacing.xs,
    ...shadow,
  },
  cardTitle: { fontSize: type.size.lg, fontWeight: type.weight.bold, color: colors.ink, marginTop: spacing.md },
  body: { fontSize: type.size.md, color: colors.inkSoft, lineHeight: type.line.md, marginVertical: spacing.md },
  socialRow: { flexDirection: 'row', gap: spacing.md },
  socialChip: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  copyright: { textAlign: 'center', color: colors.inkFaint, fontSize: type.size.xs, marginTop: spacing.sm, lineHeight: type.line.sm },
});
