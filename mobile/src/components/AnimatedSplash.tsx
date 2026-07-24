import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Directions, Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { colors } from '@/theme';

const LOGO_SRC = require('../../assets/images/dishaspora-logo.png');

const CREAM = '#FDF5EA';
const TEAL = '#2BB8C9';
const TEAL_DEEP = '#1E93A6';
const TEAL_PALE = '#E4F8FB';
const AMBER = '#F0A26A';

/** Total runtime including the exit fade. Tune the whole sequence from here. */
const TOTAL = 3200;
const EXIT_AT = 2600;
const EXIT_MS = TOTAL - EXIT_AT;

/** How long "hold to enter" takes. The ring fills over exactly this long. */
const HOLD_MS = 900;

/** Reduced-motion runtime: assembled logo, brief hold, gone. */
const REDUCED_TOTAL = 1400;

/** The line that types itself out, one character at a time. */
const TYPED = 'TASTE OF HOME';
const TYPE_START = 900;
const TYPE_PER_CHAR = 70;

const GENTLE = Easing.bezier(0.16, 1, 0.3, 1);
const STANDARD = Easing.bezier(0.4, 0, 0.2, 1);
const SOFT = Easing.inOut(Easing.quad);

const RING_R = 47;
const RING_C = 2 * Math.PI * RING_R;
const ACircle = Animated.createAnimatedComponent(Circle);

/** Drifting motes that fill the whole screen, not just the logo box. */
const MOTE_COUNT = 20;

type Props = { onFinish: () => void };
type Burst = { id: number; x: number; y: number };

type TiltState = {
  tiltX: SharedValue<number>;
  tiltY: SharedValue<number>;
  pinch: SharedValue<number>;
  press: SharedValue<number>;
};

function useParallax(t: TiltState, depth: number) {
  return useAnimatedStyle(() => ({
    transform: [
      { perspective: 900 },
      { translateX: t.tiltX.value * 16 * depth },
      { translateY: t.tiltY.value * 13 * depth },
      { rotateY: `${t.tiltX.value * 11 * depth}deg` },
      { rotateX: `${-t.tiltY.value * 9 * depth}deg` },
    ],
  }));
}

/**
 * Dishaspora's animated splash.
 *
 * A seven-second, full-bleed title sequence. A pale teal wash blows out from the
 * centre to flood the whole screen, the logo lands with a squash-and-stretch pop
 * (overshoot, then settle — the bouncy physics Duolingo popularised), a shockwave
 * ring races past the edges, and the tagline types itself out under a blinking
 * cursor. Warm motes drift across the entire viewport throughout, so no part of
 * the screen sits dead.
 *
 * Interaction:
 *   • drag       — parallax the whole scene in 3D at three depths
 *   • tap        — burst of sparks from the touch point
 *   • pinch      — scale the mark, springing back on release
 *   • double-tap — replay from the top
 *   • hold       — a ring fills; complete it to enter
 *   • swipe up   — enter immediately
 *
 * Honours the OS "reduce motion" setting by cutting to the assembled logo.
 */
