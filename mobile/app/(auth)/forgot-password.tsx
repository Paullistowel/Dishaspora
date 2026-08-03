import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Input from '@/components/Input';
import PrimaryButton from '@/components/PrimaryButton';
import TwoToneTitle from '@/components/TwoToneTitle';
import { api, ApiError } from '@/api';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';
import type { ThemeColors } from '@/theme';

export default function ForgotPassword() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (!email.trim()) {
      Alert.alert(t('auth.missingEmailTitle'), t('auth.missingEmailMessage'));
      return;
    }
    setBusy(true);
    try {
      await api.post<{ message: string }>('/auth/forgot-password', { email: email.trim() });
      setSent(true);
    } catch (e) {
      Alert.alert(
        t('auth.somethingWentWrongTitle'),
        e instanceof ApiError ? e.message : t('auth.pleaseTryAgain')
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
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 20 }]}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity onPress={() => router.back()} hitSlop={10} style={styles.back}>
          <Ionicons name="chevron-back" size={26} color={colors.ink} />
        </TouchableOpacity>

        {sent ? (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.sentWrap}>
            <View style={styles.sentIcon}>
              <Ionicons name="mail-open-outline" size={40} color={colors.brandDark} />
            </View>
            <TwoToneTitle text={t('auth.checkYourEmail')} size={28} style={{ marginTop: 20 }} />
            <Text style={styles.sub}>
              {t('auth.resetSentPrefix')}{email.trim()}{t('auth.resetSentSuffix')}
            </Text>
            <PrimaryButton
              title={t('auth.iHaveMyToken')}
              onPress={() => router.replace('/(auth)/reset-password')}
              style={{ alignSelf: 'stretch', marginTop: 28 }}
            />
            <TouchableOpacity onPress={() => setSent(false)} style={{ marginTop: 16 }}>
              <Text style={styles.link}>{t('auth.useDifferentEmail')}</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <>
            <Animated.View entering={FadeInDown.delay(60).duration(400)}>
              <TwoToneTitle text={t('auth.forgotPasswordTitle')} size={30} style={{ marginTop: 28 }} />
              <Text style={styles.sub}>{t('auth.forgotPasswordSubtitle')}</Text>
            </Animated.View>
            <Animated.View entering={FadeInDown.delay(140).duration(400)} style={styles.form}>
              <Input
                icon="mail-outline"
                placeholder={t('auth.emailPlaceholder')}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <PrimaryButton title={t('auth.sendResetLink')} onPress={submit} loading={busy} style={{ marginTop: 8 }} />
            </Animated.View>
            <Animated.View entering={FadeInDown.delay(220).duration(400)} style={styles.footer}>
              <Text style={styles.footerText}>{t('auth.rememberedIt')} </Text>
              <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
                <Text style={styles.link}>{t('auth.backToSignIn')}</Text>
              </TouchableOpacity>
            </Animated.View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { paddingHorizontal: 28, paddingBottom: 40 },
    back: { width: 40, height: 40, justifyContent: 'center' },
    sub: { fontSize: 14, color: colors.inkSoft, marginTop: 10, lineHeight: 21 },
    form: { marginTop: 28, gap: 14 },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
    footerText: { color: colors.inkSoft, fontSize: 14 },
    link: { color: colors.blueDark, fontSize: 14, fontWeight: '600' },
    sentWrap: { alignItems: 'center', marginTop: 40 },
    sentIcon: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: colors.brandLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
