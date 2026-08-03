import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { type ThemeColors } from '../theme';
import { useTheme } from '../context/ThemeContext';

export interface MetaItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}

/** Detail meta row: three icon + small text items, separated. */
export default function MetaRow({ items, style }: { items: MetaItem[]; style?: ViewStyle }) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={[styles.row, style]}>
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 ? <View style={styles.dot} /> : null}
          <View style={styles.item}>
            <Ionicons name={item.icon} size={15} color={colors.ink} />
            <Text style={styles.label}>{item.label}</Text>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.surfaceAlt,
  },
  item: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  label: { fontSize: 12.5, color: colors.ink, fontWeight: '500' },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.inkFaint,
  },
});
