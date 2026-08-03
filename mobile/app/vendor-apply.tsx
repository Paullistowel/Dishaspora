import React, { useMemo, useState } from 'react';
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
import { api } from '@/api';
import ChoiceChip from '@/components/ChoiceChip';
import Input from '@/components/Input';
import PrimaryButton from '@/components/PrimaryButton';
import ScreenHeader from '@/components/ScreenHeader';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';
import type { ThemeColors } from '@/theme';
import type { Vendor, VendorType } from '@/types';

export default function VendorApply() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { refreshUser } = useAuth();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const TYPES: { label: string; value: VendorType }[] = [
    { label: t('dashboard.typeFood'), value: 'FOOD' },
    { label: t('dashboard.typeIngredient'), value: 'INGREDIENT' },
    { label: t('dashboard.typeBoth'), value: 'BOTH' },
  ];
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [type, setType] = useState<VendorType>('FOOD');
  const [specialty, setSpecialty] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');

  const apply = useMutation({
    mutationFn: () =>
      api.post<Vendor>('/vendors/apply', {
        name: name.trim(),
        bio: bio.trim(),
        type,
        specialty: specialty.trim(),
        location: location.trim(),
        phone: phone.trim(),
      }),
    onSuccess: async () => {
      await refreshUser();
      Alert.alert(
        t('dashboard.applicationSubmittedTitle'),
        t('dashboard.applicationSubmittedMessage'),
        [{ text: t('dashboard.ok'), onPress: () => router.back() }]
      );
    },
    onError: (e: any) => Alert.alert(t('dashboard.couldNotApply'), e?.message ?? t('dashboard.pleaseTryAgain')),
  });

  const valid = name.trim() && bio.trim() && specialty.trim() && location.trim() && phone.trim();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ flex: 1, paddingTop: insets.top + 6 }}>
        <ScreenHeader title={t('dashboard.becomeVendor')} />
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 60, gap: 14 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.intro}>{t('dashboard.vendorApplyIntro')}</Text>
          <Input icon="storefront-outline" placeholder={t('dashboard.businessName')} value={name} onChangeText={setName} />
          <Input
            icon="document-text-outline"
            placeholder={t('dashboard.kitchenBioPlaceholder')}
            value={bio}
            onChangeText={setBio}
            multiline
          />
          <Text style={styles.label}>{t('dashboard.whatWillYouSell')}</Text>
          <View style={styles.chips}>
            {TYPES.map((opt) => (
              <ChoiceChip
                key={opt.value}
                label={opt.label}
                selected={type === opt.value}
                onPress={() => setType(opt.value)}
              />
            ))}
          </View>
          <Input
            icon="ribbon-outline"
            placeholder={t('dashboard.specialtyPlaceholder')}
            value={specialty}
            onChangeText={setSpecialty}
          />
          <Input icon="location-outline" placeholder={t('dashboard.location')} value={location} onChangeText={setLocation} />
          <Input
            icon="call-outline"
            placeholder={t('dashboard.phoneNumber')}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <PrimaryButton
            title={t('dashboard.submitApplication')}
            disabled={!valid}
            loading={apply.isPending}
            onPress={() => apply.mutate()}
            style={{ marginTop: 8 }}
          />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    intro: { fontSize: 13.5, color: colors.inkSoft, lineHeight: 20 },
    label: { fontSize: 14, fontWeight: '600', color: colors.ink, marginTop: 4 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  });
