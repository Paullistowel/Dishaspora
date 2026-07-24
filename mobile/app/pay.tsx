import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { api, ApiError } from '@/api';
import PrimaryButton from '@/components/PrimaryButton';
import ScreenHeader from '@/components/ScreenHeader';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { formatMoney } from '@/money';
import { colors, shadow } from '@/theme';
import type { Currency, Order, User } from '@/types';

// Paystack redirects to one of these once the transaction terminates. We watch
// for any of them in the WebView so we can verify server-side in real time.
const COMPLETION_MARKERS = ['callback', 'paystack.co/close', 'trxref=', 'reference=', 'success'];

/**
 * Payment step for orders and subscriptions.
 *
 *  • Real Paystack URLs (checkout.paystack.com) open in a WebView; when Paystack
 *    redirects to the callback we verify the transaction server-side.
 *  • Demo/sandbox URLs (offline demo build) render a sandbox sheet that verifies
 *    against the in-memory backend so the full journey is testable with no server.
 *
 * Either path ends in POST /verify — an order is only marked PAID after the
 * backend confirms the charge, and the cart is cleared only on that confirmation.
 */
export default function Pay() {
  const params = useLocalSearchParams<{
    kind: 'order' | 'subscription';
    orderId?: string;
    reference: string;
    url: string;
    amountMinor: string;
    currency: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const cart = useCart();
  const { refreshUser } = useAuth();
  const toast = useToast();
  const [done, setDone] = useState(false);
  const [webLoading, setWebLoading] = useState(true);
  // Guards against firing verify twice for the same completion event.
  const verifiedRef = useRef(false);

  const url = params.url ?? '';
  // Guard against landing here without the params a payment needs.
  const paramsValid =
    !!params.reference && !!params.kind && (params.kind !== 'order' || !!params.orderId);
  const isRealPaystack = url.includes('checkout.paystack.com') && !url.includes('/mock/');
  const isSandbox = !isRealPaystack; // demo URL, mock URL, or anything non-live
  const amount = Number(params.amountMinor ?? 0);
  const currency = (params.currency ?? 'GHS') as Currency;

  const verify = useMutation({
    mutationFn: async () => {
      if (params.kind === 'subscription') {
        return api.post<User>('/subscription/verify', { reference: params.reference });
      }
      return api.post<Order>(`/orders/${params.orderId}/verify`, {
        reference: params.reference,
      });
    },
    onSuccess: async () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      // Clear the cart ONLY now that payment is confirmed — never before.
      if (params.kind === 'order') cart.clear();
      if (params.kind === 'subscription') await refreshUser();
      queryClient.invalidateQueries();
      setDone(true);
    },
    onError: (e: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      // Allow another attempt — the charge may not have completed yet.
      verifiedRef.current = false;
      const msg =
        e instanceof ApiError
          ? e.message
          : "We couldn't confirm your payment yet. If you completed it, tap “I have completed payment”.";
      toast.error(msg);
    },
  });

  const runVerify = () => {
    if (verifiedRef.current || verify.isPending) return;
    verifiedRef.current = true;
    verify.mutate();
  };

  const cancel = () => {
    Alert.alert('Cancel payment?', 'Your order is saved and stays unpaid — you can pay for it later from your orders.', [
      { text: 'Keep paying', style: 'cancel' },
      { text: 'Cancel payment', style: 'destructive', onPress: () => router.back() },
    ]);
  };

  // ---- Missing/invalid params ----
  if (!paramsValid) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top + 6 }}>
        <ScreenHeader title="Checkout" />
        <View style={styles.center}>
          <Text style={styles.successSub}>
            This payment session is no longer valid. Start checkout again from your cart.
          </Text>
          <PrimaryButton
            title="Back"
            variant="outline"
            onPress={() => router.back()}
            style={{ alignSelf: 'stretch', marginTop: 20 }}
          />
        </View>
      </View>
    );
  }

  // ---- Success ----
  if (done) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Animated.View entering={ZoomIn.springify().damping(12)} style={styles.successBadge}>
          <Ionicons name="checkmark" size={44} color="#FFFFFF" />
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(150)} style={{ alignItems: 'center' }}>
          <Text style={styles.successTitle}>
            {params.kind === 'subscription' ? 'Welcome to Premium!' : 'Payment successful'}
          </Text>
          <Text style={styles.successSub}>
            {params.kind === 'subscription'
              ? 'Ask Dishaspora, video guides and vendor chat are now unlocked.'
              : `Your order is confirmed. Reference ${params.reference}.`}
          </Text>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(280)} style={{ alignSelf: 'stretch', gap: 12, marginTop: 32 }}>
          {params.kind === 'order' ? (
            <PrimaryButton title="View my orders" onPress={() => router.replace('/orders')} />
          ) : (
            <PrimaryButton title="Ask Dishaspora" onPress={() => router.replace('/assistant')} />
          )}
          <PrimaryButton title="Back to home" variant="outline" onPress={() => router.dismissAll()} />
        </Animated.View>
      </View>
    );
  }

  // ---- Sandbox / demo payment (offline build) ----
  if (isSandbox) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top + 6 }}>
        <ScreenHeader title="Sandbox checkout" />
        <View style={styles.center}>
          <View style={styles.mockCard}>
            <View style={styles.sandboxTag}>
              <Ionicons name="flask-outline" size={13} color={colors.blueDark} />
              <Text style={styles.sandboxTagText}>Sandbox — no real charge</Text>
            </View>
            <View style={styles.mockLogo}>
              <Ionicons name="card-outline" size={26} color={colors.accentDark} />
            </View>
            <Text style={styles.mockAmount}>{formatMoney(amount, currency)}</Text>
            <Text style={styles.mockRef}>Ref {params.reference}</Text>
            <Text style={styles.mockNote}>
              This build runs offline against demo data. Confirm to complete the full order
              journey. Point the app at a live backend (EXPO_PUBLIC_DEMO_MODE=false) for real
              Paystack payments.
            </Text>
            <PrimaryButton
              title={`Pay ${formatMoney(amount, currency)}`}
              loading={verify.isPending}
              onPress={runVerify}
              style={{ alignSelf: 'stretch', marginTop: 22 }}
            />
            <PrimaryButton
              title="Cancel"
              variant="outline"
              onPress={() => router.back()}
              style={{ alignSelf: 'stretch', marginTop: 10 }}
            />
          </View>
        </View>
      </View>
    );
  }

  // ---- Live Paystack ----
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top + 6 }}>
      <ScreenHeader title="Secure checkout" onBack={cancel} />
      <View style={{ flex: 1 }}>
        <WebView
          source={{ uri: url }}
          style={{ flex: 1 }}
          onLoadStart={() => setWebLoading(true)}
          onLoadEnd={() => setWebLoading(false)}
          onNavigationStateChange={(nav) => {
            const u = (nav.url ?? '').toLowerCase();
            if (COMPLETION_MARKERS.some((mk) => u.includes(mk))) runVerify();
          }}
          onError={({ nativeEvent }) => {
            // The callback page may live on a backend the device can't load directly
            // (e.g. localhost) — the redirect still means Paystack finished, so verify.
            const u = (nativeEvent.url ?? '').toLowerCase();
            if (COMPLETION_MARKERS.some((mk) => u.includes(mk))) runVerify();
          }}
        />
        {webLoading || verify.isPending ? (
          <View style={styles.webLoading} pointerEvents="none">
            <ActivityIndicator size="large" color={colors.brandDark} />
            <Text style={styles.webLoadingText}>
              {verify.isPending ? 'Confirming payment…' : 'Loading secure checkout…'}
            </Text>
          </View>
        ) : null}
      </View>
      <View style={{ padding: 16, paddingBottom: Math.max(insets.bottom, 16), gap: 10 }}>
        <PrimaryButton
          title="I have completed payment"
          variant="outline"
          loading={verify.isPending}
          onPress={runVerify}
        />
        <Text style={styles.helpText} onPress={cancel}>
          Cancel payment
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    backgroundColor: colors.background,
  },
  successBadge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  successTitle: { fontSize: 22, fontWeight: '800', color: colors.ink },
  successSub: {
    fontSize: 14,
    color: colors.inkSoft,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 21,
  },
  mockCard: {
    alignSelf: 'stretch',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 26,
    alignItems: 'center',
    ...shadow,
  },
  sandboxTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.blueLight,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 14,
  },
  sandboxTagText: { fontSize: 11.5, fontWeight: '700', color: colors.blueDark },
  mockLogo: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: colors.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockAmount: { fontSize: 30, fontWeight: '800', color: colors.ink, marginTop: 16 },
  mockRef: { fontSize: 12.5, color: colors.inkFaint, marginTop: 4 },
  mockNote: {
    fontSize: 13,
    color: colors.inkSoft,
    textAlign: 'center',
    marginTop: 14,
    lineHeight: 19,
  },
  webLoading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    gap: 12,
  },
  webLoadingText: { fontSize: 14, color: colors.inkSoft, fontWeight: '600' },
  helpText: {
    fontSize: 13,
    color: colors.inkFaint,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 4,
  },
});
