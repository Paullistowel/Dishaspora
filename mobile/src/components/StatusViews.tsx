import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNetwork } from '../context/NetworkContext';
import { colors, spacing, type } from '../theme';
import PrimaryButton from './PrimaryButton';

export function LoadingView() {
  return (
    <View style={styles.center} accessibilityRole="progressbar" accessibilityLabel="Loading">
      <ActivityIndicator size="large" color={colors.brandDark} />
    </View>
  );
}

/**
 * Error state for a failed load. Network-aware: when the device is offline it
 * shows an offline-specific icon + message instead of a generic error, so users
 * can tell "no internet" apart from "the server had a problem". Retrying once
 * back online just works (React Query resumes paused queries too).
 */
export function ErrorView({
  message = 'Something went wrong.',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  const { isOffline } = useNetwork();
  const icon = isOffline ? 'cloud-offline-outline' : 'alert-circle-outline';
  const text = isOffline
    ? "You're offline. Check your connection and try again."
    : message;

  return (
    <View style={styles.center} accessibilityRole="alert">
      <Ionicons name={icon} size={40} color={colors.inkFaint} style={{ marginBottom: spacing.md }} />
      <Text style={styles.errorText}>{text}</Text>
      {onRetry ? (
        <PrimaryButton
          title="Try again"
          onPress={onRetry}
          style={{ marginTop: spacing.lg, paddingHorizontal: 40 }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxxl,
    backgroundColor: colors.background,
  },
  errorText: {
    color: colors.inkSoft,
    fontSize: type.size.md,
    textAlign: 'center',
    lineHeight: type.line.md,
  },
});
