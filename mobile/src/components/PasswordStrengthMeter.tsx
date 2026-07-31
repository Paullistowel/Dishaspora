import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, type } from '@/theme';
import { evaluatePassword } from '@/validation';

const BAR_COLORS = [colors.surfaceAlt, colors.danger, colors.accent, colors.star, colors.success];

/**
 * Four-segment password strength meter with a label and an optional hint of
 * what's still missing. Purely presentational — derives everything from the
 * password string via `evaluatePassword`.
 */
export default function PasswordStrengthMeter({
  password,
  showHint = true,
}: {
  password: string;
  showHint?: boolean;
}) {
  const { score, label, missing } = useMemo(() => evaluatePassword(password), [password]);

  if (!password) return null;

  return (
    <View style={styles.wrap} accessible accessibilityLabel={`Password strength: ${label}`}>
      <View style={styles.bars}>
        {[1, 2, 3, 4].map((seg) => (
          <View
            key={seg}
            style={[
              styles.bar,
              { backgroundColor: seg <= score ? BAR_COLORS[score] : colors.surfaceAlt },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.label, { color: BAR_COLORS[score] }]}>{label}</Text>
      {showHint && missing.length > 0 ? (
        <Text style={styles.hint}>Add {missing.join(', ')}.</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.xs, gap: spacing.xs },
  bars: { flexDirection: 'row', gap: spacing.xs },
  bar: { flex: 1, height: 5, borderRadius: radius.pill },
  label: { fontSize: type.size.xs, fontWeight: type.weight.bold, marginTop: 2 },
  hint: { fontSize: type.size.xs, color: colors.inkSoft, lineHeight: type.line.xs },
});