export default function AnimatedSplash({ onFinish }: Props) {
  const { width, height } = useWindowDimensions();
  const done = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [reduced, setReduced] = useState<boolean | null>(null);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [typed, setTyped] = useState('');
  const nextId = useRef(0);
  const [runKey, setRunKey] = useState(0);

  const M = Math.min(width * 0.78, 340);
  const RING_BOX = M * 1.18;
  /** Big enough that the wash circle covers the corners of any screen. */
  const WASH = Math.hypot(width, height) * 1.15;

  // ── Shared values ──────────────────────────────────────────────────────────
  const cover = useSharedValue(1);
  const wash = useSharedValue(0);
  const shock = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const sx = useSharedValue(0.3);
  const sy = useSharedValue(0.3);
  const idle = useSharedValue(0);
  const cursor = useSharedValue(0);
  const tagOpacity = useSharedValue(0);
  const hintOpacity = useSharedValue(0);
  const moteFade = useSharedValue(0);

  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);
  const press = useSharedValue(0);
  const pinchScale = useSharedValue(1);
  const hold = useSharedValue(0);

  /** Fixed mote field, generated once so it never reshuffles on re-render. */
  const motes = useMemo(
    () =>
      Array.from({ length: MOTE_COUNT }, (_, i) => ({
        id: i,
        x: Math.random() * width,
        y: Math.random() * height,
        size: 4 + Math.random() * 9,
        delay: Math.random() * 2600,
        duration: 5200 + Math.random() * 4200,
        drift: (Math.random() - 0.5) * 70,
        amber: i % 3 === 0,
        depth: 0.4 + Math.random() * 1.6,
      })),
    [width, height]
  );

  // ── Exit ───────────────────────────────────────────────────────────────────
  const finish = useCallback(
    (haptic: boolean) => {
      if (done.current) return;
      done.current = true;
      if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      cancelAnimation(idle);
      cancelAnimation(cursor);
      cancelAnimation(hintOpacity);
      cover.value = withTiming(0, { duration: EXIT_MS, easing: STANDARD });
      timers.current.push(setTimeout(onFinish, EXIT_MS));
    },
    [onFinish]
  );

  const skip = useCallback(() => finish(true), [finish]);

  const replay = useCallback(() => {
    if (done.current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    timers.current.forEach(clearTimeout);
    timers.current = [];
    cancelAnimation(idle);
    cancelAnimation(cursor);
    cancelAnimation(hintOpacity);
    setTyped('');
    wash.value = 0;
    shock.value = 0;
    logoOpacity.value = 0;
    sx.value = 0.3;
    sy.value = 0.3;
    idle.value = 0;
    tagOpacity.value = 0;
    hintOpacity.value = 0;
    moteFade.value = 0;
    setRunKey((k) => k + 1);
  }, []);

  const spawnBurst = useCallback((x: number, y: number) => {
    const id = nextId.current++;
    setBursts((b) => [...b.slice(-4), { id, x, y }]);
    Haptics.selectionAsync().catch(() => {});
    setTimeout(() => setBursts((b) => b.filter((p) => p.id !== id)), 900);
  }, []);

  // ── Reduced-motion probe ───────────────────────────────────────────────────
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => alive && setReduced(v))
      .catch(() => alive && setReduced(false));
    return () => {
      alive = false;
    };
  }, []);

  // ── Choreography ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (reduced === null) return;

    const at = (ms: number, fn: () => void) => {
      timers.current.push(setTimeout(fn, ms));
    };

    if (reduced) {
      wash.value = 1;
      logoOpacity.value = withTiming(1, { duration: 300 });
      sx.value = 1;
      sy.value = 1;
      moteFade.value = withTiming(1, { duration: 300 });
      setTyped(TYPED);
      tagOpacity.value = withTiming(1, { duration: 300 });
      at(REDUCED_TOTAL - EXIT_MS, () => finish(false));
      return;
    }

    // 1. Pale teal wash blows out from the centre and floods the screen.
    wash.value = withTiming(1, { duration: 1000, easing: GENTLE });

    // 2. Motes fade up across the whole viewport.
    moteFade.value = withDelay(300, withTiming(1, { duration: 1200, easing: STANDARD }));

    // 3. The logo lands: overshoot, squash, then settle. Scale X and Y are driven
    //    against each other so it deforms on impact rather than just growing.
    logoOpacity.value = withDelay(700, withTiming(1, { duration: 260, easing: STANDARD }));
    sx.value = withDelay(
      700,
      withSequence(
        withTiming(1.2, { duration: 300, easing: Easing.out(Easing.cubic) }),
        withSpring(1, { damping: 6.5, stiffness: 170, mass: 0.8 })
      )
    );
    sy.value = withDelay(
      700,
      withSequence(
        withTiming(0.84, { duration: 300, easing: Easing.out(Easing.cubic) }),
        withSpring(1, { damping: 6.5, stiffness: 170, mass: 0.8 })
      )
    );

    // 4. Shockwave races out past the screen edges on impact.
    shock.value = withDelay(940, withTiming(1, { duration: 1100, easing: Easing.out(Easing.cubic) }));

    // 5. Gentle idle bob so the long hold never looks frozen.
    idle.value = withDelay(
      1900,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1400, easing: SOFT }),
          withTiming(0, { duration: 1400, easing: SOFT })
        ),
        -1,
        true
      )
    );

    // 6. Tagline types itself out, one character at a time.
    tagOpacity.value = withDelay(TYPE_START - 200, withTiming(1, { duration: 400 }));
    cursor.value = withDelay(
      TYPE_START - 200,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 60 }),
          withDelay(440, withTiming(0, { duration: 60 })),
          withDelay(440, withTiming(1, { duration: 0 }))
        ),
        -1,
        false
      )
    );
    for (let i = 1; i <= TYPED.length; i++) {
      at(TYPE_START + i * TYPE_PER_CHAR, () => setTyped(TYPED.slice(0, i)));
    }

    // 7. Exit affordance, then the automatic exit.
    hintOpacity.value = withDelay(
      TYPE_START + TYPED.length * TYPE_PER_CHAR + 400,
      withRepeat(
        withSequence(
          withTiming(0.75, { duration: 900, easing: SOFT }),
          withTiming(0.3, { duration: 900, easing: SOFT })
        ),
        -1,
        true
      )
    );
    at(EXIT_AT, () => finish(false));
  }, [reduced, finish, runKey]);

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    },
    []
  );

  // ── Gestures ───────────────────────────────────────────────────────────────
  const pan = Gesture.Pan()
    .onBegin(() => {
      press.value = withTiming(1, { duration: 200 });
    })
    .onUpdate((e) => {
      tiltX.value = Math.max(-1, Math.min(1, e.translationX / 150));
      tiltY.value = Math.max(-1, Math.min(1, e.translationY / 150));
    })
    .onFinalize(() => {
      press.value = withTiming(0, { duration: 280 });
      tiltX.value = withTiming(0, { duration: 800, easing: GENTLE });
      tiltY.value = withTiming(0, { duration: 800, easing: GENTLE });
    });

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      pinchScale.value = Math.max(0.75, Math.min(1.5, e.scale));
    })
    .onFinalize(() => {
      pinchScale.value = withSpring(1, { damping: 11, stiffness: 120, mass: 0.9 });
    });

  const tap = Gesture.Tap()
    .maxDuration(250)
    .onEnd((e, success) => {
      if (success) runOnJS(spawnBurst)(e.x, e.y);
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(280)
    .onEnd((_e, success) => {
      if (success) runOnJS(replay)();
    });

  const holdGesture = Gesture.LongPress()
    .minDuration(HOLD_MS)
    .maxDistance(40)
    .onBegin(() => {
      hold.value = withTiming(1, { duration: HOLD_MS, easing: Easing.linear });
    })
    .onStart(() => runOnJS(skip)())
    .onFinalize(() => {
      hold.value = withTiming(0, { duration: 260, easing: STANDARD });
    });

  const swipeUp = Gesture.Fling()
    .direction(Directions.UP)
    .onStart(() => runOnJS(skip)());

  const gesture = Gesture.Simultaneous(
    pan,
    pinch,
    holdGesture,
    Gesture.Exclusive(swipeUp, doubleTap, tap)
  );

  // ── Styles ─────────────────────────────────────────────────────────────────
  const tilt: TiltState = { tiltX, tiltY, pinch: pinchScale, press };
  const sceneParallax = useParallax(tilt, 1);
  const textParallax = useParallax(tilt, 0.5);

  const coverStyle = useAnimatedStyle(() => ({ opacity: cover.value }));

  const washStyle = useAnimatedStyle(() => ({
    opacity: interpolate(wash.value, [0, 0.3, 1], [0, 0.8, 1]),
    transform: [{ scale: 0.05 + wash.value * 0.95 }],
  }));

  const shockStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shock.value, [0, 0.15, 1], [0, 0.4, 0]),
    transform: [{ scale: 0.1 + shock.value * 1.5 }],
  }));

  /** Squash-and-stretch pop, plus the idle bob and pinch. */
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [
      { translateY: interpolate(idle.value, [0, 1], [0, -10]) },
      { scaleX: sx.value * pinchScale.value * (1 - press.value * 0.02) },
      { scaleY: sy.value * pinchScale.value * (1 - press.value * 0.02) },
    ],
  }));

  const moteFadeStyle = useAnimatedStyle(() => ({ opacity: moteFade.value }));
  const tagStyle = useAnimatedStyle(() => ({ opacity: tagOpacity.value }));
  const cursorStyle = useAnimatedStyle(() => ({ opacity: cursor.value }));
  const hintStyle = useAnimatedStyle(() => ({ opacity: hintOpacity.value }));

  const ringWrapStyle = useAnimatedStyle(() => ({
    opacity: interpolate(hold.value, [0, 0.06, 1], [0, 1, 1]),
  }));
  const ringProps = useAnimatedProps(() => ({
    strokeDashoffset: RING_C * (1 - hold.value),
  }));

  if (reduced === null) {
    return <View style={[StyleSheet.absoluteFill, styles.cover]} />;
  }

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.cover, coverStyle]}
        accessibilityRole="button"
        accessibilityLabel="Dishaspora. Hold or swipe up to enter."
        accessibilityHint="Double tap to enter the app"
      >
        {/* ── Full-bleed wash: floods the entire screen from the centre ── */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.washWrap,
            {
              width: WASH,
              height: WASH,
              left: (width - WASH) / 2,
              top: (height - WASH) / 2,
              borderRadius: WASH / 2,
            },
            washStyle,
          ]}
        >
          <LinearGradient
            colors={[TEAL_PALE, '#F2FBFC', CREAM]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        {/* Shockwave from the logo's impact, racing past the screen edges */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.shock,
            {
              width: WASH,
              height: WASH,
              borderRadius: WASH / 2,
              left: (width - WASH) / 2,
              top: (height - WASH) / 2,
            },
            shockStyle,
          ]}
        />

        {/* ── Motes drifting across the whole viewport ── */}
        <Animated.View style={[StyleSheet.absoluteFill, moteFadeStyle]} pointerEvents="none">
          {motes.map((m) => (
            <Mote key={`${runKey}-${m.id}`} {...m} tiltX={tiltX} tiltY={tiltY} height={height} />
          ))}
        </Animated.View>

        {/* ── Centre stage ── */}
        <Animated.View style={[styles.stack, sceneParallax]} pointerEvents="none">
          <Animated.View style={[{ width: M, height: M }, logoStyle]}>
            <Image
              source={LOGO_SRC}
              style={StyleSheet.absoluteFill}
              contentFit="contain"
              transition={0}
              accessible={false}
            />
          </Animated.View>

          {/* Hold-to-enter ring, orbiting the mark */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.ring,
              {
                width: RING_BOX,
                height: RING_BOX,
                marginTop: -(M + RING_BOX) / 2,
                marginBottom: (M - RING_BOX) / 2,
              },
              ringWrapStyle,
            ]}
          >
            <Svg width="100%" height="100%" viewBox="0 0 100 100">
              <Circle cx={50} cy={50} r={RING_R} stroke={TEAL} strokeOpacity={0.16} strokeWidth={2} fill="none" />
              <ACircle
                cx={50}
                cy={50}
                r={RING_R}
                stroke={TEAL}
                strokeWidth={2.6}
                strokeLinecap="round"
                fill="none"
                strokeDasharray={RING_C}
                transform="rotate(-90 50 50)"
                animatedProps={ringProps}
              />
            </Svg>
          </Animated.View>

          {/* Typed tagline with a blinking cursor */}
          <Animated.View style={[styles.typeRow, textParallax, tagStyle]}>
            <Animated.Text style={styles.tagline}>{typed}</Animated.Text>
            <Animated.View style={[styles.cursor, cursorStyle]} />
          </Animated.View>
        </Animated.View>

        {bursts.map((b) => (
          <Burst key={b.id} x={b.x} y={b.y} />
        ))}

        <Animated.Text style={[styles.hint, hintStyle]}>Hold or swipe up to enter</Animated.Text>
      </Animated.View>
    </GestureDetector>
  );
}

