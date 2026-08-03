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
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '@/api';
import Avatar from '@/components/Avatar';
import ChoiceChip from '@/components/ChoiceChip';
import Flag from '@/components/Flag';
import Input from '@/components/Input';
import PrimaryButton from '@/components/PrimaryButton';
import ScreenHeader from '@/components/ScreenHeader';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';
import type { ThemeColors } from '@/theme';
import type { Country, User } from '@/types';

export default function EditProfile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuth();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const [name, setName] = useState(user?.name ?? '');
  const [country, setCountry] = useState<Country>(user?.country ?? 'GH');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatarUrl ?? null);
  const [uploading, setUploading] = useState(false);

  const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB before compression

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > MAX_UPLOAD_BYTES) {
      Alert.alert(t('account.imageTooLarge'), t('account.imageTooLargeMsg'));
      return;
    }
    setUploading(true);
    try {
      // Normalise to a small square JPEG so avatars are consistent and light.
      const square = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 512, height: 512 } }],
        { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
      );
      const { url } = await api.upload({ uri: square.uri, name: 'avatar.jpg', mimeType: 'image/jpeg' });
      // Persist immediately so the new photo shows app-wide right away.
      const fresh = await api.put<User>('/users/me', { avatarUrl: url });
      setAvatarUrl(fresh.avatarUrl);
      await updateUser(fresh);
    } catch (e: any) {
      Alert.alert(t('account.uploadFailed'), e?.message ?? t('account.uploadFailedMsg'));
    } finally {
      setUploading(false);
    }
  };

  const removeAvatar = async () => {
    setUploading(true);
    try {
      const fresh = await api.put<User>('/users/me', { avatarUrl: '' });
      setAvatarUrl(null);
      await updateUser(fresh);
    } catch (e: any) {
      Alert.alert(t('account.couldNotRemove'), e?.message ?? t('account.tryAgain'));
    } finally {
      setUploading(false);
    }
  };

  const save = useMutation({
    mutationFn: () =>
      api.put<User>('/users/me', { name: name.trim(), country, avatarUrl }),
    onSuccess: async (fresh) => {
      await updateUser(fresh);
      router.back();
    },
    onError: (e: any) => Alert.alert(t('account.couldNotSave'), e?.message ?? t('account.tryAgain')),
  });

  const resend = useMutation({
    mutationFn: () => api.post<{ message: string }>('/auth/resend-verification', { email: user?.email }),
    onSuccess: (r) => Alert.alert(t('account.verificationSent'), r.message),
    onError: (e: any) => Alert.alert(t('account.couldNotSend'), e?.message ?? t('account.tryAgain')),
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ flex: 1, paddingTop: insets.top + 6 }}>
        <ScreenHeader title={t('account.editProfile')} />
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.avatarWrap} onPress={pickAvatar} disabled={uploading}>
            <Avatar url={avatarUrl} name={name} size={92} />
            <View style={styles.avatarEdit}>
              <Ionicons name="camera-outline" size={15} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          {uploading ? <Text style={styles.uploading}>{t('account.uploadingPhoto')}</Text> : null}
          {avatarUrl ? (
            <TouchableOpacity onPress={removeAvatar} disabled={uploading} style={{ alignSelf: 'center' }}>
              <Text style={styles.removePhoto}>{t('account.removePhoto')}</Text>
            </TouchableOpacity>
          ) : null}
          <Input icon="person-outline" placeholder={t('account.fullName')} value={name} onChangeText={setName} />

          {/* Email + verification (Phases 7 & 8) */}
          <Text style={styles.label}>{t('account.email')}</Text>
          <View style={styles.emailRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.emailText} numberOfLines={1}>{user?.email}</Text>
              <View style={styles.emailBadgeRow}>
                <Ionicons
                  name={user?.emailVerified ? 'checkmark-circle' : 'alert-circle-outline'}
                  size={13}
                  color={user?.emailVerified ? colors.success : colors.accentDark}
                />
                <Text style={[styles.emailBadge, { color: user?.emailVerified ? colors.success : colors.accentDark }]}>
                  {user?.emailVerified ? t('account.verified') : t('account.notVerified')}
                </Text>
                {user?.pendingEmail ? (
                  <Text style={styles.pending}>· {t('account.pending')}: {user.pendingEmail}</Text>
                ) : null}
              </View>
            </View>
            <TouchableOpacity onPress={() => router.push('/change-email')}>
              <Text style={styles.link}>{t('account.change')}</Text>
            </TouchableOpacity>
          </View>
          {!user?.emailVerified ? (
            <TouchableOpacity onPress={() => resend.mutate()} disabled={resend.isPending}>
              <Text style={styles.link}>
                {resend.isPending ? t('account.sending') : t('account.resendVerification')}
              </Text>
            </TouchableOpacity>
          ) : null}
          <Text style={styles.label}>{t('account.country')}</Text>
          <View style={styles.chips}>
            <ChoiceChip
              label={t('account.ghana')}
              left={<Flag country="GH" size={16} />}
              selected={country === 'GH'}
              onPress={() => setCountry('GH')}
              style={{ flex: 1, justifyContent: 'center' }}
            />
            <ChoiceChip
              label={t('account.nigeria')}
              left={<Flag country="NG" size={16} />}
              selected={country === 'NG'}
              onPress={() => setCountry('NG')}
              style={{ flex: 1, justifyContent: 'center' }}
            />
          </View>
          <PrimaryButton
            title={t('account.saveChanges')}
            loading={save.isPending}
            disabled={!name.trim()}
            onPress={() => save.mutate()}
            style={{ marginTop: 8 }}
          />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  avatarWrap: { alignSelf: 'center' },
  avatarEdit: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.card,
  },
  uploading: { textAlign: 'center', fontSize: 12.5, color: colors.inkSoft },
  removePhoto: { textAlign: 'center', fontSize: 13, color: colors.danger, fontWeight: '600' },
  label: { fontSize: 14, fontWeight: '600', color: colors.ink },
  chips: { flexDirection: 'row', gap: 12 },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
  },
  emailText: { fontSize: 14, color: colors.ink, fontWeight: '600' },
  emailBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3, flexWrap: 'wrap' },
  emailBadge: { fontSize: 12, fontWeight: '600' },
  pending: { fontSize: 11.5, color: colors.inkFaint },
  link: { color: colors.blueDark, fontSize: 14, fontWeight: '600' },
});
