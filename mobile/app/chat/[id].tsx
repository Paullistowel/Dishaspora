import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '@/api';
import { useChatThreads } from '@/hooks/useChat';
import ScreenHeader from '@/components/ScreenHeader';
import { useToast } from '@/context/ToastContext';
import { colors } from '@/theme';
import type { ChatMessage } from '@/types';

export default function ChatThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const threadId = Number(id);
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const lastIdRef = useRef(0);

  const threads = useChatThreads();
  const thread = useMemo(
    () => (threads.data ?? []).find((t) => t.id === threadId),
    [threads.data, threadId]
  );

  // initial load + 3s polling with ?after=
  useEffect(() => {
    let stopped = false;
    const fetchNew = async () => {
      try {
        const fresh = await api.get<ChatMessage[]>(
          `/chat/threads/${threadId}/messages`,
          lastIdRef.current > 0 ? { after: lastIdRef.current } : undefined
        );
        if (stopped || fresh.length === 0) return;
        setMessages((prev) => {
          const known = new Set(prev.map((m) => m.id));
          const merged = [...prev, ...fresh.filter((m) => !known.has(m.id))];
          lastIdRef.current = merged.reduce((max, m) => Math.max(max, m.id), 0);
          return merged;
        });
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
      } catch {
        // keep polling silently
      }
    };
    fetchNew();
    const timer = setInterval(fetchNew, 3000);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [threadId]);

  const send = useMutation({
    mutationFn: (body: string) =>
      api.post<ChatMessage>(`/chat/threads/${threadId}/messages`, { body }),
    onSuccess: (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        lastIdRef.current = Math.max(lastIdRef.current, msg.id);
        return [...prev, msg];
      });
      queryClient.invalidateQueries({ queryKey: ['chat-threads'] });
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
    },
    onError: (_e, body) => {
      // Restore the unsent text so the user doesn't lose what they typed.
      setInput((cur) => (cur.length ? cur : body));
      toast.error("Message didn't send. Check your connection and try again.");
    },
  });

  const submit = () => {
    const body = input.trim();
    if (!body || send.isPending) return;
    setInput('');
    send.mutate(body);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ flex: 1, paddingTop: insets.top + 6 }}>
        <ScreenHeader title={thread?.vendorName ?? 'Chat'} />
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ padding: 20, gap: 10 }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {messages.map((msg) =>
            msg.mine ? (
              <Animated.View key={msg.id} entering={FadeInUp.duration(220)} style={styles.mine}>
                <Text style={styles.mineText}>{msg.body}</Text>
              </Animated.View>
            ) : (
              <Animated.View key={msg.id} entering={FadeInDown.duration(220)} style={styles.theirs}>
                <Text style={styles.theirsText}>{msg.body}</Text>
              </Animated.View>
            )
          )}
        </ScrollView>
        <View style={[styles.inputRow, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Type a message..."
            placeholderTextColor={colors.inkFaint}
            onSubmitEditing={submit}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || send.isPending) && { opacity: 0.5 }]}
            onPress={submit}
            disabled={!input.trim() || send.isPending}
          >
            <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  mine: {
    alignSelf: 'flex-end',
    maxWidth: '80%',
    backgroundColor: colors.accentLight,
    borderRadius: 18,
    borderBottomRightRadius: 5,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  mineText: { fontSize: 14, color: colors.ink, lineHeight: 19 },
  theirs: {
    alignSelf: 'flex-start',
    maxWidth: '80%',
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderBottomLeftRadius: 5,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  theirsText: { fontSize: 14, color: colors.ink, lineHeight: 19 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 18,
    height: 48,
    fontSize: 14,
    color: colors.ink,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
