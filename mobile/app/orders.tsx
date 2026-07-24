import React, { useMemo, useState } from 'react';
import {
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
import { api, ApiError } from '@/api';
import EmptyState from '@/components/EmptyState';
import ScreenHeader from '@/components/ScreenHeader';
import SegmentChips from '@/components/SegmentChips';
import { Skeleton } from '@/components/Skeleton';
import { IMG } from '@/config';
import { useToast } from '@/context/ToastContext';
import { formatMoney } from '@/money';
import { colors, shadow } from '@/theme';
import type { Order, OrderStatus } from '@/types';

const STATUS_COLORS: Record<OrderStatus, { bg: string; fg: string }> = {
  PENDING_PAYMENT: { bg: colors.accentLight, fg: colors.accentDark },
  PAID: { bg: colors.blueLight, fg: colors.blueDark },
  PREPARING: { bg: colors.accentLight, fg: colors.accentDark },
  READY: { bg: colors.brandLight, fg: colors.brandDark },
  COMPLETED: { bg: '#E7F8EF', fg: colors.success },
  CANCELLED: { bg: '#FDECEC', fg: colors.danger },
};

const DAYS = ['Mon', 'Tue', 'Wed', 'Thr', 'Fri', 'Sat', 'Sun'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function dayKey(iso?: string | null) {
  // Fall back to today for any order missing a timestamp so grouping never crashes.
  return (iso ?? new Date().toISOString()).slice(0, 10);
}

function prettyDay(key: string) {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (key === today) return 'Today';
  if (key === yesterday) return 'Yesterday';
  const d = new Date(key + 'T00:00:00');
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function OrderCard({
  order,
  onConfirm,
  confirming,
}: {
  order: Order;
  onConfirm: (order: Order) => void;
  confirming: boolean;
}) {
  const sc = STATUS_COLORS[order.status];
  const pending = order.status === 'PENDING_PAYMENT';
  return (
    <View style={styles.orderCard}>
      <View style={styles.orderTop}>
        <Text style={styles.orderVendor}>{order.vendorName}</Text>
        <View style={[styles.statusPill, { backgroundColor: sc.bg }]}>
          <Text style={[styles.statusText, { color: sc.fg }]}>
            {order.status.replace('_', ' ')}
          </Text>
        </View>
      </View>
      <View style={styles.orderItems}>
        {order.items.slice(0, 3).map((item) => (
          <Image
            key={item.listingId}
            source={{ uri: IMG(item.imageUrl) }}
            style={styles.itemThumb}
            contentFit="cover"
          />
        ))}
        <View style={{ flex: 1 }}>
          <Text style={styles.itemsLabel} numberOfLines={1}>
            {order.items.map((i) => i.title).join(', ')}
          </Text>
          <Text style={styles.orderRef}>{order.reference}</Text>
        </View>
        <Text style={styles.orderTotal}>{formatMoney(order.totalMinor, order.currency)}</Text>
      </View>
      {pending ? (
        <TouchableOpacity
          style={styles.confirmBtn}
          onPress={() => onConfirm(order)}
          disabled={confirming}
          accessibilityRole="button"
          accessibilityLabel={`Confirm payment for order ${order.reference}`}
        >
          <Ionicons name="refresh" size={14} color={colors.accentDark} />
          <Text style={styles.confirmText}>
            {confirming ? 'Checking…' : "Already paid? Confirm payment"}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export default function Orders() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [segment, setSegment] = useState('List');
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const orders = useQuery({
    queryKey: ['orders'],
    queryFn: () => api.get<Order[]>('/orders'),
  });

  // Re-verify a pending order in case the charge went through but the app never
  // saw the confirmation (network blip, app closed mid-payment). Never charges —
  // it only syncs status with Paystack via the backend.
  const confirmPayment = useMutation({
    mutationFn: (order: Order) =>
      api.post<Order>(`/orders/${order.id}/verify`, { reference: order.reference }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      if (updated.status === 'PENDING_PAYMENT') {
        toast.info('No completed payment found for this order yet.');
      } else {
        toast.success('Payment confirmed — your order is on its way.');
      }
    },
    onError: (e) =>
      toast.error(
        e instanceof ApiError
          ? e.message
          : "We couldn't confirm this payment. If you paid, try again shortly."
      ),
  });
  const confirmingId = confirmPayment.isPending ? confirmPayment.variables?.id : undefined;

  const grouped = useMemo(() => {
    const map = new Map<string, Order[]>();
    for (const order of orders.data ?? []) {
      const key = dayKey(order.createdAt);
      map.set(key, [...(map.get(key) ?? []), order]);
    }
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [orders.data]);

  // calendar month math
  const monthDate = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  }, [monthOffset]);
  const weeks = useMemo(() => {
    const first = new Date(monthDate);
    const startDow = (first.getDay() + 6) % 7; // Monday = 0
    const start = new Date(first);
    start.setDate(first.getDate() - startDow);
    const out: Date[][] = [];
    for (let w = 0; w < 6; w++) {
      const row: Date[] = [];
      for (let d = 0; d < 7; d++) {
        const day = new Date(start);
        day.setDate(start.getDate() + w * 7 + d);
        row.push(day);
      }
      out.push(row);
    }
    return out;
  }, [monthDate]);
  const orderDates = useMemo(
    () => new Set((orders.data ?? []).map((o) => dayKey(o.createdAt))),
    [orders.data]
  );
  const selectedOrders = selectedDate
    ? (orders.data ?? []).filter((o) => dayKey(o.createdAt) === selectedDate)
    : [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top + 6 }}>
      <ScreenHeader title="My Orders" />
      <View style={{ paddingHorizontal: 20 }}>
        <SegmentChips segments={['List', 'Calendar']} value={segment} onChange={setSegment} />
      </View>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={orders.isRefetching}
            onRefresh={() => orders.refetch()}
            tintColor={colors.brandDark}
          />
        }
      >
        {orders.isLoading ? (
          <View style={{ gap: 14 }}>
            <Skeleton height={110} radius={20} />
            <Skeleton height={110} radius={20} />
          </View>
        ) : orders.isError ? (
          <EmptyState
            image={2}
            message="We couldn't load your orders. Check your connection and try again."
            actionLabel="Retry"
            onAction={() => orders.refetch()}
          />
        ) : segment === 'List' ? (
          grouped.length === 0 ? (
            <EmptyState
              image={1}
              message="No orders yet. Your meals and ingredient baskets will show up here."
              actionLabel="Browse the market"
              onAction={() => router.push('/(tabs)/market')}
            />
          ) : (
            grouped.map(([key, dayOrders], gi) => (
              <Animated.View key={key} entering={FadeInDown.delay(gi * 60).duration(300)}>
                <Text style={styles.dayHeader}>{prettyDay(key)}</Text>
                <View style={{ gap: 12, marginBottom: 20 }}>
                  {dayOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onConfirm={confirmPayment.mutate}
                      confirming={confirmingId === order.id}
                    />
                  ))}
                </View>
              </Animated.View>
            ))
          )
        ) : (
          <>
            {/* Month header */}
            <View style={styles.monthRow}>
              <Text style={styles.monthTitle}>
                {MONTHS[monthDate.getMonth()]} {monthDate.getFullYear()}
              </Text>
              <View style={styles.monthNav}>
                <TouchableOpacity
                  style={styles.monthBtn}
                  onPress={() => setMonthOffset((m) => m - 1)}
                >
                  <Ionicons name="chevron-back" size={16} color={colors.ink} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.monthBtn, styles.monthBtnNext]}
                  onPress={() => setMonthOffset((m) => m + 1)}
                >
                  <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
            {/* Mon–Sun header on surface pill */}
            <View style={styles.dowRow}>
              {DAYS.map((d) => (
                <Text key={d} style={styles.dowText}>
                  {d}
                </Text>
              ))}
            </View>
            {weeks.map((week, wi) => (
              <View key={wi} style={styles.weekRow}>
                {week.map((day) => {
                  const key = day.toISOString().slice(0, 10);
                  const inMonth = day.getMonth() === monthDate.getMonth();
                  const selected = key === selectedDate;
                  const hasOrders = orderDates.has(key);
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[styles.dateCell, selected && styles.dateSelected]}
                      onPress={() => setSelectedDate(selected ? null : key)}
                    >
                      <Text
                        style={[
                          styles.dateText,
                          !inMonth && { color: colors.inkFaint },
                          selected && { color: '#FFFFFF', fontWeight: '700' },
                        ]}
                      >
                        {day.getDate()}
                      </Text>
                      {hasOrders && !selected ? <View style={styles.orderDot} /> : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
            <View style={{ marginTop: 20, gap: 12 }}>
              {selectedDate === null ? (
                <Text style={styles.calendarHint}>
                  Select a highlighted date to see that day's orders.
                </Text>
              ) : selectedOrders.length === 0 ? (
                <EmptyState image={2} message="No orders on this day." />
              ) : (
                selectedOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onConfirm={confirmPayment.mutate}
                    confirming={confirmingId === order.id}
                  />
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  dayHeader: { fontSize: 14.5, fontWeight: '700', color: colors.ink, marginBottom: 10 },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    ...shadow,
  },
  orderTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  orderVendor: { fontSize: 14, fontWeight: '700', color: colors.ink },
  statusPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.3 },
  orderItems: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  itemThumb: {
    width: 36,
    height: 36,
    borderRadius: 12,
    marginRight: -14,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: colors.surfaceAlt,
  },
  itemsLabel: { fontSize: 12.5, color: colors.inkSoft, marginLeft: 18 },
  orderRef: { fontSize: 11, color: colors.inkFaint, marginLeft: 18, marginTop: 2 },
  orderTotal: { fontSize: 14, fontWeight: '800', color: colors.ink },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.accentLight,
  },
  confirmText: { fontSize: 12.5, fontWeight: '700', color: colors.accentDark },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  monthTitle: { fontSize: 17, fontWeight: '700', color: colors.ink },
  monthNav: { flexDirection: 'row', gap: 8 },
  monthBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthBtnNext: { backgroundColor: colors.accent },
  dowRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingVertical: 8,
    marginBottom: 8,
  },
  dowText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: colors.inkSoft,
  },
  weekRow: { flexDirection: 'row', marginBottom: 4 },
  dateCell: {
    flex: 1,
    aspectRatio: 1.1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  dateSelected: { backgroundColor: colors.accent },
  dateText: { fontSize: 13.5, color: colors.ink },
  orderDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.accent,
    marginTop: 2,
  },
  calendarHint: { fontSize: 13, color: colors.inkFaint, textAlign: 'center', marginTop: 8 },
});
