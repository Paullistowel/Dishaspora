import React from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNetwork } from '@/context/NetworkContext';
import { colors, spacing, type } from '@/theme';

/**
 * Global connectivity banner. Slides in under the status bar whenever the device
 * loses internet reachability and disappears when it returns. Mounted once at the
 * root so every screen inherits it. Announced to screen readers via live region.
 */
export default function OfflineBanner() {
  const { isOffline } = useNetwork();
  const insets = useSafeAreaInsets();

  if (!isOffline) return null;

  return (
    <Animated.View
      entering={FadeInUp.duration(220)}
      exiting={FadeOutUp.duration(180)}
      style={[styles.wrap, { paddingTop: insets.top + spacing.sm }]}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      accessible
      accessibilityLabel="You are offline. Some features may be unavailable."
    >
      <Ionicons name="cloud-offline-outline" size={16} color="#FFFFFF" />
      <Text style={styles.text}>No internet connection</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.sm,
    backgroundColor: colors.ink,
  },
  text: {
    color: '#FFFFFF',
    fontSize: type.size.sm,
    fontWeight: type.weight.semibold,
  },
});