/** A single drifting mote. Rises, sways, and loops forever. */
function Mote({
  x,
  y,
  size,
  delay,
  duration,
  drift,
  amber,
  depth,
  tiltX,
  tiltY,
  height,
}: {
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  drift: number;
  amber: boolean;
  depth: number;
  tiltX: SharedValue<number>;
  tiltY: SharedValue<number>;
  height: number;
}) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1, false)
    );
    return () => cancelAnimation(p);
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0, 0.15, 0.8, 1], [0, 0.55, 0.4, 0]),
    transform: [
      { translateY: -p.value * height * 0.55 + tiltY.value * 18 * depth },
      { translateX: Math.sin(p.value * Math.PI * 2) * drift + tiltX.value * 22 * depth },
      { scale: 0.6 + Math.sin(p.value * Math.PI) * 0.5 },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: x,
          top: y,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: amber ? AMBER : TEAL,
        },
        style,
      ]}
    />
  );
}

/** Tap burst: a ring plus a scatter of sparks. */
function Burst({ x, y }: { x: number; y: number }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withTiming(1, { duration: 850, easing: Easing.out(Easing.cubic) });
  }, []);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: (1 - p.value) * 0.75,
    transform: [{ scale: 0.2 + p.value * 2.8 }],
  }));

  const sparks = useMemo(
    () => Array.from({ length: 8 }, (_, i) => ((Math.PI * 2) / 8) * i),
    []
  );

  return (
    <View pointerEvents="none" style={[styles.burstWrap, { left: x, top: y }]}>
      <Animated.View style={[styles.burstRing, ringStyle]} />
      {sparks.map((angle, i) => (
        <BurstSpark key={i} angle={angle} p={p} />
      ))}
    </View>
  );
}

