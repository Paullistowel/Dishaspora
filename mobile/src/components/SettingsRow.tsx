import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PressableScale from './PressableScale';
import { colors, radius, spacing, type } from '../theme';

/**
 * A single tappable settings/menu row: leading icon tile, label, optional trailing
 * value or unread badge, and a chevron. Used by the Settings hub, Help & Support
 * and About screens so those menus stay visually consistent.
 */
export default function SettingsRow({
  icon,
  label,
  value,
  badge,
  danger,
  last,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  badge?: number;
  danger?: boolean;
  /** Suppress the bottom divider on the last row of a card. */
  last?: boolean;
  onPress?: () => void;
}) {
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.99}
      accessibilityRole="button"
      accessibilityLabel={
        badge ? `${label}, ${badge} unread` : value ? `${label}, ${value}` : label
      }
    >
      <View style={[styles.row, !last && styles.divider]}>
        <View style={[styles.icon, danger && { backgroundColor: '#FDECEC' }]}>
          <Ionicons name={icon} size={17} color={danger ? colors.danger : colors.brandDark} />
        </View>
        <Text style={[styles.label, danger && { color: colors.danger }]}>{label}</Text>
        {value ? <Text style={styles.value}>{value}</Text> : null}
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
          </View>
        ) : null}
        <Ionicons name="chevron-forward" size={16} color={colors.inkFaint} />
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 13,
  },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.surfaceAlt },
  icon: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { flex: 1, fontSize: type.size.md, fontWeight: type.weight.medium, color: colors.ink },
  value: { fontSize: type.size.sm, color: colors.inkSoft },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
});
