import React from 'react';
import { ActivityIndicator, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors } from '../theme';
import PressableScale from './PressableScale';

interface Props {
  title: string;
  onPress?: () => void;
  variant?: 'orange' | 'black' | 'outline' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  small?: boolean;
  haptic?: boolean;
}

/** Full-width rounded-full CTA pill with spring press-scale. Orange by default; black for Order/Checkout. */
export default function PrimaryButton({
  title,
  onPress,
  variant = 'orange',
  disabled,
  loading,
  style,
  small,
  haptic = true,
}: Props) {
  const bg =
    variant === 'orange'
      ? colors.accent
      : variant === 'black'
        ? colors.ink
        : variant === 'danger'
          ? colors.danger
          : 'transparent';
  const fg = variant === 'outline' ? colors.ink : '#FFFFFF';
  return (
    <PressableScale
      disabled={disabled || loading}
      onPress={onPress}
      haptic={haptic}
      scaleTo={0.96}
      style={[(disabled || loading) && { opacity: 0.5 }, style]}
    >
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
        style={[
          styles.base,
          small && styles.small,
          { backgroundColor: bg, color: fg },
          variant === 'outline' && styles.outline,
          styles.text,
          small && styles.textSmall,
        ]}
      >
        {loading ? ' ' : title}
      </Text>
      {loading ? (
        <ActivityIndicator color={fg} style={StyleSheet.absoluteFill} />
      ) : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 999,
    paddingVertical: 16,
    paddingHorizontal: 24,
    textAlign: 'center',
    overflow: 'hidden',
  },
  small: { paddingVertical: 11, paddingHorizontal: 10 },
  outline: { borderWidth: 1.5, borderColor: colors.ink },
  text: { fontSize: 16, fontWeight: '600' },
  textSmall: { fontSize: 13 },
});
