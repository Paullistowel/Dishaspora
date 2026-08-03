import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, ApiError } from '@/api';
import BasketSheet from '@/components/BasketSheet';
import PrimaryButton from '@/components/PrimaryButton';
import RecipeCard from '@/components/RecipeCard';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useAssistantChat } from '@/hooks/useAi';
import { colors, spacing } from '@/theme';
import type { AssistantMessage, Recipe } from '@/types';

// The AI Chef shares the app's light design system (see theme.ts) so it feels
// native to Dishaspora rather than a bolted-on dark surface.

const SUGGESTIONS = [
  'Suggest a Ghanaian meal',
  'Give me a high protein meal',
  'What can I cook with chicken?',
  'A low-carb dinner under 30 minutes',
];

const CAPABILITIES: [string, string][] = [
  ['🍲', 'Discover meals from home & the world'],
  ['📸', 'Identify food from a photo'],
  ['🥗', 'Track nutrition & allergens'],
  ['🛒', 'Create shopping lists'],
  ['👨‍🍳', 'Guide your cooking, step by step'],
];

interface Bubble {
  role: 'user' | 'assistant';
  content: string;
  recipes?: Recipe[];
  at: number;
}

/** Local clock time (HH:MM AM/PM) for a message timestamp. */
function clock(ms: number): string {
  const d = new Date(ms);
  const h = d.getHours();
  const m = d.getMinutes();
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

/** Three bouncing dots — the AI "typing…" indicator. */
function TypingDots() {
  return (
    <View style={styles.typingRow}>
      {[0, 1, 2].map((i) => (
        <Dot key={i} delay={i * 160} />
      ))}
    </View>
  );
}
function Dot({ delay }: { delay: number }) {
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 300, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 300, easing: Easing.inOut(Easing.quad) })
      ),
      -1
    );
  }, [y]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return <Animated.View style={[styles.dot, style, { opacity: 0.5 + delay / 1000 }]} />;
}

