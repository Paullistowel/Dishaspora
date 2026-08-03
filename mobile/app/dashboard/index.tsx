import React, { useMemo, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '@/api';
import PrimaryButton from '@/components/PrimaryButton';
import ScreenHeader from '@/components/ScreenHeader';
import SegmentChips from '@/components/SegmentChips';
import { Skeleton } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';
import { IMG } from '@/config';
import { formatMoney } from '@/money';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';
import { shadow, type ThemeColors } from '@/theme';
import type { Listing, Order, OrderStatus, Page, Recipe, Vendor } from '@/types';

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  PAID: 'PREPARING',
  PREPARING: 'READY',
  READY: 'COMPLETED',
};

export default function VendorDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  // Store the tab index (stable) not the localized label, so language switches
  // don't break the active-segment comparison.
  const [segIndex, setSegIndex] = useState(0);
  const SEGMENTS = [t('dashboard.recipes'), t('dashboard.listings'), t('dashboard.orders')];

  const vendor = useQuery({
    queryKey: ['vendor-me'],
    queryFn: () => api.get<Vendor>('/vendors/me'),
  });
  const vendorId = vendor.data?.id;

  // No dedicated "my recipes" endpoint in the contract — filter public recipes by vendor.
  const recipes = useQuery({
    queryKey: ['vendor-recipes', vendorId],
    queryFn: () => api.get<Page<Recipe>>('/recipes', { page: 0, size: 100 }),
    enabled: !!vendorId,
  });
  const myRecipes = (recipes.data?.content ?? []).filter((r) => r.vendorId === vendorId);

  const listings = useQuery({
    queryKey: ['vendor-listings', vendorId],
    queryFn: () => api.get<Listing[]>(`/vendors/${vendorId}/listings`),
    enabled: !!vendorId,
  });

  const orders = useQuery({
    queryKey: ['vendor-orders'],
    queryFn: () => api.get<Order[]>('/vendor/orders'),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: OrderStatus }) =>
      api.put<Order>(`/vendor/orders/${id}/status`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vendor-orders'] }),
    onError: () => Alert.alert(t('dashboard.updateFailed'), t('dashboard.updateStatusError')),
  });

  const v = vendor.data;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top + 6 }}>
      <ScreenHeader title={t('dashboard.vendorDashboard')} />
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 80 }}
        refreshControl={
          <RefreshControl
            refreshing={vendor.isRefetching}
            onRefresh={() => queryClient.invalidateQueries()}
            tintColor={colors.brandDark}
          />
        }
      >
        {vendor.isLoading ? (
          <Skeleton height={80} radius={20} />
        ) : v ? (
          <>
            {v.status !== 'APPROVED' ? (
              <View
                style={[
                  styles.statusBanner,
                  v.status === 'REJECTED' ? styles.rejected : styles.pending,
                ]}
              >
                <Ionicons
                  name={v.status === 'REJECTED' ? 'close-circle' : 'time'}
                  size={20}
                  color={v.status === 'REJECTED' ? colors.danger : colors.accentDark}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.statusTitle}>
                    {v.status === 'REJECTED'
                      ? t('dashboard.applicationRejected')
                      : t('dashboard.pendingReview')}
                  </Text>
                  <Text style={styles.statusSub}>
                    {v.status === 'REJECTED'
                      ? v.rejectionFeedback ?? t('dashboard.rejectedFeedbackFallback')
                      : t('dashboard.pendingReviewSub')}
                  </Text>
                </View>
              </View>
            ) : null}

            <View style={styles.vendorHead}>
              <Text style={styles.vendorName}>{v.name}</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={13} color={colors.star} />
                <Text style={styles.ratingText}>
                  {v.rating.toFixed(1)} ({v.reviewCount}+) · {v.location}
                </Text>
              </View>
            </View>

            <View style={styles.ctaRow}>
              <PrimaryButton
                title={t('dashboard.uploadRecipe')}
                small
                onPress={() => router.push('/dashboard/recipe-form')}
                style={{ flex: 1 }}
              />
              <PrimaryButton
                title={t('dashboard.addListing')}
                small
                variant="outline"
                onPress={() => router.push('/dashboard/listing-form')}
                style={{ flex: 1 }}
              />
            </View>

            <SegmentChips
              segments={SEGMENTS}
              value={SEGMENTS[segIndex]}
              onChange={(val) => setSegIndex(Math.max(0, SEGMENTS.indexOf(val)))}
              style={{ marginTop: 18, marginBottom: 16 }}
            />

            {segIndex === 0 ? (
              myRecipes.length === 0 ? (
                <EmptyState
                  image={1}
                  message={t('dashboard.noRecipesYet')}
                  actionLabel={t('dashboard.uploadARecipe')}
                  onAction={() => router.push('/dashboard/recipe-form')}
                />
              ) : (
                <View style={{ gap: 12 }}>
                  {myRecipes.map((recipe, i) => (
                    <Animated.View key={recipe.id} entering={FadeInDown.delay(i * 50)}>
                      <TouchableOpacity
                        style={styles.rowCard}
                        onPress={() =>
                          router.push({ pathname: '/recipe/[id]', params: { id: String(recipe.id) } })
                        }
                      >
                        <Image source={{ uri: IMG(recipe.imageUrl) }} style={styles.rowImg} contentFit="cover" />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.rowTitle}>{recipe.title}</Text>
                          <Text style={styles.rowSub}>
                            {recipe.cuisine} · {recipe.calories} kcal · {recipe.reviewCount} {t('dashboard.reviews')}
                          </Text>
                        </View>
                        <StatusPill status={recipe.status} />
                      </TouchableOpacity>
                    </Animated.View>
                  ))}
                </View>
              )
            ) : segIndex === 1 ? (
              (listings.data ?? []).length === 0 ? (
                <EmptyState
                  image={2}
                  message={t('dashboard.noListingsYet')}
                  actionLabel={t('dashboard.addAListing')}
                  onAction={() => router.push('/dashboard/listing-form')}
                />
              ) : (
                <View style={{ gap: 12 }}>
                  {(listings.data ?? []).map((listing, i) => (
                    <Animated.View key={listing.id} entering={FadeInDown.delay(i * 50)}>
                      <View style={styles.rowCard}>
                        <Image source={{ uri: IMG(listing.imageUrl) }} style={styles.rowImg} contentFit="cover" />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.rowTitle}>{listing.title}</Text>
                          <Text style={styles.rowSub}>
                            {formatMoney(listing.amountMinor, listing.currency)} ·{' '}
                            {listing.available
                              ? `${listing.stockQty} ${t('dashboard.inStock')}`
                              : t('dashboard.unavailable')}
                          </Text>
                        </View>
                        <StatusPill status={listing.status} />
                      </View>
                    </Animated.View>
                  ))}
                </View>
              )
            ) : (orders.data ?? []).length === 0 ? (
              <EmptyState image={3} message={t('dashboard.noOrdersYet')} />
            ) : (
              <View style={{ gap: 12 }}>
                {(orders.data ?? []).map((order, i) => {
                  const next = NEXT_STATUS[order.status];
                  return (
                    <Animated.View key={order.id} entering={FadeInDown.delay(i * 50)}>
                      <View style={styles.orderCard}>
                        <View style={styles.orderTop}>
                          <Text style={styles.rowTitle}>{order.reference}</Text>
                          <Text style={styles.orderTotal}>
                            {formatMoney(order.totalMinor, order.currency)}
                          </Text>
                        </View>
                        <Text style={styles.rowSub}>
                          {order.items.map((it) => `${it.qty}x ${it.title}`).join(', ')}
                        </Text>
                        <View style={styles.orderBottom}>
                          <StatusPill status={order.status} />
                          {next ? (
                            <PrimaryButton
                              title={`${t('dashboard.mark')} ${next.toLowerCase()}`}
                              small
                              loading={updateStatus.isPending}
                              onPress={() => updateStatus.mutate({ id: order.id, status: next })}
                            />
                          ) : null}
                        </View>
                      </View>
                    </Animated.View>
                  );
                })}
              </View>
            )}
          </>
        ) : (
          <EmptyState image={1} message={t('dashboard.couldNotLoadVendor')} />
        )}
      </ScrollView>
    </View>
  );
}

