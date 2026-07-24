import React, { useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { colors, shadowStrong } from '@/theme';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    image: require('../assets/images/onboarding-1.png'),
    title: ['Taste of Home,', 'Wherever You Are'],
    sub: 'Authentic Ghanaian and Nigerian recipes with the stories behind every dish — cook the food you grew up with.',
  },
  {
    image: require('../assets/images/onboarding-2.png'),
    title: ['Cook It, Shop It,', 'Or Order It'],
    sub: 'Follow guided cook mode, buy every ingredient in one tap, or order the finished meal from trusted local vendors.',
  },
  {
    image: require('../assets/images/onboarding-3.png'),
    title: ['Stamp Your', 'Food Passport'],
    sub: 'Every dish you cook earns passport stamps across West Africa and beyond. Start your culinary journey today.',
  },
];

export default function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { completeOnboarding, token } = useAuth();
  const [page, setPage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setPage(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  const finish = async () => {
    await completeOnboarding();
    // Reached after sign-up (authenticated) → into the app; otherwise → sign in.
    router.replace(token ? '/(tabs)' : '/(auth)/login');
  };

  const next = async () => {
    if (page < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: (page + 1) * width, animated: true });
    } else {
      await finish();
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
      >
        {SLIDES.map((slide, i) => (
          <View key={i} style={{ width }}>
            <Image source={slide.image} style={styles.hero} contentFit="cover" />
            <View style={styles.panel}>
              <Text style={styles.headline}>
                {slide.title[0]}
                {'\n'}
                {slide.title[1]}
              </Text>
              <Text style={styles.sub}>{slide.sub}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
        <View style={styles.logoChip}>
          <Image source={require('../assets/images/dishaspora-logo.png')} style={styles.logoImg} contentFit="cover" />
        </View>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === page && styles.dotActive]} />
          ))}
        </View>
        <TouchableOpacity style={styles.startBtn} onPress={next} activeOpacity={0.85}>
          <Text style={styles.startText}>{page === SLIDES.length - 1 ? 'Start' : 'Next'}</Text>
          <View style={styles.chevrons}>
            <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.4)" />
            <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.7)" style={styles.chevOverlap} />
            <Ionicons name="chevron-forward" size={14} color="#FFFFFF" style={styles.chevOverlap} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  hero: { width: '100%', height: '58%' },
  panel: { flex: 1, paddingHorizontal: 28, paddingTop: 28 },
  headline: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
    color: colors.ink,
  },
  sub: { fontSize: 14, lineHeight: 22, color: colors.inkSoft, marginTop: 14 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    gap: 14,
  },
  logoChip: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImg: { width: 36, height: 36, borderRadius: 18 },
  dots: { flex: 1, flexDirection: 'row', gap: 6, justifyContent: 'center' },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.surfaceAlt,
  },
  dotActive: { backgroundColor: colors.accent, width: 18 },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderRadius: 999,
    height: 64,
    paddingHorizontal: 26,
    gap: 8,
    ...shadowStrong,
  },
  startText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  chevrons: { flexDirection: 'row', alignItems: 'center' },
  chevOverlap: { marginLeft: -6 },
});
