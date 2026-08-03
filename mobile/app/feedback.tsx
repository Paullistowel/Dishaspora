import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '@/components/ScreenHeader';
import Input from '@/components/Input';
import FieldError from '@/components/FieldError';
import PrimaryButton from '@/components/PrimaryButton';
import RatingStars from '@/components/RatingStars';
import { api, ApiError } from '@/api';
import { useToast } from '@/context/ToastContext';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';
import { useMyFeedback, useSubmitFeedback } from '@/hooks/useFeedback';
import { deviceSummary } from '@/device';
import { timeAgo } from '@/date';
import { radius, spacing, type, type ThemeColors } from '@/theme';
import type { FeedbackStatus, FeedbackType } from '@/types';

export default function FeedbackScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const params = useLocalSearchParams<{ type?: string }>();
  const initialType = (['GENERAL', 'BUG', 'FEATURE', 'RATING'] as FeedbackType[]).includes(
    params.type as FeedbackType
  )
    ? (params.type as FeedbackType)
    : 'GENERAL';

  const TYPES: { key: FeedbackType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'GENERAL', label: t('support.feedbackTypeGeneral'), icon: 'chatbubble-ellipses-outline' },
    { key: 'BUG', label: t('support.feedbackTypeBug'), icon: 'bug-outline' },
    { key: 'FEATURE', label: t('support.feedbackTypeIdea'), icon: 'bulb-outline' },
    { key: 'RATING', label: t('support.feedbackTypeRate'), icon: 'star-outline' },
  ];

  const STATUS_STYLE: Record<FeedbackStatus, { label: string; tint: string; bg: string }> = {
    NEW: { label: t('support.statusSubmitted'), tint: colors.blueDark, bg: colors.blueLight },
    IN_REVIEW: { label: t('support.statusInReview'), tint: colors.accentDark, bg: colors.accentLight },
    RESOLVED: { label: t('support.statusResolved'), tint: colors.success, bg: colors.brandLight },
  };

  const [ftype, setFtype] = useState<FeedbackType>(initialType);
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(0);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useSubmitFeedback();
  const mine = useMyFeedback();

  const pickScreenshot = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    setUploading(true);
    try {
      const shrunk = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 1000 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      const { url } = await api.upload({ uri: shrunk.uri, name: 'feedback.jpg', mimeType: 'image/jpeg' });
      setScreenshotUrl(url);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t('support.screenshotAttachError'));
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = () => {
    if (!message.trim()) {
      setError(t('support.errorTellMore'));
      return;
    }
    if (ftype === 'RATING' && rating === 0) {
      setError(t('support.errorTapStar'));
      return;
    }
    setError(null);
    submit.mutate(
      {
        type: ftype,
        message: message.trim(),
        rating: ftype === 'RATING' ? rating : null,
        screenshotUrl,
      },
      {
        onSuccess: () => {
          toast.success(t('support.feedbackSent'));
          setMessage('');
          setRating(0);
          setScreenshotUrl(null);
        },
        onError: (e) =>
          toast.error(e instanceof ApiError ? e.message : t('support.feedbackSendError')),
      }
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ paddingTop: insets.top + spacing.sm }}>
        <ScreenHeader title={t('support.feedback')} />
      </View>
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xxxl }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.intro}>{t('support.feedbackIntro')}</Text>

        {/* Type selector */}
        <View style={styles.typeRow}>
          {TYPES.map((item) => {
            const active = item.key === ftype;
            return (
              <Pressable
                key={item.key}
                onPress={() => setFtype(item.key)}
                style={[styles.typeChip, active && styles.typeChipActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={item.label}
              >
                <Ionicons
                  name={item.icon}
                  size={18}
                  color={active ? '#FFFFFF' : colors.inkSoft}
                />
                <Text style={[styles.typeLabel, active && { color: '#FFFFFF' }]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {ftype === 'RATING' ? (
          <View style={styles.rateBox}>
            <Text style={styles.label}>{t('support.rateQuestion')}</Text>
            <RatingStars rating={rating} size={26} onRate={setRating} />
          </View>
        ) : null}

        <Text style={styles.label}>
          {ftype === 'BUG'
            ? t('support.labelWhatWentWrong')
            : ftype === 'FEATURE'
            ? t('support.labelYourIdea')
            : t('support.labelYourMessage')}
        </Text>
        <Input
          placeholder={
            ftype === 'BUG'
              ? t('support.placeholderBug')
              : t('support.placeholderMessage')
          }
          value={message}
          onChangeText={(val) => {
            setMessage(val);
            if (error) setError(null);
          }}
          multiline
          numberOfLines={5}
        />
        <FieldError message={error} />

        {/* Screenshot */}
        {screenshotUrl ? (
          <View style={styles.shotPreview}>
            <Image source={{ uri: screenshotUrl }} style={styles.shotImg} contentFit="cover" />
            <Pressable
              onPress={() => setScreenshotUrl(null)}
              style={styles.shotRemove}
              accessibilityRole="button"
              accessibilityLabel={t('support.removeScreenshot')}
            >
              <Ionicons name="close" size={16} color="#FFFFFF" />
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={pickScreenshot}
            style={styles.attach}
            accessibilityRole="button"
            accessibilityLabel={t('support.attachScreenshot')}
          >
            <Ionicons
              name={uploading ? 'hourglass-outline' : 'image-outline'}
              size={18}
              color={colors.brandDark}
            />
            <Text style={styles.attachText}>
              {uploading ? t('support.uploading') : t('support.attachScreenshotOptional')}
            </Text>
          </Pressable>
        )}

        <Text style={styles.deviceNote}>
          <Ionicons name="information-circle-outline" size={12} color={colors.inkFaint} />{' '}
          {t('support.deviceInfoPrefix')} ({deviceSummary()}) {t('support.deviceInfoSuffix')}
        </Text>

        <PrimaryButton
          title={t('support.sendFeedback')}
          onPress={onSubmit}
          loading={submit.isPending || uploading}
          style={{ marginTop: spacing.lg }}
        />

        {/* Past submissions with status */}
        {(mine.data?.length ?? 0) > 0 ? (
          <View style={styles.history}>
            <Text style={styles.historyTitle}>{t('support.yourSubmissions')}</Text>
            {mine.data!.map((f) => {
              const s = STATUS_STYLE[f.status];
              return (
                <View key={f.id} style={styles.historyRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyMsg} numberOfLines={2}>
                      {f.message}
                    </Text>
                    <Text style={styles.historyMeta}>{timeAgo(f.createdAt)}</Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: s.bg }]}>
                    <Text style={[styles.statusText, { color: s.tint }]}>{s.label}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    intro: { fontSize: type.size.md, color: colors.inkSoft, lineHeight: type.line.md, marginBottom: spacing.lg },
    typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
    typeChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
    },
    typeChipActive: { backgroundColor: colors.brandDark },
    typeLabel: { fontSize: type.size.sm, fontWeight: type.weight.semibold, color: colors.inkSoft },
    rateBox: { alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
    label: {
      fontSize: type.size.md,
      fontWeight: type.weight.semibold,
      color: colors.ink,
      marginBottom: spacing.sm,
    },
    attach: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      marginTop: spacing.md,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: colors.brandLight,
    },
    attachText: { fontSize: type.size.sm, fontWeight: type.weight.semibold, color: colors.brandDark },
    shotPreview: { marginTop: spacing.md, alignSelf: 'flex-start' },
    shotImg: { width: 120, height: 120, borderRadius: radius.md, backgroundColor: colors.surfaceAlt },
    shotRemove: {
      position: 'absolute',
      top: -6,
      right: -6,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.ink,
      alignItems: 'center',
      justifyContent: 'center',
    },
    deviceNote: { fontSize: type.size.xs, color: colors.inkFaint, marginTop: spacing.md, lineHeight: type.line.xs },
    history: { marginTop: spacing.xxxl, gap: spacing.md },
    historyTitle: { fontSize: type.size.lg, fontWeight: type.weight.bold, color: colors.ink },
    historyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
    },
    historyMsg: { fontSize: type.size.sm, color: colors.ink, lineHeight: type.line.sm },
    historyMeta: { fontSize: type.size.xs, color: colors.inkFaint, marginTop: 2 },
    statusPill: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill },
    statusText: { fontSize: type.size.xs, fontWeight: type.weight.bold },
  });
