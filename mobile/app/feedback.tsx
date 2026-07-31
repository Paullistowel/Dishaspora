import React, { useState } from 'react';
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
import { useMyFeedback, useSubmitFeedback } from '@/hooks/useFeedback';
import { deviceSummary } from '@/device';
import { timeAgo } from '@/date';
import { colors, radius, spacing, type } from '@/theme';
import type { FeedbackStatus, FeedbackType } from '@/types';

const TYPES: { key: FeedbackType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'GENERAL', label: 'General', icon: 'chatbubble-ellipses-outline' },
  { key: 'BUG', label: 'Report bug', icon: 'bug-outline' },
  { key: 'FEATURE', label: 'Idea', icon: 'bulb-outline' },
  { key: 'RATING', label: 'Rate app', icon: 'star-outline' },
];

const STATUS_STYLE: Record<FeedbackStatus, { label: string; tint: string; bg: string }> = {
  NEW: { label: 'Submitted', tint: colors.blueDark, bg: colors.blueLight },
  IN_REVIEW: { label: 'In review', tint: colors.accentDark, bg: colors.accentLight },
  RESOLVED: { label: 'Resolved', tint: colors.success, bg: '#E7F7EF' },
};

export default function FeedbackScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const params = useLocalSearchParams<{ type?: string }>();
  const initialType = (['GENERAL', 'BUG', 'FEATURE', 'RATING'] as FeedbackType[]).includes(
    params.type as FeedbackType
  )
    ? (params.type as FeedbackType)
    : 'GENERAL';

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
      toast.error(e instanceof ApiError ? e.message : 'Could not attach the screenshot.');
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = () => {
    if (!message.trim()) {
      setError('Please tell us a little more.');
      return;
    }
    if (ftype === 'RATING' && rating === 0) {
      setError('Tap a star to rate your experience.');
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
          toast.success('Thank you — your feedback was sent!');
          setMessage('');
          setRating(0);
          setScreenshotUrl(null);
        },
        onError: (e) =>
          toast.error(e instanceof ApiError ? e.message : 'Could not send feedback. Try again.'),
      }
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ paddingTop: insets.top + spacing.sm }}>
        <ScreenHeader title="Feedback" />
      </View>
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xxxl }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.intro}>
          We read every message. Tell us what's working, what's broken, or what you'd love to see.
        </Text>

        {/* Type selector */}
        <View style={styles.typeRow}>
          {TYPES.map((t) => {
            const active = t.key === ftype;
            return (
              <Pressable
                key={t.key}
                onPress={() => setFtype(t.key)}
                style={[styles.typeChip, active && styles.typeChipActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={t.label}
              >
                <Ionicons
                  name={t.icon}
                  size={18}
                  color={active ? '#FFFFFF' : colors.inkSoft}
                />
                <Text style={[styles.typeLabel, active && { color: '#FFFFFF' }]}>{t.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {ftype === 'RATING' ? (
          <View style={styles.rateBox}>
            <Text style={styles.label}>How would you rate Dishaspora?</Text>
            <RatingStars rating={rating} size={26} onRate={setRating} />
          </View>
        ) : null}

        <Text style={styles.label}>
          {ftype === 'BUG' ? 'What went wrong?' : ftype === 'FEATURE' ? 'Your idea' : 'Your message'}
        </Text>
        <Input
          placeholder={
            ftype === 'BUG'
              ? 'Describe the bug and the steps to reproduce it…'
              : 'Type your message…'
          }
          value={message}
          onChangeText={(t) => {
            setMessage(t);
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
              accessibilityLabel="Remove screenshot"
            >
              <Ionicons name="close" size={16} color="#FFFFFF" />
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={pickScreenshot}
            style={styles.attach}
            accessibilityRole="button"
            accessibilityLabel="Attach a screenshot"
          >
            <Ionicons
              name={uploading ? 'hourglass-outline' : 'image-outline'}
              size={18}
              color={colors.brandDark}
            />
            <Text style={styles.attachText}>
              {uploading ? 'Uploading…' : 'Attach a screenshot (optional)'}
            </Text>
          </Pressable>
        )}

        <Text style={styles.deviceNote}>
          <Ionicons name="information-circle-outline" size={12} color={colors.inkFaint} />{' '}
          We'll include your device info ({deviceSummary()}) to help us investigate.
        </Text>

        <PrimaryButton
          title="Send feedback"
          onPress={onSubmit}
          loading={submit.isPending || uploading}
          style={{ marginTop: spacing.lg }}
        />

        {/* Past submissions with status */}
        {(mine.data?.length ?? 0) > 0 ? (
          <View style={styles.history}>
            <Text style={styles.historyTitle}>Your submissions</Text>
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

const styles = StyleSheet.create({
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
