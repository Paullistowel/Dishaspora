import React, { useRef } from 'react';
import {
  AccessibilityRole,
  AccessibilityState,
  GestureResponderEvent,
  Pressable,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const SPRING = { damping: 16, stiffness: 260, mass: 0.6 };

/**
 * Spring press-scale (0.96) wrapper for every touchable. With `tilt`, the card
 * additionally tilts toward the touch point (perspective rotateX/rotateY, max ~6°)
 * for the "3D everything" feel. All animation runs on the UI thread.
 */
export default function PressableScale({
  children,
  onPress,
  onLongPress,
  style,
  tilt = false,
  scaleTo = 0.96,
  haptic = false,
  disabled,
  accessibilityRole = 'button',
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
  tilt?: boolean;
  scaleTo?: number;
  haptic?: boolean;
  disabled?: boolean;
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityState?: AccessibilityState;
}) {
  const scale = useSharedValue(1);
  const rotateX = useSharedValue(0);
  const rotateY = useSharedValue(0);
  const size = useRef({ w: 1, h: 1 });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 800 },
      { scale: scale.value },
      { rotateX: `${rotateX.value}deg` },
      { rotateY: `${rotateY.value}deg` },
    ],
  }));

  const pressIn = (e: GestureResponderEvent) => {
    scale.value = withSpring(scaleTo, SPRING);
    if (tilt) {
      const { locationX, locationY } = e.nativeEvent;
      const { w, h } = size.current;
      const nx = Math.min(Math.max(locationX / Math.max(w, 1), 0), 1) - 0.5;
      const ny = Math.min(Math.max(locationY / Math.max(h, 1), 0), 1) - 0.5;
      rotateY.value = withSpring(nx * 12, SPRING); // max ~6° either way
      rotateX.value = withSpring(-ny * 12, SPRING);
    }
  };

  const pressOut = () => {
    scale.value = withSpring(1, SPRING);
    rotateX.value = withSpring(0, SPRING);
    rotateY.value = withSpring(0, SPRING);
  };

  return (
    <Pressable
      disabled={disabled}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled, ...accessibilityState }}
      onPressIn={pressIn}
      onPressOut={pressOut}
      onLongPress={onLongPress}
      onPress={() => {
        if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress?.();
      }}
      onLayout={(e) => {
        size.current = {
          w: e.nativeEvent.layout.width,
          h: e.nativeEvent.layout.height,
        };
      }}
      style={style}
    >
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </Pressable>
  );
}

/** Convenience static wrapper (no press) with entrance-friendly Animated.View. */
export const AnimatedView = Animated.View as typeof Animated.View;
export { View };
