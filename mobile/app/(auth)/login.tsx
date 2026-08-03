import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Input from '@/components/Input';
import PrimaryButton from '@/components/PrimaryButton';
import TwoToneTitle from '@/components/TwoToneTitle';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';
import { shadow, type ThemeColors } from '@/theme';
import { ApiError } from '@/api';
import { DEMO_MODE } from '@/config';

export default function Login() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [email, setEmail] = useState(DEMO_MODE ? 'ama@demo.com' : '');
  const [password, setPassword] = useState(DEMO_MODE ? 'Demo123!' : '');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password) {
      Alert.alert(t('auth.missingDetailsTitle'), t('auth.missingDetailsMessage'));
      return;
    }
    setBusy(true);
    try {
      await login(email.trim(), password);
      router.replace('/(tabs)');
    } catch (e) {
      Alert.alert(
        t('auth.loginFailedTitle'),
        e instanceof ApiError ? e.message : t('auth.somethingWentWrong')
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 40 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeInDown.duration(400)} style={styles.logoBadge}>
          <Image
            source={require('../../assets/images/dishaspora-logo.png')}
            style={styles.logo}
            contentFit="cover"
          />
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(80).duration(400)}>
          <TwoToneTitle text={t('auth.welcomeBack')} size={32} style={{ marginTop: 28 }} />
          <Text style={styles.sub}>{t('auth.signInSubtitle')}</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(160).duration(400)} style={styles.form}>
          <Input
            icon="mail-outline"
            placeholder={t('auth.emailPlaceholder')}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Input
            icon="lock-closed-outline"
            placeholder={t('auth.passwordPlaceholder')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <PrimaryButton title={t('auth.signIn')} onPress={submit} loading={busy} style={{ marginTop: 8 }} />
          <TouchableOpacity
            onPress={() => router.push('/(auth)/forgot-password')}
            style={{ alignSelf: 'center', marginTop: 4 }}
          >
            <Text style={styles.link}>{t('auth.forgotPassword')}</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(240).duration(400)} style={styles.footer}>
          <Text style={styles.footerText}>{t('auth.newToDishaspora')} </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.link}>{t('auth.createAnAccount')}</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { paddingHorizontal: 28, paddingBottom: 40 },
    logoBadge: {
      width: 72,
      height: 72,
      borderRadius: 24,
      backgroundColor: colors.brandLight,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      ...shadow,
    },
    logo: { width: 72, height: 72 },
    sub: { fontSize: 14, color: colors.inkSoft, marginTop: 8, lineHeight: 21 },
    form: { marginTop: 32, gap: 14 },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
    footerText: { color: colors.inkSoft, fontSize: 14 },
    link: { color: colors.blueDark, fontSize: 14, fontWeight: '600' },
  });
