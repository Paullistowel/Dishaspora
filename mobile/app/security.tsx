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
import { useToast } from '@/context/ToastContext';
import { meetsPasswordPolicy } from '@/validation';
import { colors, radius, shadow } from '@/theme';

export default function Security() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
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
      toast.success(r.message ?? 'Password updated.');
    },
    onError: (e) =>
      toast.error(e instanceof ApiError ? e.message : 'Could not change password.'),
  });

  const deleteAccount = useMutation({
    mutationFn: () => api.del<{ message: string }>('/users/me', { password: delPassword }),
    onSuccess: async () => {
      await logout();
      toast.info('Your account has been deleted.');
      router.replace('/(auth)/login');
    },
    onError: (e) =>
      toast.error(e instanceof ApiError ? e.message : 'Could not delete account.'),
  });

  const submitPassword = () => {
    if (!current || !next || !confirm) {
      toast.error('Fill in all password fields.');
      return;
    }
    if (!meetsPasswordPolicy(next)) {
      toast.error('New password needs 8+ chars with upper, lower and a number.');
      return;
    }
    if (next !== confirm) {
      toast.error('New passwords do not match.');
      return;
    }
    changePw.mutate();
  };

  const confirmDelete = () => {
    if (!delPassword) {
      toast.error('Enter your password to delete your account.');
      return;
    }
    Alert.alert(
      'Delete account?',
      'This permanently disables your account and signs you out. Your order history is kept for records but you will lose access. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteAccount.mutate() },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ flex: 1, paddingTop: insets.top + 6 }}>
        <ScreenHeader title="Security" />
        <ScrollView
          contentContainerStyle={{ padding: 20, gap: 22, paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Change password */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Change password</Text>
            <Text style={styles.hint}>
              Signed in as {user?.email}. Use at least 8 characters with an uppercase letter,
              a lowercase letter and a number.
            </Text>
            <Input
              icon="lock-closed-outline"
              placeholder="Current password"
              value={current}
              onChangeText={setCurrent}
              secureTextEntry
              textContentType="password"
            />
            <Input
              icon="key-outline"
              placeholder="New password"
              value={next}
              onChangeText={setNext}
              secureTextEntry
              textContentType="newPassword"
            />
            <PasswordStrengthMeter password={next} />
            <Input
              icon="checkmark-done-outline"
              placeholder="Confirm new password"
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              textContentType="newPassword"
            />
            <PrimaryButton
              title="Update password"
              loading={changePw.isPending}
              onPress={submitPassword}
              style={{ marginTop: 4 }}
            />
          </View>

          {/* Change email */}
          <PressableScale
            onPress={() => router.push('/change-email')}
            scaleTo={0.98}
            accessibilityLabel="Change email address"
          >
            <View style={styles.linkRow}>
              <View style={styles.linkIcon}>
                <Ionicons name="mail-outline" size={18} color={colors.brandDark} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.linkTitle}>Change email</Text>
                <Text style={styles.linkSub}>{user?.email}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.inkFaint} />
            </View>
          </PressableScale>

          {/* Danger zone */}
          <View style={[styles.card, styles.danger]}>
            <Text style={[styles.cardTitle, { color: colors.danger }]}>Delete account</Text>
            <Text style={styles.hint}>
              Permanently disable your account. This can't be undone — confirm with your password.
            </Text>
            <Input
              icon="lock-closed-outline"
              placeholder="Your password"
              value={delPassword}
              onChangeText={setDelPassword}
              secureTextEntry
            />
            <PrimaryButton
              title="Delete my account"
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
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