/** Minimal markdown: renders **bold** inline and treats "- " / "• " lines as bullets. */
function RichText({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <View>
      {lines.map((line, li) => {
        const bullet = /^\s*([-•])\s+/.test(line);
        const clean = line.replace(/^\s*([-•])\s+/, '');
        const parts = clean.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
        return (
          <View key={li} style={bullet ? styles.bulletRow : undefined}>
            {bullet ? <Text style={styles.bulletDot}>•</Text> : null}
            <Text style={styles.msgText}>
              {parts.map((p, pi) =>
                p.startsWith('**') && p.endsWith('**') ? (
                  <Text key={pi} style={{ fontWeight: '800' }}>
                    {p.slice(2, -2)}
                  </Text>
                ) : (
                  <Text key={pi}>{p}</Text>
                )
              )}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export default function Assistant() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const toast = useToast();
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [input, setInput] = useState('');
  const [gated, setGated] = useState(!user?.premium);
  const listRef = useRef<FlatList<Bubble>>(null);
  const chat = useAssistantChat();

  const scrollDown = () =>
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 60);

  // Keep the newest message visible when the keyboard opens so the input never
  // covers what the user just sent.
  useEffect(() => {
    const evt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const sub = Keyboard.addListener(evt, () => scrollDown());
    return () => sub.remove();
  }, []);

  const send = (text: string) => {
    const message = text.trim();
    if (!message || chat.isPending) return;
    const history: AssistantMessage[] = bubbles
      .slice(-6)
      .map((b) => ({ role: b.role, content: b.content }));
    setBubbles((prev) => [...prev, { role: 'user', content: message, at: Date.now() }]);
    setInput('');
    scrollDown();
    chat.mutate(
      { message, history },
      {
        onSuccess: (res) => {
          setBubbles((prev) => [
            ...prev,
            { role: 'assistant', content: res.reply, recipes: res.recipes, at: Date.now() },
          ]);
          scrollDown();
        },
        onError: (e) => {
          if (e instanceof ApiError && e.premiumRequired) {
            setGated(true);
            return;
          }
          setBubbles((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: 'Sorry — I hit a snag. Please try that again in a moment.',
              at: Date.now(),
            },
          ]);
          scrollDown();
        },
      }
    );
  };

  if (gated) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + 6 }]}>
        <StatusBar style="dark" />
        <Header onSettings={() => router.push('/preferences')} onClose={() => router.back()} />
        <View style={styles.gate}>
          <View style={styles.gateBadge}>
            <Ionicons name="sparkles" size={34} color={colors.brandDark} />
          </View>
          <Text style={styles.gateTitle}>Dishaspora AI Chef</Text>
          <Text style={styles.gateSub}>
            Your personal food guide — cook with what you have, hit your macros, and rediscover
            dishes from home. It's a Premium feature.
          </Text>
          <PrimaryButton
            title="Go Premium"
            onPress={() => router.push('/subscription')}
            style={{ alignSelf: 'stretch', marginTop: 26 }}
          />
        </View>
      </View>
    );
  }

  const isEmpty = bubbles.length === 0;
  const firstName = user?.name?.split(' ')[0] ?? 'there';

  const renderBubble = ({ item, index }: { item: Bubble; index: number }) =>
    item.role === 'user' ? (
      <Animated.View entering={FadeInUp.duration(220)} style={styles.userWrap}>
        <View style={styles.userBubble}>
          <Text style={styles.userText}>{item.content}</Text>
        </View>
        <Text style={styles.timeRight}>{clock(item.at)}</Text>
      </Animated.View>
    ) : (
      <Animated.View entering={FadeInDown.duration(220)} style={styles.aiRow}>
        <View style={styles.aiAvatar}>
          <Ionicons name="sparkles" size={14} color={colors.brandDark} />
        </View>
        <View style={{ flex: 1, gap: 10 }}>
          <View style={styles.aiBubble}>
            <RichText text={item.content} />
          </View>
          {item.recipes && item.recipes.length > 0 ? (
            <View style={{ gap: 12 }}>
              {item.recipes.map((recipe) => (
                <ChatRecipe key={`${index}-${recipe.id}`} recipe={recipe} />
              ))}
            </View>
          ) : null}
          <Text style={styles.timeLeft}>{clock(item.at)}</Text>
        </View>
      </Animated.View>
    );

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 6 }]}>
      <StatusBar style="dark" />
      <Header onSettings={() => router.push('/preferences')} onClose={() => router.back()} />

      {/* KAV wraps the message region + composer; the header stays fixed, so
          keyboardVerticalOffset is 0 and the composer lifts to sit on the keyboard. */}
      <KeyboardAvoidingView
        style={{ flex: 10 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {isEmpty ? (
          <ScrollView
            contentContainerStyle={styles.emptyScroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
          >
            <Animated.View entering={FadeIn.duration(300)}>
              <View style={styles.emptyBadge}>
                <Ionicons name="restaurant" size={28} color={colors.brandDark} />
              </View>
              <Text style={styles.emptyTitle}>Hi {firstName} 👋</Text>
              <Text style={styles.emptySub}>
                I'm your Dishaspora AI Chef — your personal cooking assistant. I can help you:
              </Text>
              <View style={styles.emptyList}>
                {CAPABILITIES.map(([e, t]) => (
                  <View key={t} style={styles.emptyItem}>
                    <Text style={styles.emptyEmoji}>{e}</Text>
                    <Text style={styles.emptyItemText}>{t}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.promptsLabel}>Try asking</Text>
              <View style={styles.promptWrap}>
                {SUGGESTIONS.map((s) => (
                  <Pressable
                    key={s}
                    style={styles.promptChip}
                    onPress={() => send(s)}
                    accessibilityRole="button"
                    accessibilityLabel={s}
                  >
                    <Ionicons name="sparkles-outline" size={13} color={colors.brandDark} />
                    <Text style={styles.promptChipText}>{s}</Text>
                  </Pressable>
                ))}
              </View>
            </Animated.View>
          </ScrollView>
        ) : (
          <FlatList
            ref={listRef}
            data={bubbles}
            renderItem={renderBubble}
            keyExtractor={(_, i) => String(i)}
            contentContainerStyle={{ padding: spacing.lg, gap: 14 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            ListFooterComponent={
              chat.isPending ? (
                <View style={[styles.aiRow, { marginTop: 14 }]}>
                  <View style={styles.aiAvatar}>
                    <Ionicons name="sparkles" size={14} color={colors.brandDark} />
                  </View>
                  <View style={[styles.aiBubble, { paddingVertical: 16 }]}>
                    <TypingDots />
                  </View>
                </View>
              ) : null
            }
          />
        )}

        {/* Composer */}
        <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <Pressable
            style={styles.composerBtn}
            onPress={() => router.push('/snap')}
            accessibilityRole="button"
            accessibilityLabel="Take a photo of a dish"
          >
            <Ionicons name="camera-outline" size={22} color={colors.inkSoft} />
          </Pressable>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask the AI Chef…"
            placeholderTextColor={colors.inkFaint}
            onSubmitEditing={() => send(input)}
            returnKeyType="send"
            multiline
          />
          <Pressable
            style={styles.composerBtn}
            onPress={() => toast.info('Voice input is coming soon.')}
            accessibilityRole="button"
            accessibilityLabel="Voice input (coming soon)"
          >
            <Ionicons name="mic-outline" size={22} color={colors.inkSoft} />
          </Pressable>
          <Pressable
            onPress={() => send(input)}
            disabled={!input.trim() || chat.isPending}
            style={[styles.sendBtn, (!input.trim() || chat.isPending) && { opacity: 0.4 }]}
            accessibilityRole="button"
            accessibilityLabel="Send message"
          >
            <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

/**
 * A recipe surfaced inside an AI reply. Reuses existing flows so nothing is
 * duplicated: Cook (guided cook screen), Buy (opens the BasketSheet — pick
 * ingredients + add selected to cart), Save (bookmark). The steps card expands
 * inline from the recipe's own data.
 */
function ChatRecipe({ recipe }: { recipe: Recipe }) {
  const router = useRouter();
  const toast = useToast();
  const [stepsOpen, setStepsOpen] = useState(false);
  const [basketOpen, setBasketOpen] = useState(false);
  const totalMin = recipe.prepMinutes + recipe.cookMinutes;
  const stepCount = recipe.steps?.length ?? 0;

  const save = useMutation({
    mutationFn: () => api.post(`/recipes/${recipe.id}/save`),
    onSuccess: () => toast.success(`Saved ${recipe.title} to your recipes.`),
    onError: () => toast.error('Could not save this recipe.'),
  });

  const cook = () =>
    router.push({ pathname: '/recipe/[id]/cook', params: { id: String(recipe.id) } });

  return (
    <View style={styles.chatRecipe}>
      <RecipeCard recipe={recipe} showMeta={false} />
      <Text style={styles.chatRecipeTitle} numberOfLines={1}>
        {recipe.title}
      </Text>
      <Text style={styles.chatRecipeMeta}>
        {recipe.calories} kcal · {totalMin} min{stepCount > 0 ? ` · ${stepCount} steps` : ''}
      </Text>
      <View style={styles.recipeActions}>
        <ActionBtn icon="restaurant-outline" label="Cook" onPress={cook} />
        <ActionBtn icon="cart-outline" label="Buy" onPress={() => setBasketOpen(true)} />
        <ActionBtn
          icon="bookmark-outline"
          label="Save"
          onPress={() => save.mutate()}
          disabled={save.isPending}
        />
      </View>

      {/* Cooking-steps card: numbered, expand/collapse, full instructions. */}
      {stepCount > 0 ? (
        <View style={styles.stepsCard}>
          <Pressable
            style={styles.stepsToggle}
            onPress={() => setStepsOpen((o) => !o)}
            accessibilityRole="button"
            accessibilityLabel={stepsOpen ? 'Hide cooking steps' : 'Show cooking steps'}
          >
            <Ionicons name="list-outline" size={15} color={colors.brandDark} />
            <Text style={styles.stepsToggleText}>
              {stepsOpen ? 'Hide steps' : `View cooking steps (${stepCount})`}
            </Text>
            <Ionicons
              name={stepsOpen ? 'chevron-up' : 'chevron-down'}
              size={15}
              color={colors.brandDark}
            />
          </Pressable>
          {stepsOpen ? (
            <View style={styles.stepsList}>
              {recipe.steps.map((s) => (
                <View key={s.stepNumber} style={styles.stepRow}>
                  <View style={styles.stepNum}>
                    <Text style={styles.stepNumText}>{s.stepNumber}</Text>
                  </View>
                  <Text style={styles.stepText}>{s.instruction}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      <BasketSheet
        recipeId={recipe.id}
        visible={basketOpen}
        onClose={() => setBasketOpen(false)}
      />
    </View>
  );
}

function ActionBtn({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      style={[styles.actionBtn, disabled && { opacity: 0.5 }]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={15} color={colors.brandDark} />
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

function Header({ onSettings, onClose }: { onSettings: () => void; onClose: () => void }) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onClose} hitSlop={10} style={styles.headerBtn} accessibilityRole="button" accessibilityLabel="Close">
        <Ionicons name="chevron-down" size={24} color={colors.ink} />
      </Pressable>
      <View style={styles.headerCenter}>
        <View style={styles.headerAvatar}>
          <Ionicons name="sparkles" size={16} color={colors.brandDark} />
          <View style={styles.onlineDot} />
        </View>
        <View>
          <Text style={styles.headerTitle}>Dishaspora AI Chef</Text>
          <Text style={styles.headerStatus}>● Online</Text>
        </View>
      </View>
      <Pressable onPress={onSettings} hitSlop={10} style={styles.headerBtn} accessibilityRole="button" accessibilityLabel="Preferences">
        <Ionicons name="options-outline" size={22} color={colors.ink} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.surfaceAlt,
  },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, justifyContent: 'center' },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.background,
  },
  headerTitle: { color: colors.ink, fontSize: 15.5, fontWeight: '800' },
  headerStatus: { color: colors.success, fontSize: 11, fontWeight: '600', marginTop: 1 },

  emptyScroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 28 },
  emptyBadge: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: colors.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  emptyTitle: { color: colors.ink, fontSize: 26, fontWeight: '800' },
  emptySub: { color: colors.inkSoft, fontSize: 15, marginTop: 8, marginBottom: 20, lineHeight: 21 },
  emptyList: { gap: 13 },
  emptyItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  emptyEmoji: { fontSize: 20, width: 26, textAlign: 'center' },
  emptyItemText: { color: colors.ink, fontSize: 15, flex: 1 },
  promptsLabel: {
    color: colors.inkFaint,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 28,
    marginBottom: 12,
  },
  promptWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  promptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.surfaceAlt,
  },
  promptChipText: { color: colors.ink, fontSize: 13.5, fontWeight: '600' },

  userWrap: { alignSelf: 'flex-end', maxWidth: '82%', alignItems: 'flex-end' },
  userBubble: {
    backgroundColor: colors.brand,
    borderRadius: 20,
    borderBottomRightRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  userText: { fontSize: 15, color: colors.ink, lineHeight: 21, fontWeight: '500' },
  timeRight: { color: colors.inkFaint, fontSize: 10.5, marginTop: 4, marginRight: 4 },
  timeLeft: { color: colors.inkFaint, fontSize: 10.5, marginTop: 2, marginLeft: 2 },

  aiRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end', maxWidth: '96%' },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBubble: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignSelf: 'flex-start',
    flexShrink: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.surfaceAlt,
  },
  msgText: { fontSize: 15, color: colors.ink, lineHeight: 22 },
  bulletRow: { flexDirection: 'row', gap: 8 },
  bulletDot: { fontSize: 15, lineHeight: 22, color: colors.ink },
  typingRow: { flexDirection: 'row', gap: 5, alignItems: 'center', height: 8 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.inkFaint },

  chatRecipe: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.surfaceAlt,
  },
  chatRecipeTitle: { color: colors.ink, fontSize: 14.5, fontWeight: '700', marginTop: 8 },
  chatRecipeMeta: { color: colors.inkSoft, fontSize: 12, marginTop: 2 },
  recipeActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.surfaceAlt,
  },
  actionText: { color: colors.ink, fontSize: 12.5, fontWeight: '700' },
  stepsCard: { marginTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.surfaceAlt, paddingTop: 8 },
  stepsToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  stepsToggleText: { flex: 1, color: colors.brandDark, fontSize: 13, fontWeight: '700' },
  stepsList: { gap: 8, marginTop: 8 },
  stepRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumText: { fontSize: 11, fontWeight: '800', color: colors.accentDark },
  stepText: { flex: 1, fontSize: 13.5, color: colors.ink, lineHeight: 19 },

  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.surfaceAlt,
    backgroundColor: colors.background,
  },
  composerBtn: {
    width: 38,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 8,
    paddingBottom: Platform.OS === 'ios' ? 12 : 8,
    maxHeight: 120,
    fontSize: 15,
    color: colors.ink,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.surfaceAlt,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },

  gate: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  gateBadge: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gateTitle: { fontSize: 22, fontWeight: '800', color: colors.ink, marginTop: 22 },
  gateSub: { fontSize: 14, color: colors.inkSoft, textAlign: 'center', marginTop: 10, lineHeight: 21 },
});
