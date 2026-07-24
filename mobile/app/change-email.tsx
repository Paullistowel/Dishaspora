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
import { colors } from '@/theme';

export default function ChangeEmail() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');

  const change = useMutation({
    mutationFn: () =>
      api.post<{ message: string }>('/users/me/change-email', {
        newEmail: newEmail.trim(),
        password,
      }),
    onSuccess: (r) =>
      Alert.alert('Almost there', r.message, [{ text: 'OK', onPress: () => router.back() }]),
    onError: (e) =>
      Alert.alert('Could not change email', e instanceof ApiError ? e.message : 'Please try again.'),
  });

  const submit = () => {
    if (!newEmail.trim() || !password) {
      Alert.alert('Missing details', 'Enter your new email and current password.');
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
        <ScreenHeader title="Change email" />
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled">
          <Text style={styles.current}>Current email: {user?.email}</Text>
          <Text style={styles.hint}>
            We'll send a confirmation link to your new address. Your email only changes once you
            click it — until then, your current email stays active.
          </Text>
          <Input
            icon="mail-outline"
            placeholder="New email address"
            value={newEmail}
            onChangeText={setNewEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Input
            icon="lock-closed-outline"
            placeholder="Current password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <PrimaryButton
            title="Send confirmation"
            loading={change.isPending}
            onPress={submit}
            style={{ marginTop: 8 }}
          />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  current: { fontSize: 14, color: colors.ink, fontWeight: '600' },
  hint: { fontSize: 13, color: colors.inkSoft, lineHeight: 20 },
});