function BurstSpark({ angle, p }: { angle: number; p: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const d = p.value * 62;
    return {
      opacity: (1 - p.value) * 0.9,
      transform: [
        { translateX: Math.cos(angle) * d },
        { translateY: Math.sin(angle) * d },
        { scale: 1 - p.value * 0.7 },
      ],
    };
  });
  return <Animated.View style={[styles.burstSpark, style]} />;
}

const styles = StyleSheet.create({
  cover: { backgroundColor: CREAM, zIndex: 100 },
  washWrap: { position: 'absolute', overflow: 'hidden' },
  shock: { position: 'absolute', borderWidth: 2, borderColor: TEAL },
  stack: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  ring: { alignItems: 'center', justifyContent: 'center' },
  typeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, height: 22 },
  tagline: {
    fontSize: 13,
    letterSpacing: 5,
    fontWeight: '700',
    color: TEAL_DEEP,
  },
  cursor: { width: 2, height: 15, backgroundColor: AMBER, marginLeft: 3 },
  hint: {
    position: 'absolute',
    bottom: 58,
    alignSelf: 'center',
    fontSize: 12.5,
    letterSpacing: 1.1,
    color: colors.inkFaint,
  },
  burstWrap: { position: 'absolute', width: 0, height: 0, alignItems: 'center', justifyContent: 'center' },
  burstRing: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: TEAL,
    left: -30,
    top: -30,
  },
  burstSpark: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: AMBER,
    left: -3.5,
    top: -3.5,
  },
});
