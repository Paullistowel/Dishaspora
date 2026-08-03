import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { type ThemeColors } from '../theme';
import { useTheme } from '../context/ThemeContext';

const SPRING = { damping: 18, stiffness: 220 };

/**
 * Segmented pill tabs (ref pattern #3): gray track, orange pill slides to the
 * active segment (reanimated spring), white active text.
 */
export default function SegmentChips({
  segments,
  value,
  onChange,
  style,
}: {
  segments: string[];
  value: string;
  onChange: (v: string) => void;
  style?: ViewStyle;
}) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const [trackWidth, setTrackWidth] = useState(0);
  const index = Math.max(segments.indexOf(value), 0);
  const x = useSharedValue(0);
  const segmentWidth = trackWidth > 0 ? (trackWidth - 8) / segments.length : 0;

  useEffect(() => {
    x.value = withSpring(index * segmentWidth, SPRING);
  }, [index, segmentWidth, x]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
  }));

  return (
    <View
      style={[styles.track, style]}
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
    >
      {segmentWidth > 0 ? (
        <Animated.View style={[styles.pill, { width: segmentWidth }, pillStyle]} />
      ) : null}
      {segments.map((s) => {
        const active = s === value;
        return (
          <TouchableOpacity
            key={s}
            style={styles.segment}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              onChange(s);
            }}
            activeOpacity={0.8}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{s}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 999,
    padding: 4,
  },
  pill: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: 999,
    backgroundColor: colors.accent,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
  },
  label: { fontSize: 13.5, fontWeight: '500', color: colors.inkSoft },
  labelActive: { color: '#FFFFFF', fontWeight: '600' },
});
