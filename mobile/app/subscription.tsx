import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '@/api';
import PrimaryButton from '@/components/PrimaryButton';
import ScreenHeader from '@/components/ScreenHeader';
import { Skeleton } from '@/components/Skeleton';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { formatMoney } from '@/money';
import { colors, shadowStrong } from '@/theme';
import type { PaystackInit, Plan } from '@/types';

export default function Subscription() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const toast = useToast();

  const plans = useQuery({
    queryKey: ['plans'],
    queryFn: () => api.get<Plan[]>('/subscription/plans'),
  });

  const subscribe = useMutation({
    mutationFn: (planCode: string) =>
      api.post<PaystackInit>('/subscription/subscribe', { planCode }),
    onSuccess: (payment) => {
      router.push({
        pathname: '/pay',
        params: {
          kind: 'subscription',
          reference: payment.reference,
          url: payment.authorizationUrl,
          amountMinor: String(payment.amountMinor),
          currency: payment.currency,
        },
      });
    },
    onError: () => toast.error('Could not start the payment. Please try again.'),
  });

  const isGH = user?.country !== 'NG';

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top + 6 }}>
      <ScreenHeader title="Premium" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60, gap: 18 }}>
        {user?.premium ? (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.activeCard}>
            <View style={styles.activeBadge}>
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.activeTitle}>Premium is active</Text>
              <Text style={styles.activeSub}>
                {user.premiumUntil
                  ? `Renews / expires ${new Date(user.premiumUntil).toDateString()}`
                  : 'Enjoy everything Dishaspora has to offer.'}
              </Text>
            </View>
          </Animated.View>
        ) : null}

        {/* Free plan */}
        <Animated.View entering={FadeInDown.delay(60).duration(300)} style={styles.freeCard}>
          <Text style={styles.freeTitle}>Free</Text>
          <Text style={styles.freePrice}>
            {isGH ? 'GH₵ 0.00' : formatMoney(0, 'NGN')}
          </Text>
          {['Browse all recipes & stories', 'Order meals and ingredients', 'Food passport stamps'].map(
            (f) => (
              <View key={f} style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color={colors.inkFaint} />
                <Text style={styles.featureTextMuted}>{f}</Text>
              </View>
            )
          )}
        </Animated.View>

        {/* Premium plans (dark card) */}
        {plans.isLoading ? (
          <Skeleton height={280} radius={28} />
        ) : plans.isError ? (
          <View style={styles.plansError}>
            <Text style={styles.plansErrorText}>
              We couldn't load the premium plans right now.
            </Text>
            <PrimaryButton title="Retry" variant="outline" small onPress={() => plans.refetch()} />
          </View>
        ) : (
          (plans.data ?? []).map((plan, i) => (
            <Animated.View
              key={plan.code}
              entering={FadeInDown.delay(120 + i * 80).duration(300)}
              style={styles.premiumCard}
            >
              <View style={styles.premiumTop}>
                <View style={styles.premiumBadge}>
                  <Text style={styles.premiumD}>D</Text>
                </View>
                <Text style={styles.premiumName}>{plan.name}</Text>
              </View>
              <Text style={styles.premiumPrice}>
                {formatMoney(isGH ? plan.amountMinorGHS : plan.amountMinorNGN, isGH ? 'GHS' : 'NGN')}
                <Text style={styles.premiumInterval}> / {plan.interval}</Text>
              </Text>
              {plan.features.map((feature, fi) => (
                <View key={feature} style={styles.featureRow}>
                  <Ionicons
                    name={fi % 2 === 0 ? 'sparkles' : 'flash'}
                    size={16}
                    color={fi % 2 === 0 ? colors.brand : colors.accent}
                  />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
              <PrimaryButton
                title={user?.premium ? 'Extend subscription' : 'Subscribe'}
                loading={subscribe.isPending}
                onPress={() => subscribe.mutate(plan.code)}
                style={{ marginTop: 18 }}
              />
            </Animated.View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  plansError: { alignItems: 'center', gap: 12, paddingVertical: 24 },
  plansErrorText: { fontSize: 13.5, color: colors.inkSoft, textAlign: 'center' },
  activeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.brandLight,
    borderRadius: 20,
    padding: 16,
  },
  activeBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.brandDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTitle: { fontSize: 15, fontWeight: '700', color: colors.ink },
  activeSub: { fontSize: 12.5, color: colors.inkSoft, marginTop: 2 },
  freeCard: {
    backgroundColor: colors.surface,
    borderRadius: 28,
    padding: 22,
  },
  freeTitle: { fontSize: 16, fontWeight: '700', color: colors.inkSoft },
  freePrice: { fontSize: 26, fontWeight: '800', color: colors.ink, marginVertical: 10 },
  premiumCard: {
    backgroundColor: colors.ink,
    borderRadius: 28,
    padding: 22,
    ...shadowStrong,
  },
  premiumTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  premiumBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumD: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  premiumName: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  premiumPrice: { fontSize: 30, fontWeight: '800', color: '#FFFFFF', marginVertical: 14 },
  premiumInterval: { fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.6)' },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 5 },
  featureText: { fontSize: 13.5, color: 'rgba(255,255,255,0.88)', flex: 1 },
  featureTextMuted: { fontSize: 13.5, color: colors.inkSoft, flex: 1 },
});
