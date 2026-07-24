import React, { useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '@/api';
import { IMG } from '@/config';
import Avatar from '@/components/Avatar';
import Price from '@/components/Price';
import RatingStars from '@/components/RatingStars';
import { Skeleton } from '@/components/Skeleton';
import { ErrorView } from '@/components/StatusViews';
import ScreenHeader from '@/components/ScreenHeader';
import { useCart } from '@/context/CartContext';
import { formatMoney } from '@/money';
import { colors, radius, shadow, shadowStrong } from '@/theme';
import type { Listing, Recipe, Review, Vendor } from '@/types';

export default function ListingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cart = useCart();
  const [qty, setQty] = useState(1);
  const [confirm, setConfirm] = useState(false);

  const listing = useQuery({
    queryKey: ['listing', id],
    queryFn: () => api.get<Listing>(`/listings/${id}`),
  });
  const l = listing.data;

  const vendor = useQuery({
    queryKey: ['vendor', l?.vendorId],
    queryFn: () => api.get<Vendor>(`/vendors/${l!.vendorId}`),
    enabled: !!l?.vendorId,
  });
  const reviews = useQuery({
    queryKey: ['vendor', l?.vendorId, 'reviews'],
    queryFn: () => api.get<Review[]>(`/vendors/${l!.vendorId}/reviews`),
    enabled: !!l?.vendorId,
  });
  // Meals (FOOD listings) linked to a recipe carry nutrition on that recipe.
  const recipe = useQuery({
    queryKey: ['recipe', l?.linkedRecipeId],
    queryFn: () => api.get<Recipe>(`/recipes/${l!.linkedRecipeId}`),
    enabled: !!l?.linkedRecipeId,
  });

  const addToCart = (): boolean => {
    if (!l) return false;
    const res = cart.add(l, qty);
    if (res === 'different-vendor') {
      // Different vendor — ask before replacing (single-vendor cart rule).
      return false;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    return true;
  };

  const onAddToCart = () => {
    if (addToCart()) setConfirm(true);
    else replacePrompt();
  };
  const onBuyNow = () => {
    if (addToCart()) router.push('/cart');
    else replacePrompt();
  };
  const replacePrompt = () => {
    Alert.alert(
      'Start a new cart?',
      `Your cart has items from ${cart.vendorName}. Only one vendor per order — replace it with ${l?.vendorName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Replace',
          style: 'destructive',
          onPress: () => {
            if (l) cart.replaceWith(l, qty);
            setConfirm(true);
          },
        },
      ]
    );
  };

  if (listing.isError || (!listing.isLoading && !l)) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top + 6 }}>
        <ScreenHeader title="Product" />
        <ErrorView
          message="We couldn't load this item. Check your connection and try again."
          onRetry={() => listing.refetch()}
        />
      </View>
    );
  }

  if (listing.isLoading || !l) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
        <Skeleton height={320} radius={0} />
        <View style={{ padding: 20, gap: 12 }}>
          <Skeleton height={28} width={220} />
          <Skeleton height={18} width={140} />
          <Skeleton height={80} />
        </View>
      </View>
    );
  }

  const unitLabel = l.type === 'INGREDIENT' && l.quantity ? `${l.quantity} ${l.unit}` : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 110 }} showsVerticalScrollIndicator={false}>
        {/* Hero image */}
        <View>
          <Image source={{ uri: IMG(l.imageUrl) }} style={styles.hero} contentFit="cover" />
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { top: insets.top + 6 }]}>
            <Ionicons name="chevron-back" size={24} color={colors.ink} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/cart')} style={[styles.cartBtn, { top: insets.top + 6 }]}>
            <Ionicons name="cart-outline" size={22} color={colors.ink} />
            {cart.count > 0 ? <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{cart.count}</Text></View> : null}
          </TouchableOpacity>
          {!l.available ? <View style={styles.soldOut}><Text style={styles.soldOutText}>Out of stock</Text></View> : null}
        </View>

        <Animated.View entering={FadeInDown.duration(350)} style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{l.title}</Text>
            <Price amountMinor={l.amountMinor} currency={l.currency} compareAtMinor={l.compareAtMinor} />
          </View>
          {unitLabel ? <Text style={styles.unit}>{unitLabel}</Text> : null}

          {/* Vendor + rating */}
          <TouchableOpacity style={styles.vendorRow} onPress={() => router.push({ pathname: '/vendor/[id]', params: { id: String(l.vendorId) } })}>
            <Avatar url={l.vendorLogoUrl} name={l.vendorName} size={38} square />
            <View style={{ flex: 1 }}>
              <Text style={styles.vendorName}>{l.vendorName}</Text>
              {vendor.data ? (
                <View style={styles.ratingRow}>
                  <RatingStars rating={vendor.data.rating} size={12} />
                  <Text style={styles.ratingText}>{vendor.data.rating.toFixed(1)} · {vendor.data.reviewCount} reviews</Text>
                </View>
              ) : null}
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.inkFaint} />
          </TouchableOpacity>

          {l.description ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.desc}>{l.description}</Text>
            </View>
          ) : null}

          {/* Nutrition for meals (from the linked recipe) */}
          {recipe.data ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Nutrition · per serving</Text>
              <View style={styles.macroRow}>
                <Macro label="Calories" value={recipe.data.calories} unit="kcal" />
                <Macro label="Prep" value={recipe.data.prepMinutes + recipe.data.cookMinutes} unit="min" />
                <Macro label="Serves" value={recipe.data.servings} unit="" />
              </View>
              <TouchableOpacity onPress={() => router.push({ pathname: '/recipe/[id]', params: { id: String(recipe.data!.id) } })}>
                <Text style={styles.recipeLink}>View full recipe →</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Reviews */}
          {(reviews.data ?? []).length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ratings & reviews</Text>
              {(reviews.data ?? []).slice(0, 3).map((rv) => (
                <View key={rv.id} style={styles.reviewRow}>
                  <Avatar url={rv.userAvatarUrl} name={rv.userName} size={34} />
                  <View style={{ flex: 1 }}>
                    <View style={styles.reviewHead}>
                      <Text style={styles.reviewName}>{rv.userName}</Text>
                      <RatingStars rating={rv.rating} size={11} />
                    </View>
                    {rv.comment ? <Text style={styles.reviewComment}>{rv.comment}</Text> : null}
                  </View>
                </View>
              ))}
            </View>
          ) : null}
        </Animated.View>
      </ScrollView>

      {/* Sticky purchase bar */}
      <View style={[styles.buyBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.qtyStepper}>
          <TouchableOpacity onPress={() => setQty((q) => Math.max(1, q - 1))} style={styles.qtyBtn}><Ionicons name="remove" size={18} color={colors.ink} /></TouchableOpacity>
          <Text style={styles.qtyVal}>{qty}</Text>
          <TouchableOpacity onPress={() => setQty((q) => q + 1)} style={styles.qtyBtn}><Ionicons name="add" size={18} color={colors.ink} /></TouchableOpacity>
        </View>
        <TouchableOpacity style={[styles.addBtn, !l.available && { opacity: 0.5 }]} disabled={!l.available} onPress={onAddToCart}>
          <Ionicons name="cart" size={18} color="#FFF" />
          <Text style={styles.addBtnText}>Add · {formatMoney(l.amountMinor * qty, l.currency)}</Text>
        </TouchableOpacity>
      </View>

      {/* Add-to-cart confirmation */}
      <Modal visible={confirm} transparent animationType="fade" onRequestClose={() => setConfirm(false)}>
        <View style={styles.modalBackdrop}>
          <Animated.View entering={FadeInUp.springify().damping(15)} style={styles.modalCard}>
            <View style={styles.modalCheck}><Ionicons name="checkmark" size={30} color="#FFF" /></View>
            <Text style={styles.modalTitle}>Added to cart</Text>
            <Text style={styles.modalSub}>{qty} × {l.title}</Text>
            <TouchableOpacity style={styles.modalPrimary} onPress={() => { setConfirm(false); router.push('/cart'); }}>
              <Text style={styles.modalPrimaryText}>View cart ({cart.count})</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalGhost} onPress={() => { setConfirm(false); router.back(); }}>
              <Text style={styles.modalGhostText}>Continue shopping</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

function Macro({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <View style={styles.macro}>
      <Text style={styles.macroV}>{value}{unit ? <Text style={styles.macroU}> {unit}</Text> : null}</Text>
      <Text style={styles.macroL}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { width: '100%', height: 320, backgroundColor: colors.surfaceAlt },
  backBtn: { position: 'absolute', left: 16, width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center', ...shadow },
  cartBtn: { position: 'absolute', right: 16, width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center', ...shadow },
  cartBadge: { position: 'absolute', top: -2, right: -2, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  cartBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  soldOut: { position: 'absolute', bottom: 12, left: 16, backgroundColor: colors.danger, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  soldOutText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  body: { padding: 20, gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  title: { flex: 1, fontSize: 22, fontWeight: '800', color: colors.ink },
  unit: { fontSize: 13, color: colors.inkSoft, marginTop: 2 },
  vendorRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: radius.md, padding: 12, marginTop: 14 },
  vendorName: { fontSize: 14.5, fontWeight: '700', color: colors.ink },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  ratingText: { fontSize: 12, color: colors.inkSoft },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: colors.inkSoft, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 },
  desc: { fontSize: 14, color: colors.ink, lineHeight: 21 },
  macroRow: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.md, padding: 16 },
  macro: { flex: 1, alignItems: 'center' },
  macroV: { fontSize: 18, fontWeight: '800', color: colors.ink },
  macroU: { fontSize: 12, color: colors.inkFaint, fontWeight: '600' },
  macroL: { fontSize: 11.5, color: colors.inkSoft, marginTop: 3 },
  recipeLink: { fontSize: 13, color: colors.brandDark, fontWeight: '700', marginTop: 10 },
  reviewRow: { flexDirection: 'row', gap: 10, paddingVertical: 8 },
  reviewHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reviewName: { fontSize: 13.5, fontWeight: '700', color: colors.ink },
  reviewComment: { fontSize: 13, color: colors.inkSoft, marginTop: 2, lineHeight: 19 },
  buyBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 12, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: colors.surfaceAlt, ...shadowStrong },
  qtyStepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 999 },
  qtyBtn: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' },
  qtyVal: { fontSize: 16, fontWeight: '800', color: colors.ink, minWidth: 22, textAlign: 'center' },
  addBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: 999, backgroundColor: colors.accent },
  addBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 32 },
  modalCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 26, alignItems: 'center', alignSelf: 'stretch' },
  modalCheck: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 19, fontWeight: '800', color: colors.ink, marginTop: 14 },
  modalSub: { fontSize: 13.5, color: colors.inkSoft, marginTop: 4, textAlign: 'center' },
  modalPrimary: { alignSelf: 'stretch', backgroundColor: colors.accent, borderRadius: 999, height: 50, alignItems: 'center', justifyContent: 'center', marginTop: 22 },
  modalPrimaryText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  modalGhost: { alignSelf: 'stretch', height: 48, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  modalGhostText: { color: colors.ink, fontSize: 14, fontWeight: '600' },
});
