import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { shadowStrong, type ThemeColors } from '../theme';

const ICONS: Record<string, [keyof typeof Ionicons.glyphMap, keyof typeof Ionicons.glyphMap]> = {
  index: ['home-outline', 'home'],
  search: ['search-outline', 'search'],
  market: ['storefront-outline', 'storefront'],
  profile: ['person-outline', 'person'],
};

/**
 * Floating pill bottom nav (ref pattern #1): white rounded-full bar floating above
 * the bottom, 5 slots, center = raised cyan circular "D" badge with orange dot
 * that opens the Ask Dishaspora assistant.
 */
export default function PillTabBar({ state, navigation }: BottomTabBarProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const routes = state.routes.filter((r) => ICONS[r.name]);
  const left = routes.slice(0, 2);
  const right = routes.slice(2);

  const renderTab = (route: (typeof routes)[number]) => {
    const index = state.routes.findIndex((r) => r.key === route.key);
    const focused = state.index === index;
    const [inactive, active] = ICONS[route.name];
    return (
      <TouchableOpacity
        key={route.key}
        style={styles.tab}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        }}
        activeOpacity={0.7}
      >
        <Ionicons
          name={focused ? active : inactive}
          size={22}
          color={focused ? colors.accent : colors.inkFaint}
        />
        {focused ? <View style={styles.activeDot} /> : null}
      </TouchableOpacity>
    );
  };

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]}
    >
      <View style={styles.bar}>
        {left.map(renderTab)}
        <TouchableOpacity
          style={styles.centerSlot}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
            router.push('/assistant');
          }}
          activeOpacity={0.85}
        >
          <View style={styles.centerBadge}>
            <Text style={styles.centerD}>D</Text>
            <View style={styles.notifDot} />
          </View>
        </TouchableOpacity>
        {right.map(renderTab)}
      </View>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrap: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: 'center',
    },
    bar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 999,
      paddingHorizontal: 18,
      height: 62,
      marginHorizontal: 20,
      alignSelf: 'stretch',
      ...shadowStrong,
    },
    tab: { flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%' },
    activeDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.accent,
      marginTop: 3,
    },
    centerSlot: { flex: 1, alignItems: 'center' },
    centerBadge: {
      width: 54,
      height: 54,
      borderRadius: 27,
      backgroundColor: colors.brand,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: -22,
      borderWidth: 4,
      borderColor: colors.card,
      ...shadowStrong,
    },
    centerD: { color: '#0A2A2E', fontSize: 22, fontWeight: '800' },
    notifDot: {
      position: 'absolute',
      top: 2,
      right: 2,
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.accent,
      borderWidth: 2,
      borderColor: colors.card,
    },
  });
