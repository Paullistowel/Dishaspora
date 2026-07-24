import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import EmptyState from '@/components/EmptyState';
import PrimaryButton from '@/components/PrimaryButton';
import ScreenHeader from '@/components/ScreenHeader';
import StepperRow from '@/components/StepperRow';
import SummaryBlock from '@/components/SummaryBlock';
import { useCart } from '@/context/CartContext';
import { DELIVERY_MINOR, orderTotals } from '@/fees';
import { colors, shadow } from '@/theme';

export default function Cart() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cart = useCart();

  const confirmRemove = (listingId: number, title: string) => {
    Alert.alert('Remove item', `Remove “${title}” from your cart?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => cart.remove(listingId) },
    ]);
  };

  const { feeMinor, totalMinor } = orderTotals(cart.subtotalMinor);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top + 6 }}>
      <ScreenHeader title="My Cart" />
      {cart.items.length === 0 ? (
        <EmptyState
          image={1}
          message="Your cart is empty. Fill it from the market or a recipe's ingredient basket."
          actionLabel="Browse the market"
          onAction={() => router.push('/(tabs)/market')}
          style={{ marginTop: 40 }}
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.vendorChip}>
            <Text style={styles.vendorChipText}>Ordering from {cart.vendorName}</Text>
          </View>
          <View style={{ gap: 12 }}>
            {cart.items.map((item, i) => (
              <Animated.View
                key={item.listing.id}
                entering={FadeInDown.delay(i * 50).duration(300)}
                layout={LinearTransition.springify()}
              >
                <StepperRow
                  item={item}
                  onInc={() => cart.setQty(item.listing.id, item.qty + 1)}
                  onDec={() => cart.setQty(item.listing.id, item.qty - 1)}
                  onRemove={() => confirmRemove(item.listing.id, item.listing.title)}
                />
              </Animated.View>
            ))}
          </View>

          <Animated.View layout={LinearTransition.springify()} style={styles.summaryCard}>
            <SummaryBlock
              subtotalMinor={cart.subtotalMinor}
              feeMinor={feeMinor}
              deliveryMinor={DELIVERY_MINOR}
              totalMinor={totalMinor}
              currency={cart.currency ?? 'GHS'}
            />
            <PrimaryButton
              title="Proceed to checkout"
              variant="black"
              onPress={() => router.push('/checkout')}
              style={{ marginTop: 16 }}
            />
          </Animated.View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  vendorChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.brandLight,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginBottom: 14,
  },
  vendorChipText: { fontSize: 12.5, fontWeight: '700', color: colors.brandDark },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginTop: 20,
    ...shadow,
  },
});
