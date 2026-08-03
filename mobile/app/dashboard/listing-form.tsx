import React, { useMemo, useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '@/api';
import ChoiceChip from '@/components/ChoiceChip';
import Input from '@/components/Input';
import PrimaryButton from '@/components/PrimaryButton';
import ScreenHeader from '@/components/ScreenHeader';
import { IMG } from '@/config';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';
import { shadow, type ThemeColors } from '@/theme';
import type { Listing, ListingType } from '@/types';

export default function ListingForm() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [type, setType] = useState<ListingType>('FOOD');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [compareAt, setCompareAt] = useState('');
  const [stockQty, setStockQty] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('pack');
  const [prepMinutes, setPrepMinutes] = useState('');
  const [linkedRecipeId, setLinkedRecipeId] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const currencyLabel = user?.country === 'NG' ? t('dashboard.currencyNgn') : t('dashboard.currencyGhs');

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setUploading(true);
    try {
      const { url } = await api.upload({
        uri: asset.uri,
        name: asset.fileName ?? 'listing.jpg',
        mimeType: asset.mimeType ?? 'image/jpeg',
      });
      setImageUrl(url);
    } catch {
      Alert.alert(t('dashboard.uploadFailed'), t('dashboard.uploadImageError'));
    } finally {
      setUploading(false);
    }
  };

  const submit = useMutation({
    mutationFn: () =>
      api.post<Listing>('/listings', {
        type,
        title: title.trim(),
        description: description.trim(),
        imageUrl,
        // price entered in major units; contract wants minor units
        amountMinor: Math.round(parseFloat(price || '0') * 100),
        compareAtMinor: compareAt ? Math.round(parseFloat(compareAt) * 100) : null,
        available: true,
        stockQty: Number(stockQty) || 0,
        quantity: quantity.trim() || '1',
        unit: unit.trim() || 'pack',
        prepMinutes: type === 'FOOD' && prepMinutes ? Number(prepMinutes) : null,
        linkedRecipeId: linkedRecipeId ? Number(linkedRecipeId) : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-listings'] });
      Alert.alert(t('dashboard.listingSubmitted'), t('dashboard.listingPendingReview'), [
        { text: t('dashboard.ok'), onPress: () => router.back() },
      ]);
    },
    onError: (e: any) => Alert.alert(t('dashboard.submissionFailed'), e?.message ?? t('dashboard.pleaseTryAgain')),
  });

  const valid = title.trim() && parseFloat(price || '0') > 0;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ flex: 1, paddingTop: insets.top + 6 }}>
        <ScreenHeader title={t('dashboard.addListing')} />
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 80, gap: 14 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.chips}>
            <ChoiceChip label={t('dashboard.cookedMeal')} selected={type === 'FOOD'} onPress={() => setType('FOOD')} />
            <ChoiceChip label={t('dashboard.ingredient')} selected={type === 'INGREDIENT'} onPress={() => setType('INGREDIENT')} />
          </View>

          <TouchableOpacity style={styles.imagePick} onPress={pickImage}>
            {imageUrl ? (
              <Image source={{ uri: IMG(imageUrl) }} style={styles.imagePreview} contentFit="cover" />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="image-outline" size={28} color={colors.inkFaint} />
                <Text style={styles.imageHint}>{uploading ? t('dashboard.uploading') : t('dashboard.addAPhoto')}</Text>
              </View>
            )}
          </TouchableOpacity>

          <Input placeholder={t('dashboard.title')} value={title} onChangeText={setTitle} />
          <Input placeholder={t('dashboard.description')} value={description} onChangeText={setDescription} multiline />

          <Text style={styles.label}>{t('dashboard.priceIn')} {currencyLabel}</Text>
          <View style={styles.row2}>
            <Input placeholder={t('dashboard.pricePlaceholder')} value={price} onChangeText={setPrice} keyboardType="decimal-pad" style={{ flex: 1 }} />
            <Input placeholder={t('dashboard.wasPricePlaceholder')} value={compareAt} onChangeText={setCompareAt} keyboardType="decimal-pad" style={{ flex: 1 }} />
          </View>
          <View style={styles.row2}>
            <Input placeholder={t('dashboard.stockQty')} value={stockQty} onChangeText={setStockQty} keyboardType="number-pad" style={{ flex: 1 }} />
            <Input placeholder={t('dashboard.qtyPerUnit')} value={quantity} onChangeText={setQuantity} style={{ flex: 1 }} />
            <Input placeholder={t('dashboard.unit')} value={unit} onChangeText={setUnit} style={{ flex: 1 }} />
          </View>
          {type === 'FOOD' ? (
            <View style={styles.row2}>
              <Input
                placeholder={t('dashboard.prepMinutes')}
                value={prepMinutes}
                onChangeText={setPrepMinutes}
                keyboardType="number-pad"
                style={{ flex: 1 }}
              />
              <Input
                placeholder={t('dashboard.linkedRecipeId')}
                value={linkedRecipeId}
                onChangeText={setLinkedRecipeId}
                keyboardType="number-pad"
                style={{ flex: 1 }}
              />
            </View>
          ) : null}

          <PrimaryButton
            title={t('dashboard.submitForReview')}
            disabled={!valid || uploading}
            loading={submit.isPending}
            onPress={() => submit.mutate()}
            style={{ marginTop: 8 }}
          />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    chips: { flexDirection: 'row', gap: 8 },
    imagePick: { borderRadius: 20, overflow: 'hidden', ...shadow },
    imagePreview: { width: '100%', height: 170 },
    imagePlaceholder: {
      height: 150,
      borderRadius: 20,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: colors.inkFaint,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    imageHint: { fontSize: 13, color: colors.inkFaint },
    label: { fontSize: 14, fontWeight: '600', color: colors.ink },
    row2: { flexDirection: 'row', gap: 10 },
  });
