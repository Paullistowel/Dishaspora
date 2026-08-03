import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import EmptyState from '@/components/EmptyState';
import PrimaryButton from '@/components/PrimaryButton';
import ScreenHeader from '@/components/ScreenHeader';
import StepperRow from '@/components/StepperRow';
import SummaryBlock from '@/components/SummaryBlock';
import { useCart, type VendorGroup } from '@/context/CartContext';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';
import { DELIVERY_MINOR, orderTotals } from '@/fees';
import { formatMoney } from '@/money';
import { radius, shadow, type ThemeColors } from '@/theme';

/**
 * Cart holds items from any number of vendors. Because each vendor is a separate
 * order + payment on the backend, we show one section per vendor and let the user
 * check each out in turn (the section's items clear once that order is paid).
 */
export default function Cart() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cart = useCart();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);

  const confirmRemove = (listingId: number, title: string) => {
    Alert.alert(t('cart.removeItemTitle'), `${t('cart.removeConfirmPre')} “${title}” ${t('cart.removeConfirmPost')}`, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('cart.remove'), style: 'destructive', onPress: () => cart.remove(listingId) },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top + 6 }}>
      <ScreenHeader title={t('cart.title')} />
      {cart.items.length === 0 ? (
        <EmptyState
          image={1}
          message={t('cart.emptyMessage')}
          actionLabel={t('cart.browseMarket')}
          onAction={() => router.push('/(tabs)/market')}
          style={{ marginTop: 40 }}
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40, gap: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {cart.groups.length > 1 ? (
            <View style={styles.multiNote}>
              <Ionicons name="information-circle" size={18} color={colors.blueDark} />
              <Text style={styles.multiNoteText}>
                {t('cart.multiVendorPre')} {cart.groups.length} {t('cart.multiVendorPost')}
              </Text>
            </View>
          ) : null}

          {cart.groups.map((group, gi) => (
            <VendorSection
              key={group.vendorId}
              group={group}
              index={gi}
              onInc={(id, q) => cart.setQty(id, q + 1)}
              onDec={(id, q) => cart.setQty(id, q - 1)}
              onRemove={confirmRemove}
              onCheckout={() =>
                router.push({ pathname: '/checkout', params: { vendorId: String(group.vendorId) } })
              }
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function VendorSection({
  group,
  index,
  onInc,
  onDec,
  onRemove,
  onCheckout,
}: {
  group: VendorGroup;
  index: number;
  onInc: (listingId: number, qty: number) => void;
  onDec: (listingId: number, qty: number) => void;
  onRemove: (listingId: number, title: string) => void;
  onCheckout: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const { feeMinor, totalMinor } = orderTotals(group.subtotalMinor);
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 60).duration(320)}
      layout={LinearTransition.springify()}
      style={styles.section}
    >
      <View style={styles.vendorHeader}>
        <View style={styles.vendorIcon}>
          <Ionicons name="storefront" size={15} color={colors.brandDark} />
        </View>
        <Text style={styles.vendorName} numberOfLines={1}>
          {group.vendorName}
        </Text>
        <Text style={styles.vendorCount}>
          {group.count} {group.count === 1 ? t('cart.item') : t('cart.items')}
        </Text>
      </View>

      <View style={{ gap: 12 }}>
        {group.items.map((item) => (
          <Animated.View key={item.listing.id} layout={LinearTransition.springify()}>
            <StepperRow
              item={item}
              onInc={() => onInc(item.listing.id, item.qty)}
              onDec={() => onDec(item.listing.id, item.qty)}
              onRemove={() => onRemove(item.listing.id, item.listing.title)}
            />
          </Animated.View>
        ))}
      </View>

      <View style={styles.summaryCard}>
        <SummaryBlock
          subtotalMinor={group.subtotalMinor}
          feeMinor={feeMinor}
          deliveryMinor={DELIVERY_MINOR}
          totalMinor={totalMinor}
          currency={group.currency}
        />
        <PrimaryButton
          title={`${t('cart.checkout')} · ${formatMoney(totalMinor, group.currency)}`}
          variant="black"
          onPress={onCheckout}
          style={{ marginTop: 16 }}
        />
      </View>
    </Animated.View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    multiNote: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.blueLight,
      borderRadius: radius.md,
      padding: 12,
    },
    multiNoteText: { flex: 1, fontSize: 12.5, color: colors.blueDark, fontWeight: '600', lineHeight: 18 },
    section: { gap: 12 },
    vendorHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    vendorIcon: {
      width: 28,
      height: 28,
      borderRadius: 9,
      backgroundColor: colors.brandLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    vendorName: { flex: 1, fontSize: 15, fontWeight: '800', color: colors.ink },
    vendorCount: { fontSize: 12, color: colors.inkSoft, fontWeight: '600' },
    summaryCard: {
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 18,
      ...shadow,
    },
  });
