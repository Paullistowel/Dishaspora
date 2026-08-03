import React, { useMemo, useState } from 'react';
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
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '@/api';
import PrimaryButton from '@/components/PrimaryButton';
import ScreenHeader from '@/components/ScreenHeader';
import SummaryBlock from '@/components/SummaryBlock';
import { IMG } from '@/config';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';
import { useToast } from '@/context/ToastContext';
import { DELIVERY_MINOR, orderTotals } from '@/fees';
import { formatMoney } from '@/money';
import { radius, shadow, type ThemeColors } from '@/theme';
import type { OrderCreateResponse } from '@/types';

// Stable step keys (not localized) so the active-step comparison never depends
// on the current language; labels are derived via t() at render time.
const STEP_KEYS = ['delivery', 'review', 'payment'] as const;

export default function Checkout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cart = useCart();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const toast = useToast();
  const { vendorId } = useLocalSearchParams<{ vendorId?: string }>();

  const stepLabels = [t('cart.stepDelivery'), t('cart.stepReview'), t('cart.stepPayment')];

  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');

  // Checkout is per-vendor: it operates on one vendor's items and creates one
  // order + one payment. The cart may still hold other vendors' items, which are
  // checked out in their own passes.
  const targetVendorId = vendorId ? Number(vendorId) : cart.groups[0]?.vendorId ?? null;
  const activeItems = cart.items.filter((it) => it.listing.vendorId === targetVendorId);
  const activeSubtotal = activeItems.reduce((n, it) => n + it.listing.amountMinor * it.qty, 0);
  const vendorName = activeItems[0]?.listing.vendorName ?? '';
  const remainingVendors = cart.groups.length - 1;

  const { feeMinor, totalMinor } = orderTotals(activeSubtotal);
  const currency = activeItems[0]?.listing.currency ?? 'GHS';

  const placeOrder = useMutation({
    mutationFn: () =>
      api.post<OrderCreateResponse>('/orders', {
        items: activeItems.map((it) => ({ listingId: it.listing.id, qty: it.qty })),
      }),
    onSuccess: ({ order, payment }) => {
      router.replace({
        pathname: '/pay',
        params: {
          kind: 'order',
          orderId: String(order.id),
          vendorId: targetVendorId != null ? String(targetVendorId) : undefined,
          reference: payment.reference,
          url: payment.authorizationUrl,
          amountMinor: String(payment.amountMinor),
          currency: payment.currency,
        },
      });
    },
    onError: (e: any) => toast.error(e?.message ?? t('cart.orderCreateError')),
  });

  if (activeItems.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top + 6 }}>
        <ScreenHeader title={t('cart.checkoutTitle')} />
        <View style={styles.center}><Text style={styles.empty}>{t('cart.checkoutEmpty')}</Text></View>
      </View>
    );
  }

  const canNext = step === 0 ? fullName.trim() && phone.trim() && address.trim() : true;
  const next = () => {
    if (step === 0 && !canNext) {
      toast.error(t('cart.deliveryValidation'));
      return;
    }
    if (step < 2) setStep(step + 1);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flex: 1, paddingTop: insets.top + 6 }}>
        <ScreenHeader title={t('cart.checkoutTitle')} />

        {/* Step indicator */}
        <View style={styles.steps}>
          {stepLabels.map((s, i) => (
            <View key={STEP_KEYS[i]} style={styles.stepItem}>
              <View style={[styles.stepDot, i <= step && styles.stepDotActive, i < step && styles.stepDotDone]}>
                {i < step ? <Ionicons name="checkmark" size={13} color="#FFF" /> : <Text style={[styles.stepNum, i <= step && { color: '#FFF' }]}>{i + 1}</Text>}
              </View>
              <Text style={[styles.stepLabel, i === step && styles.stepLabelActive]}>{s}</Text>
              {i < stepLabels.length - 1 ? <View style={[styles.stepBar, i < step && styles.stepBarDone]} /> : null}
            </View>
          ))}
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 20, gap: 14 }} keyboardShouldPersistTaps="handled">
          {step === 0 ? (
            <Animated.View entering={FadeIn.duration(250)} style={{ gap: 14 }}>
              <Text style={styles.h}>{t('cart.deliveryDetails')}</Text>
              <Field label={t('cart.fullName')}><TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder={t('cart.fullNamePlaceholder')} placeholderTextColor={colors.inkFaint} /></Field>
              <Field label={t('cart.phoneNumber')}><TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder={t('cart.phonePlaceholder')} placeholderTextColor={colors.inkFaint} keyboardType="phone-pad" /></Field>
              <Field label={t('cart.deliveryAddress')}><TextInput style={[styles.input, styles.multiline]} value={address} onChangeText={setAddress} placeholder={t('cart.addressPlaceholder')} placeholderTextColor={colors.inkFaint} multiline /></Field>
              <Field label={t('cart.deliveryNoteLabel')}><TextInput style={styles.input} value={note} onChangeText={setNote} placeholder={t('cart.notePlaceholder')} placeholderTextColor={colors.inkFaint} /></Field>
            </Animated.View>
          ) : null}

          {step === 1 ? (
            <Animated.View entering={FadeIn.duration(250)} style={{ gap: 14 }}>
              <Text style={styles.h}>{t('cart.reviewOrder')}</Text>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{t('cart.deliveringTo')}</Text>
                <Text style={styles.addrName}>{fullName}</Text>
                <Text style={styles.addrLine}>{phone}</Text>
                <Text style={styles.addrLine}>{address}</Text>
                {note ? <Text style={styles.addrNote}>“{note}”</Text> : null}
                <TouchableOpacity onPress={() => setStep(0)}><Text style={styles.editLink}>{t('cart.edit')}</Text></TouchableOpacity>
              </View>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{activeItems.length} {t('cart.itemsFrom')} {vendorName}</Text>
                {activeItems.map((it) => (
                  <View key={it.listing.id} style={styles.itemRow}>
                    <Image source={{ uri: IMG(it.listing.imageUrl) }} style={styles.itemImg} contentFit="cover" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle} numberOfLines={1}>{it.listing.title}</Text>
                      <Text style={styles.itemQty}>{t('cart.qty')} {it.qty}</Text>
                    </View>
                    <Text style={styles.itemPrice}>{formatMoney(it.listing.amountMinor * it.qty, it.listing.currency)}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.card}>
                <SummaryBlock subtotalMinor={cart.subtotalMinor} feeMinor={feeMinor} deliveryMinor={DELIVERY_MINOR} totalMinor={totalMinor} currency={currency} />
              </View>
            </Animated.View>
          ) : null}

          {step === 2 ? (
            <Animated.View entering={FadeIn.duration(250)} style={{ gap: 14 }}>
              <Text style={styles.h}>{t('cart.stepPayment')}</Text>
              <View style={styles.card}>
                <View style={styles.payRow}>
                  <View style={styles.payIcon}><Ionicons name="card" size={20} color={colors.brandDark} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.payTitle}>{t('cart.payWithPaystack')}</Text>
                    <Text style={styles.paySub}>{t('cart.paystackSub')}</Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                </View>
              </View>
              <View style={styles.card}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>{t('cart.totalToPay')} {vendorName}</Text>
                  <Text style={styles.totalValue}>{formatMoney(totalMinor, currency)}</Text>
                </View>
                <Text style={styles.payNote}>{t('cart.paystackScreenNote')}</Text>
              </View>
              {remainingVendors > 0 ? (
                <View style={styles.multiNote}>
                  <Ionicons name="information-circle" size={17} color={colors.blueDark} />
                  <Text style={styles.multiNoteText}>
                    {t('cart.afterThisPre')} {remainingVendors}{' '}
                    {remainingVendors === 1 ? t('cart.moreVendorSingular') : t('cart.moreVendorPlural')}{' '}
                    {t('cart.afterThisPost')}
                  </Text>
                </View>
              ) : null}
            </Animated.View>
          ) : null}
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 14) }]}>
          {step > 0 ? (
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(step - 1)}>
              <Ionicons name="chevron-back" size={18} color={colors.ink} />
              <Text style={styles.backText}>{t('cart.back')}</Text>
            </TouchableOpacity>
          ) : null}
          {step < 2 ? (
            <PrimaryButton title={t('cart.continue')} variant="black" onPress={next} style={{ flex: 1 }} />
          ) : (
            <PrimaryButton title={`${t('cart.pay')} ${formatMoney(totalMinor, currency)}`} loading={placeOrder.isPending} onPress={() => placeOrder.mutate()} style={{ flex: 1 }} />
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    empty: { fontSize: 15, color: colors.inkSoft },
    steps: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 10 },
    stepItem: { flexDirection: 'row', alignItems: 'center' },
    stepDot: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
    stepDotActive: { backgroundColor: colors.brandDark },
    stepDotDone: { backgroundColor: colors.success },
    stepNum: { fontSize: 12, fontWeight: '800', color: colors.inkSoft },
    stepLabel: { fontSize: 12, color: colors.inkFaint, fontWeight: '600', marginLeft: 6 },
    stepLabelActive: { color: colors.ink, fontWeight: '800' },
    stepBar: { width: 22, height: 2, backgroundColor: colors.surfaceAlt, marginHorizontal: 8 },
    stepBarDone: { backgroundColor: colors.success },
    h: { fontSize: 18, fontWeight: '800', color: colors.ink },
    label: { fontSize: 12.5, fontWeight: '700', color: colors.inkSoft, marginBottom: 6 },
    input: { backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: 14, height: 50, fontSize: 15, color: colors.ink },
    multiline: { height: 80, paddingTop: 14, textAlignVertical: 'top' },
    card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, ...shadow },
    cardTitle: { fontSize: 12, fontWeight: '800', color: colors.inkSoft, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 },
    addrName: { fontSize: 15, fontWeight: '700', color: colors.ink },
    addrLine: { fontSize: 13.5, color: colors.inkSoft, marginTop: 2 },
    addrNote: { fontSize: 13, color: colors.inkSoft, fontStyle: 'italic', marginTop: 4 },
    editLink: { fontSize: 13, color: colors.blueDark, fontWeight: '700', marginTop: 8 },
    itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 7 },
    itemImg: { width: 46, height: 46, borderRadius: 12, backgroundColor: colors.surfaceAlt },
    itemTitle: { fontSize: 14, fontWeight: '600', color: colors.ink },
    itemQty: { fontSize: 12, color: colors.inkSoft, marginTop: 2 },
    itemPrice: { fontSize: 14, fontWeight: '700', color: colors.accentDark },
    payRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    payIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.brandLight, alignItems: 'center', justifyContent: 'center' },
    payTitle: { fontSize: 14.5, fontWeight: '700', color: colors.ink },
    paySub: { fontSize: 12, color: colors.inkSoft, marginTop: 2 },
    totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    totalLabel: { fontSize: 14, color: colors.inkSoft, fontWeight: '600' },
    totalValue: { fontSize: 20, fontWeight: '800', color: colors.ink },
    payNote: { fontSize: 12, color: colors.inkFaint, marginTop: 8 },
    multiNote: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.blueLight, borderRadius: radius.md, padding: 12 },
    multiNoteText: { flex: 1, fontSize: 12.5, color: colors.blueDark, fontWeight: '600', lineHeight: 18 },
    footer: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.surfaceAlt, backgroundColor: colors.card },
    backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 8, height: 50 },
    backText: { fontSize: 14, fontWeight: '700', color: colors.ink },
  });
