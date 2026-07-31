import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors, spacing, type } from '@/theme';

/**
 * Inline validation message shown beneath a form field. Renders nothing when
 * there's no error, so callers can drop it in unconditionally. Announced to
 * screen readers as an alert.
 */
export default function FieldError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <Text style={styles.text} accessibilityRole="alert" accessibilityLiveRegion="polite">
      {message}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    color: colors.danger,
    fontSize: type.size.xs,
    fontWeight: type.weight.medium,
    marginTop: -spacing.sm,
    marginLeft: spacing.lg,
    lineHeight: type.line.xs,
  },
});
