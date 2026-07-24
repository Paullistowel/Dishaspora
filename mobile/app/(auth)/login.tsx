import React, { useState } from 'react';
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
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Input from '@/components/Input';
import PrimaryButton from '@/components/PrimaryButton';
import TwoToneTitle from '@/components/TwoToneTitle';
import { useAuth } from '@/context/AuthContext';
import { colors, shadow } from '@/theme';
import { ApiError } from '@/api';
import { DEMO_MODE } from '@/config';

export default function Login() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [email, setEmail] = useState(DEMO_MODE ? 'ama@demo.com' : '');
  const [password, setPassword] = useState(DEMO_MODE ? 'Demo123!' : '');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing details', 'Enter your email and password.');
      return;
    }
    setBusy(true);
    try {
      await login(email.trim(), password);
      router.replace('/(tabs)');
    } catch (e) {
      Alert.alert('Login failed', e instanceof ApiError ? e.message : 'Something went wrong.');
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
          <TwoToneTitle text="Welcome back" size={32} style={{ marginTop: 28 }} />
          <Text style={styles.sub}>Sign in to keep cooking the taste of home.</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(160).duration(400)} style={styles.form}>
          <Input
            icon="mail-outline"
            placeholder="Email address"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Input
            icon="lock-closed-outline"
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <PrimaryButton title="Sign in" onPress={submit} loading={busy} style={{ marginTop: 8 }} />
          <TouchableOpacity
            onPress={() => router.push('/(auth)/forgot-password')}
            style={{ alignSelf: 'center', marginTop: 4 }}
          >
            <Text style={styles.link}>Forgot password?</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(240).duration(400)} style={styles.footer}>
          <Text style={styles.footerText}>New to Dishaspora? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.link}>Create an account</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
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
