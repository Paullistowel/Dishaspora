import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { formatMoney } from '../money';
import { type ThemeColors } from '../theme';
import { useTheme } from '../context/ThemeContext';
import type { Currency } from '../types';

/** Price in accent orange + optional strikethrough compare-at price. */
export default function Price({
  amountMinor,
  currency,
  compareAtMinor,
  size = 15,
  style,
}: {
  amountMinor: number;
  currency: Currency;
  compareAtMinor?: number | null;
  size?: number;
  style?: ViewStyle;
}) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={[styles.row, style]}>
      <Text style={[styles.price, { fontSize: size }]}>
        {formatMoney(amountMinor, currency)}
      </Text>
      {compareAtMinor ? (
        <Text style={[styles.compare, { fontSize: size - 3 }]}>
          {formatMoney(compareAtMinor, currency)}
        </Text>
      ) : null}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  price: { color: colors.accentDark, fontWeight: '700' },
  compare: { color: colors.inkFaint, textDecorationLine: 'line-through' },
});
