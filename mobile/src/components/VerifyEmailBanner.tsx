import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { api, ApiError } from '@/api';
import { useAuth } from '@/context/AuthContext';
import { colors, radius } from '@/theme';

/**
 * Persistent nudge shown while the signed-in user's email is unverified.
 * Renders nothing once verified. Resend is rate-limited by the backend (60s).
 */
export default function VerifyEmailBanner() {
  const { user, refreshUser } = useAuth();

  const resend = useMutation({
    mutationFn: () => api.post<{ message: string }>('/auth/resend-verification', { email: user?.email }),
    onSuccess: (r) => Alert.alert('Verification email sent', r.message),
    onError: (e) =>
      Alert.alert(
        'Could not resend',
        e instanceof ApiError ? e.message : 'Please try again in a moment.'
      ),
  });

  if (!user || user.emailVerified) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <Ionicons name="mail-unread-outline" size={18} color={colors.accentDark} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>Verify your email</Text>
        <Text style={styles.sub} numberOfLines={2}>
          We sent a link to {user.email}. Verify to unlock ordering and reviews.
        </Text>
      </View>
      <TouchableOpacity
        style={styles.btn}
        onPress={() => (resend.isPending ? null : resend.mutate())}
        onLongPress={() => refreshUser()}
      >
        <Text style={styles.btnText}>{resend.isPending ? '…' : 'Resend'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.accentLight,
    borderRadius: radius.md,
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 14,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 13.5, fontWeight: '800', color: colors.ink },
  sub: { fontSize: 11.5, color: colors.inkSoft, marginTop: 1, lineHeight: 15 },
  btn: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  btnText: { color: '#FFFFFF', fontSize: 12.5, fontWeight: '800' },
});
