import React, { useMemo, useState } from 'react';
import {
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
import ChoiceChip from '@/components/ChoiceChip';
import Flag from '@/components/Flag';
import Input from '@/components/Input';
import FieldError from '@/components/FieldError';
import PasswordStrengthMeter from '@/components/PasswordStrengthMeter';
import PrimaryButton from '@/components/PrimaryButton';
import TwoToneTitle from '@/components/TwoToneTitle';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';
import { shadow, type ThemeColors } from '@/theme';
import { ApiError } from '@/api';
import { isValidEmail, meetsPasswordPolicy } from '@/validation';
import type { Country } from '@/types';

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
}

export default function Register() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { register } = useAuth();
  const toast = useToast();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [country, setCountry] = useState<Country>('GH');
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    if (!name.trim()) next.name = t('auth.errNameRequired');
    if (!email.trim()) next.email = t('auth.errEmailRequired');
    else if (!isValidEmail(email)) next.email = t('auth.errEmailInvalid');
    if (!password) next.password = t('auth.errPasswordRequired');
    else if (!meetsPasswordPolicy(password))
      next.password = t('auth.errPasswordPolicy');
    if (!confirm) next.confirm = t('auth.errConfirmRequired');
    else if (confirm !== password) next.confirm = t('auth.errPasswordsMismatch');
    return next;
  };

  const submit = async () => {
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setBusy(true);
    try {
      await register(name.trim(), email.trim(), password, country);
      // No auto-login: the account is unverified. Send them to sign-in with a
      // clear "check your email to verify" message.
      toast.success(t('auth.verifyEmailSent'));
      router.replace('/(auth)/login');
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        setErrors({ email: t('auth.emailAlreadyRegistered') });
        toast.error(t('auth.emailAlreadyRegistered'));
      } else {
        toast.error(
          e instanceof ApiError ? e.message : t('auth.somethingWentWrongRetry')
        );
      }
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
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 32 }]}
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
          <TwoToneTitle text={t('auth.joinDishaspora')} size={32} style={{ marginTop: 24 }} />
          <Text style={styles.sub}>{t('auth.joinSubtitle')}</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(160).duration(400)} style={styles.form}>
          <Input
            icon="person-outline"
            placeholder={t('auth.fullNamePlaceholder')}
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (errors.name) setErrors((e) => ({ ...e, name: undefined }));
            }}
            autoCapitalize="words"
            textContentType="name"
            returnKeyType="next"
          />
          <FieldError message={errors.name} />
          <Input
            icon="mail-outline"
            placeholder={t('auth.emailPlaceholder')}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
            }}
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            keyboardType="email-address"
            returnKeyType="next"
          />
          <FieldError message={errors.email} />
          <Input
            icon="lock-closed-outline"
            placeholder={t('auth.passwordPolicyPlaceholder')}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
            }}
            secureTextEntry
            textContentType="newPassword"
          />
          <PasswordStrengthMeter password={password} />
          <FieldError message={errors.password} />
          <Input
            icon="lock-closed-outline"
            placeholder={t('auth.confirmPasswordPlaceholder')}
            value={confirm}
            onChangeText={(text) => {
              setConfirm(text);
              if (errors.confirm) setErrors((e) => ({ ...e, confirm: undefined }));
            }}
            secureTextEntry
            textContentType="newPassword"
            returnKeyType="done"
            onSubmitEditing={submit}
          />
          <FieldError message={errors.confirm} />
          <Text style={styles.label}>{t('auth.shoppingFromLabel')}</Text>
          <View style={styles.chips}>
            <ChoiceChip
              label={t('auth.ghana')}
              left={<Flag country="GH" size={16} />}
              selected={country === 'GH'}
              onPress={() => setCountry('GH')}
              style={{ flex: 1, justifyContent: 'center' }}
            />
            <ChoiceChip
              label={t('auth.nigeria')}
              left={<Flag country="NG" size={16} />}
              selected={country === 'NG'}
              onPress={() => setCountry('NG')}
              style={{ flex: 1, justifyContent: 'center' }}
            />
          </View>
          <PrimaryButton title={t('auth.createAccount')} onPress={submit} loading={busy} style={{ marginTop: 8 }} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(240).duration(400)} style={styles.footer}>
          <Text style={styles.footerText}>{t('auth.alreadyHaveAccount')} </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.link}>{t('auth.signIn')}</Text>
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
      width: 64,
      height: 64,
      borderRadius: 22,
      backgroundColor: colors.brandLight,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      ...shadow,
    },
    logo: { width: 64, height: 64 },
    sub: { fontSize: 14, color: colors.inkSoft, marginTop: 8, lineHeight: 21 },
    form: { marginTop: 26, gap: 14 },
    label: { fontSize: 14, fontWeight: '600', color: colors.ink, marginTop: 4 },
    chips: { flexDirection: 'row', gap: 12 },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 26 },
    footerText: { color: colors.inkSoft, fontSize: 14 },
    link: { color: colors.blueDark, fontSize: 14, fontWeight: '600' },
  });
