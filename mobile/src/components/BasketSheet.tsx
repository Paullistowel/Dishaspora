import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import Animated, { FadeInDown, SlideInDown } from 'react-native-reanimated';
import { api } from '@/api';
import { IMG } from '@/config';
import { useCart } from '@/context/CartContext';
import { formatMoney } from '@/money';
import { colors, shadowStrong } from '@/theme';
import type { Basket } from '@/types';
import Avatar from './Avatar';
import PrimaryButton from './PrimaryButton';
import { Skeleton } from './Skeleton';

/** One-Click Ingredient Basket bottom sheet (GET /recipes/{id}/basket). */
export default function BasketSheet({
  recipeId,
  visible,
  onClose,
}: {
  recipeId: number;
  visible: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const cart = useCart();
  const basket = useQuery({
    queryKey: ['basket', recipeId],
    queryFn: () => api.get<Basket>(`/recipes/${recipeId}/basket`),
    enabled: visible,
  });

  const data = basket.data;

  // Per-ingredient selection: every matched item starts selected at its
  // recipe-required quantity; the user can uncheck items or adjust quantities
  // before adding, and the total reflects only what's selected.
  const [sel, setSel] = useState<Record<number, { selected: boolean; qty: number }>>({});

  useEffect(() => {
    if (!data) return;
    setSel((prev) => {
      const next: Record<number, { selected: boolean; qty: number }> = {};
      for (const it of data.items) {
        next[it.listing.id] = prev[it.listing.id] ?? { selected: true, qty: Math.max(1, it.qty) };
      }
      return next;
    });
  }, [data]);

  const toggle = (id: number) =>
    setSel((s) => ({ ...s, [id]: { ...s[id], selected: !s[id]?.selected } }));

  const bump = (id: number, delta: number, max: number) =>
    setSel((s) => {
      const cur = s[id] ?? { selected: true, qty: 1 };
      const cap = max > 0 ? max : Infinity;
      const qty = Math.min(cap, Math.max(1, cur.qty + delta));
      return { ...s, [id]: { ...cur, qty } };
    });

  const selectedRows = useMemo(() => {
    if (!data) return [];
    return data.items
      .filter((it) => sel[it.listing.id]?.selected)
      .map((it) => ({ listing: it.listing, qty: sel[it.listing.id]?.qty ?? it.qty }));
  }, [data, sel]);

  const selectedTotalMinor = useMemo(
    () => selectedRows.reduce((n, r) => n + r.listing.amountMinor * r.qty, 0),
    [selectedRows]
  );

  const addSelected = () => {
    if (selectedRows.length === 0) return;
    // Ingredients merge into the cart alongside anything already there (any vendor).
    cart.addAll(selectedRows);
    onClose();
    router.push('/cart');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} />
        <Animated.View entering={SlideInDown.springify().damping(18)} style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Ingredient Basket</Text>
          {basket.isLoading ? (
            <View style={{ gap: 12, marginTop: 12 }}>
              <Skeleton height={52} radius={16} />
              <Skeleton height={52} radius={16} />
              <Skeleton height={52} radius={16} />
            </View>
          ) : !data || !data.vendor || data.items.length === 0 ? (
            <Text style={styles.emptyText}>
              No ingredient vendor near you stocks these items yet. Check the market for
              individual ingredients.
            </Text>
          ) : (
            <>
              <View style={styles.vendorRow}>
                <Avatar url={data.vendor.logoUrl} name={data.vendor.name} size={38} square />
                <View style={{ flex: 1 }}>
                  <Text style={styles.vendorName}>{data.vendor.name}</Text>
                  <Text style={styles.vendorMeta}>
                    {data.vendor.location} · matches {data.items.length} of{' '}
                    {data.items.length + data.unmatched.length} ingredients
                  </Text>
                </View>
              </View>
              <Text style={styles.selectHint}>Select the ingredients you need and adjust quantities.</Text>
              <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false}>
                {data.items.map((item, i) => {
                  const state = sel[item.listing.id] ?? { selected: true, qty: item.qty };
                  const on = state.selected;
                  return (
                    <Animated.View
                      key={`${item.listing.id}-${i}`}
                      entering={FadeInDown.delay(i * 40)}
                      style={[styles.itemRow, !on && { opacity: 0.5 }]}
                    >
                      <TouchableOpacity
                        onPress={() => toggle(item.listing.id)}
                        hitSlop={8}
                        style={[styles.checkbox, on && styles.checkboxOn]}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: on }}
                        accessibilityLabel={item.ingredient.name}
                      >
                        {on ? <Ionicons name="checkmark" size={13} color="#FFFFFF" /> : null}
                      </TouchableOpacity>
                      <Image
                        source={{ uri: IMG(item.listing.imageUrl) }}
                        style={styles.itemImg}
                        contentFit="cover"
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemName}>{item.ingredient.name}</Text>
                        <Text style={styles.itemSub}>
                          {item.listing.title} · {item.listing.quantity} {item.listing.unit}
                        </Text>
                      </View>
                      {on ? (
                        <View style={styles.stepper}>
                          <TouchableOpacity
                            onPress={() => bump(item.listing.id, -1, item.listing.stockQty)}
                            disabled={state.qty <= 1}
                            style={[styles.stepBtn, state.qty <= 1 && styles.stepBtnOff]}
                            accessibilityLabel={`Less ${item.ingredient.name}`}
                          >
                            <Ionicons name="remove" size={15} color={colors.brandDark} />
                          </TouchableOpacity>
                          <Text style={styles.stepQty}>{state.qty}</Text>
                          <TouchableOpacity
                            onPress={() => bump(item.listing.id, 1, item.listing.stockQty)}
                            style={styles.stepBtn}
                            accessibilityLabel={`More ${item.ingredient.name}`}
                          >
                            <Ionicons name="add" size={15} color={colors.brandDark} />
                          </TouchableOpacity>
                        </View>
                      ) : null}
                      <Text style={styles.itemPrice}>
                        {formatMoney(item.listing.amountMinor * state.qty, item.listing.currency)}
                      </Text>
                    </Animated.View>
                  );
                })}
                {data.unmatched.map((ingredient, i) => (
                  <View key={`u-${i}`} style={[styles.itemRow, { opacity: 0.45 }]}>
                    <View style={[styles.itemImg, styles.unmatchedImg]}>
                      <Ionicons name="close" size={16} color={colors.inkFaint} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemName}>{ingredient.name}</Text>
                      <Text style={styles.itemSub}>not available nearby</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>
                  Total · {selectedRows.length} item{selectedRows.length === 1 ? '' : 's'}
                </Text>
                <Text style={styles.totalValue}>
                  {formatMoney(selectedTotalMinor, data.currency)}
                </Text>
              </View>
              <PrimaryButton
                title={selectedRows.length === 0 ? 'Select ingredients' : `Add ${selectedRows.length} to cart`}
                onPress={addSelected}
                disabled={selectedRows.length === 0}
              />
            </>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(23,37,42,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 34,
    ...shadowStrong,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.surfaceAlt,
    marginBottom: 14,
  },
  title: { fontSize: 18, fontWeight: '700', color: colors.ink },
  emptyText: { fontSize: 13.5, color: colors.inkSoft, marginTop: 12, lineHeight: 20 },
  selectHint: { fontSize: 12, color: colors.inkSoft, marginBottom: 4 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.inkFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: colors.brandDark, borderColor: colors.brandDark },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.brandLight,
    borderRadius: 12,
    padding: 3,
  },
  stepBtn: {
    width: 26,
    height: 26,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnOff: { opacity: 0.35 },
  stepQty: { minWidth: 20, textAlign: 'center', fontSize: 13, fontWeight: '800', color: colors.brandDark },
  vendorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.brandLight,
    borderRadius: 16,
    padding: 12,
    marginVertical: 14,
  },
  vendorName: { fontSize: 14, fontWeight: '700', color: colors.ink },
  vendorMeta: { fontSize: 11.5, color: colors.inkSoft, marginTop: 1 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  itemImg: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
  },
  unmatchedImg: { alignItems: 'center', justifyContent: 'center' },
  itemName: { fontSize: 13.5, fontWeight: '600', color: colors.ink },
  itemSub: { fontSize: 11.5, color: colors.inkFaint, marginTop: 1 },
  itemPrice: { fontSize: 13, fontWeight: '700', color: colors.accentDark },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderColor: colors.surfaceAlt,
    marginTop: 6,
    marginBottom: 8,
  },
  totalLabel: { fontSize: 15, fontWeight: '700', color: colors.ink },
  totalValue: { fontSize: 16, fontWeight: '800', color: colors.ink },
});
