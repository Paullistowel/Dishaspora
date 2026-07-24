import React, { useState } from 'react';
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
import { colors } from '@/theme';

const STRONG = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export default function ResetPassword() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // Support deep links like dishaspora://reset-password?token=abc
  const params = useLocalSearchParams<{ token?: string }>();
  const [token, setToken] = useState(params.token ?? '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!token.trim()) return Alert.alert('Missing token', 'Paste the reset token from your email.');
    if (!STRONG.test(password)) {
      return Alert.alert(
        'Weak password',
        'Use at least 8 characters with an uppercase letter, a lowercase letter and a number.'
      );
    }
    if (password !== confirm) return Alert.alert('Passwords differ', 'The two passwords do not match.');
    setBusy(true);
    try {
      await api.post<{ message: string }>('/auth/reset-password', {
        token: token.trim(),
        password,
      });
      Alert.alert('Password reset', 'You can now sign in with your new password.', [
        { text: 'Sign in', onPress: () => router.replace('/(auth)/login') },
      ]);
    } catch (e) {
      Alert.alert('Reset failed', e instanceof ApiError ? e.message : 'Please try again.');
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
          <TwoToneTitle text="Set a new password" size={28} style={{ marginTop: 24 }} />
          <Text style={styles.sub}>Enter the token from your email and choose a new password.</Text>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(120).duration(400)} style={styles.form}>
          <Input
            icon="key-outline"
            placeholder="Reset token"
            value={token}
            onChangeText={setToken}
            autoCapitalize="none"
          />
          <Input
            icon="lock-closed-outline"
            placeholder="New password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <Input
            icon="lock-closed-outline"
            placeholder="Confirm new password"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
          />
          <PrimaryButton title="Reset password" onPress={submit} loading={busy} style={{ marginTop: 8 }} />
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 28, paddingBottom: 40 },
  back: { width: 40, height: 40, justifyContent: 'center' },
  sub: { fontSize: 14, color: colors.inkSoft, marginTop: 10, lineHeight: 21 },
  form: { marginTop: 28, gap: 14 },
});
