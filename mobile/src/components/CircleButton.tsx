import React from 'react';
import { StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { shadowStrong, type ThemeColors } from '../theme';
import { useTheme } from '../context/ThemeContext';

/** Floating white circular button with shadow (back arrow / heart on heroes). */
export default function CircleButton({
  icon,
  onPress,
  color,
  bg,
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
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const iconColor = color ?? colors.ink;
  const background = bg ?? colors.card;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? icon.replace(/-outline$/, '').replace(/-/g, ' ')}
      style={[
        styles.btn,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: background },
        style,
      ]}
    >
      <Ionicons name={icon} size={size * 0.45} color={iconColor} />
    </TouchableOpacity>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
    ...shadowStrong,
  },
});
