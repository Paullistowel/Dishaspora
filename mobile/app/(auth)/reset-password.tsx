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
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Input from '@/components/Input';
import PrimaryButton from '@/components/PrimaryButton';
import TwoToneTitle from '@/components/TwoToneTitle';
import { api, ApiError } from '@/api';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';
import type { ThemeColors } from '@/theme';

const STRONG = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export default function ResetPassword() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  // Support deep links like dishaspora://reset-password?token=abc
  const params = useLocalSearchParams<{ token?: string }>();
  const [token, setToken] = useState(params.token ?? '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!token.trim()) return Alert.alert(t('auth.missingTokenTitle'), t('auth.missingTokenMessage'));
    if (!STRONG.test(password)) {
      return Alert.alert(t('auth.weakPasswordTitle'), t('auth.weakPasswordMessage'));
    }
    if (password !== confirm) return Alert.alert(t('auth.passwordsDifferTitle'), t('auth.passwordsDifferMessage'));
    setBusy(true);
    try {
      await api.post<{ message: string }>('/auth/reset-password', {
        token: token.trim(),
        password,
      });
      Alert.alert(t('auth.passwordResetTitle'), t('auth.passwordResetMessage'), [
        { text: t('auth.signIn'), onPress: () => router.replace('/(auth)/login') },
      ]);
    } catch (e) {
      Alert.alert(
        t('auth.resetFailedTitle'),
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
        <Animated.View entering={FadeInDown.duration(400)}>
          <TwoToneTitle text={t('auth.setNewPasswordTitle')} size={28} style={{ marginTop: 24 }} />
          <Text style={styles.sub}>{t('auth.setNewPasswordSubtitle')}</Text>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(120).duration(400)} style={styles.form}>
          <Input
            icon="key-outline"
            placeholder={t('auth.resetTokenPlaceholder')}
            value={token}
            onChangeText={setToken}
            autoCapitalize="none"
          />
          <Input
            icon="lock-closed-outline"
            placeholder={t('auth.newPasswordPlaceholder')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <Input
            icon="lock-closed-outline"
            placeholder={t('auth.confirmNewPasswordPlaceholder')}
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
          />
          <PrimaryButton title={t('auth.resetPassword')} onPress={submit} loading={busy} style={{ marginTop: 8 }} />
        </Animated.View>
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
  });
