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
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Input from '@/components/Input';
import PressableScale from '@/components/PressableScale';
import PasswordStrengthMeter from '@/components/PasswordStrengthMeter';
import PrimaryButton from '@/components/PrimaryButton';
import ScreenHeader from '@/components/ScreenHeader';
import { api, ApiError } from '@/api';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';
import { useToast } from '@/context/ToastContext';
import { meetsPasswordPolicy } from '@/validation';
import { radius, shadow, type ThemeColors } from '@/theme';

export default function Security() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const toast = useToast();

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [delPassword, setDelPassword] = useState('');

  const changePw = useMutation({
    mutationFn: () =>
      api.post<{ message: string }>('/users/me/change-password', {
        currentPassword: current,
        newPassword: next,
      }),
    onSuccess: (r) => {
      setCurrent('');
      setNext('');
      setConfirm('');
      toast.success(r.message ?? t('account.passwordUpdated'));
    },
    onError: (e) =>
      toast.error(e instanceof ApiError ? e.message : t('account.couldNotChangePassword')),
  });

  const deleteAccount = useMutation({
    mutationFn: () => api.del<{ message: string }>('/users/me', { password: delPassword }),
    onSuccess: async () => {
      await logout();
      toast.info(t('account.accountDeleted'));
      router.replace('/(auth)/login');
    },
    onError: (e) =>
      toast.error(e instanceof ApiError ? e.message : t('account.couldNotDeleteAccount')),
  });

  const submitPassword = () => {
    if (!current || !next || !confirm) {
      toast.error(t('account.fillPasswordFields'));
      return;
    }
    if (!meetsPasswordPolicy(next)) {
      toast.error(t('account.passwordPolicyError'));
      return;
    }
    if (next !== confirm) {
      toast.error(t('account.passwordsDoNotMatch'));
      return;
    }
    changePw.mutate();
  };

  const confirmDelete = () => {
    if (!delPassword) {
      toast.error(t('account.enterPasswordToDelete'));
      return;
    }
    Alert.alert(
      t('account.deleteAccountConfirmTitle'),
      t('account.deleteAccountConfirmMsg'),
      [
        { text: t('account.cancel'), style: 'cancel' },
        { text: t('account.delete'), style: 'destructive', onPress: () => deleteAccount.mutate() },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ flex: 1, paddingTop: insets.top + 6 }}>
        <ScreenHeader title={t('account.security')} />
        <ScrollView
          contentContainerStyle={{ padding: 20, gap: 22, paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Change password */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('account.changePassword')}</Text>
            <Text style={styles.hint}>
              {t('account.signedInAs')} {user?.email}. {t('account.pwPolicyHint')}
            </Text>
            <Input
              icon="lock-closed-outline"
              placeholder={t('account.currentPassword')}
              value={current}
              onChangeText={setCurrent}
              secureTextEntry
              textContentType="password"
            />
            <Input
              icon="key-outline"
              placeholder={t('account.newPassword')}
              value={next}
              onChangeText={setNext}
              secureTextEntry
              textContentType="newPassword"
            />
            <PasswordStrengthMeter password={next} />
            <Input
              icon="checkmark-done-outline"
              placeholder={t('account.confirmNewPassword')}
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              textContentType="newPassword"
            />
            <PrimaryButton
              title={t('account.updatePassword')}
              loading={changePw.isPending}
              onPress={submitPassword}
              style={{ marginTop: 4 }}
            />
          </View>

          {/* Change email */}
          <PressableScale
            onPress={() => router.push('/change-email')}
            scaleTo={0.98}
            accessibilityLabel={t('account.changeEmailA11y')}
          >
            <View style={styles.linkRow}>
              <View style={styles.linkIcon}>
                <Ionicons name="mail-outline" size={18} color={colors.brandDark} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.linkTitle}>{t('account.changeEmail')}</Text>
                <Text style={styles.linkSub}>{user?.email}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.inkFaint} />
            </View>
          </PressableScale>

          {/* Danger zone */}
          <View style={[styles.card, styles.danger]}>
            <Text style={[styles.cardTitle, { color: colors.danger }]}>{t('account.deleteAccount')}</Text>
            <Text style={styles.hint}>
              {t('account.deleteAccountHint')}
            </Text>
            <Input
              icon="lock-closed-outline"
              placeholder={t('account.yourPassword')}
              value={delPassword}
              onChangeText={setDelPassword}
              secureTextEntry
            />
            <PrimaryButton
              title={t('account.deleteMyAccount')}
              variant="danger"
              loading={deleteAccount.isPending}
              onPress={confirmDelete}
              style={{ marginTop: 4 }}
            />
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 18,
    gap: 12,
    ...shadow,
  },
  danger: { borderWidth: 1, borderColor: '#F6D5D5' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.ink },
  hint: { fontSize: 13, color: colors.inkSoft, lineHeight: 19 },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 16,
    ...shadow,
  },
  linkIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkTitle: { fontSize: 14.5, fontWeight: '600', color: colors.ink },
  linkSub: { fontSize: 12.5, color: colors.inkSoft, marginTop: 2 },
});
