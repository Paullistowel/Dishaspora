import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Input from '@/components/Input';
import PrimaryButton from '@/components/PrimaryButton';
import ScreenHeader from '@/components/ScreenHeader';
import { api, ApiError } from '@/api';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';
import type { ThemeColors } from '@/theme';

export default function ChangeEmail() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');

  const change = useMutation({
    mutationFn: () =>
      api.post<{ message: string }>('/users/me/change-email', {
        newEmail: newEmail.trim(),
        password,
      }),
    onSuccess: (r) =>
      Alert.alert(t('account.almostThere'), r.message, [{ text: t('account.ok'), onPress: () => router.back() }]),
    onError: (e) =>
      Alert.alert(t('account.couldNotChangeEmail'), e instanceof ApiError ? e.message : t('account.tryAgain')),
  });

  const submit = () => {
    if (!newEmail.trim() || !password) {
      Alert.alert(t('account.missingDetails'), t('account.missingEmailPassword'));
      return;
    }
    change.mutate();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ flex: 1, paddingTop: insets.top + 6 }}>
        <ScreenHeader title={t('account.changeEmail')} />
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled">
          <Text style={styles.current}>{t('account.currentEmail')}: {user?.email}</Text>
          <Text style={styles.hint}>
            {t('account.changeEmailHint')}
          </Text>
          <Input
            icon="mail-outline"
            placeholder={t('account.newEmailAddress')}
            value={newEmail}
            onChangeText={setNewEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Input
            icon="lock-closed-outline"
            placeholder={t('account.currentPassword')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <PrimaryButton
            title={t('account.sendConfirmation')}
            loading={change.isPending}
            onPress={submit}
            style={{ marginTop: 8 }}
          />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    current: { fontSize: 14, color: colors.ink, fontWeight: '600' },
    hint: { fontSize: 13, color: colors.inkSoft, lineHeight: 20 },
  });
