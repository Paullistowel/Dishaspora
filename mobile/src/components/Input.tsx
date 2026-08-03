import React from 'react';
import { StyleSheet, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { type ThemeColors } from '../theme';
import { useTheme } from '../context/ThemeContext';

/** Rounded surface input with a leading icon (auth/forms). */
export default function Input({
  icon,
  style,
  multiline,
  ...props
}: TextInputProps & { icon?: keyof typeof Ionicons.glyphMap; style?: ViewStyle }) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={[styles.wrap, multiline ? styles.multiline : styles.single, style]}>
      {icon ? (
        <Ionicons name={icon} size={18} color={colors.inkFaint} style={multiline && { marginTop: 2 }} />
      ) : null}
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        placeholderTextColor={colors.inkFaint}
        multiline={multiline}
        {...props}
      />
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    paddingHorizontal: 18,
  },
  single: { borderRadius: 999, height: 52 },
  multiline: { borderRadius: 20, paddingVertical: 14, alignItems: 'flex-start' },
  input: { flex: 1, fontSize: 14.5, color: colors.ink, paddingVertical: 0 },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },
});
