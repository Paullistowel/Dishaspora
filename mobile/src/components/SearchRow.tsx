import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCart } from '../context/CartContext';
import { shadow, type ThemeColors } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';

/**
 * Rounded-full surface search input + trailing circular orange cart button with badge.
 * Pass `onPressInput` to use it as a fake input (navigates instead of typing).
 */
export default function SearchRow({
  value,
  onChangeText,
  onSubmit,
  onPressInput,
  placeholder,
  autoFocus,
  hideCart,
  style,
}: {
  value?: string;
  onChangeText?: (t: string) => void;
  onSubmit?: () => void;
  onPressInput?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  hideCart?: boolean;
  style?: ViewStyle;
}) {
  const router = useRouter();
  const { count } = useCart();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const placeholderText = placeholder ?? t('common.searchDishaspora');

  return (
    <View style={[styles.row, style]}>
      {onPressInput ? (
        <Pressable style={styles.input} onPress={onPressInput}>
          <Ionicons name="search" size={18} color={colors.inkFaint} />
          <Text style={styles.placeholder}>{placeholderText}</Text>
        </Pressable>
      ) : (
        <View style={styles.input}>
          <Ionicons name="search" size={18} color={colors.inkFaint} />
          <TextInput
            style={styles.textInput}
            value={value}
            onChangeText={onChangeText}
            onSubmitEditing={onSubmit}
            placeholder={placeholderText}
            placeholderTextColor={colors.inkFaint}
            returnKeyType="search"
            autoFocus={autoFocus}
          />
        </View>
      )}
      {!hideCart ? (
        <TouchableOpacity
          style={styles.cartBtn}
          onPress={() => router.push('/cart')}
          activeOpacity={0.85}
        >
          <Ionicons name="cart-outline" size={20} color="#FFFFFF" />
          {count > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>
            </View>
          ) : null}
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 16,
    height: 48,
  },
  placeholder: { color: colors.inkFaint, fontSize: 14 },
  textInput: { flex: 1, fontSize: 14, color: colors.ink, paddingVertical: 0 },
  cartBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: { color: '#FFFFFF', fontSize: 9.5, fontWeight: '700' },
});