function StatusPill({ status }: { status: string }) {
  const { colors } = useTheme();
  const map: Record<string, { bg: string; fg: string }> = {
    APPROVED: { bg: '#E7F8EF', fg: colors.success },
    PENDING: { bg: colors.accentLight, fg: colors.accentDark },
    REJECTED: { bg: '#FDECEC', fg: colors.danger },
    PENDING_PAYMENT: { bg: colors.accentLight, fg: colors.accentDark },
    PAID: { bg: colors.blueLight, fg: colors.blueDark },
    PREPARING: { bg: colors.accentLight, fg: colors.accentDark },
    READY: { bg: colors.brandLight, fg: colors.brandDark },
    COMPLETED: { bg: '#E7F8EF', fg: colors.success },
    CANCELLED: { bg: '#FDECEC', fg: colors.danger },
  };
  const c = map[status] ?? { bg: colors.surfaceAlt, fg: colors.inkSoft };
  return (
    <View style={[pillStyles.pill, { backgroundColor: c.bg }]}>
      <Text style={[pillStyles.text, { color: c.fg }]}>{status.replace('_', ' ')}</Text>
    </View>
  );
}

const pillStyles = StyleSheet.create({
  pill: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  text: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
});

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    statusBanner: {
      flexDirection: 'row',
      gap: 12,
      borderRadius: 20,
      padding: 16,
      marginBottom: 16,
      alignItems: 'center',
    },
    pending: { backgroundColor: colors.accentLight },
    rejected: { backgroundColor: '#FDECEC' },
    statusTitle: { fontSize: 14, fontWeight: '700', color: colors.ink },
    statusSub: { fontSize: 12.5, color: colors.inkSoft, marginTop: 2, lineHeight: 17 },
    vendorHead: { marginBottom: 14 },
    vendorName: { fontSize: 20, fontWeight: '800', color: colors.ink },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    ratingText: { fontSize: 12.5, color: colors.inkSoft },
    ctaRow: { flexDirection: 'row', gap: 10 },
    rowCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 10,
      ...shadow,
    },
    rowImg: { width: 54, height: 54, borderRadius: 14, backgroundColor: colors.surfaceAlt },
    rowTitle: { fontSize: 14, fontWeight: '700', color: colors.ink },
    rowSub: { fontSize: 12, color: colors.inkSoft, marginTop: 2 },
    orderCard: {
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 14,
      gap: 8,
      ...shadow,
    },
    orderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    orderTotal: { fontSize: 14, fontWeight: '800', color: colors.ink },
    orderBottom: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 4,
    },
  });
