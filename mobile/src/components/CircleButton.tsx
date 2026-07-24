import React from 'react';
import { StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadowStrong } from '../theme';

/** Floating white circular button with shadow (back arrow / heart on heroes). */
export default function CircleButton({
  icon,
  onPress,
  color = colors.ink,
  bg = '#FFFFFF',
  size = 42,
  style,
  accessibilityLabel,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  color?: string;
  bg?: string;
  size?: number;
  style?: ViewStyle;
  accessibilityLabel?: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? icon.replace(/-outline$/, '').replace(/-/g, ' ')}
      style={[
        styles.btn,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg },
        style,
      ]}
    >
      <Ionicons name={icon} size={size * 0.45} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
    ...shadowStrong,
  },
});
