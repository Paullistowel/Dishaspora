import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '@/components/ScreenHeader';
import {
  clearChecked,
  getShoppingList,
  removeItem,
  toggleItem,
  type ShoppingItem,
} from '@/shoppingList';
import { colors, radius, shadow } from '@/theme';

export default function ShoppingList() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<ShoppingItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      getShoppingList().then(setItems);
    }, [])
  );

  const remaining = items.filter((i) => !i.checked).length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top + 6 }}>
      <ScreenHeader
        title="Shopping list"
        right={
          items.some((i) => i.checked) ? (
            <TouchableOpacity onPress={async () => setItems(await clearChecked())}>
              <Text style={styles.clear}>Clear done</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />
      {items.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}><Ionicons name="cart-outline" size={40} color={colors.brandDark} /></View>
          <Text style={styles.emptyTitle}>Your list is empty</Text>
          <Text style={styles.emptySub}>Add missing ingredients from Snap & Cook and they'll show up here.</Text>
          <TouchableOpacity style={styles.snapBtn} onPress={() => router.push('/snap')}>
            <Ionicons name="camera" size={18} color="#FFF" />
            <Text style={styles.snapBtnText}>Open Snap & Cook</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40, gap: 10 }}>
          <Text style={styles.count}>{remaining} item{remaining === 1 ? '' : 's'} to buy</Text>
          {items.map((it) => (
            <View key={it.name} style={styles.row}>
              <TouchableOpacity style={styles.check} onPress={async () => setItems(await toggleItem(it.name))}>
                <Ionicons name={it.checked ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={it.checked ? colors.success : colors.inkFaint} />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, it.checked && styles.done]}>{it.name}</Text>
                {it.note ? <Text style={styles.note}>↔ {it.note}</Text> : null}
              </View>
              <TouchableOpacity hitSlop={8} onPress={async () => setItems(await removeItem(it.name))}>
                <Ionicons name="close" size={20} color={colors.inkFaint} />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={styles.marketBtn} onPress={() => router.push('/(tabs)/market')}>
            <Ionicons name="storefront-outline" size={18} color={colors.brandDark} />
            <Text style={styles.marketText}>Shop these in the marketplace</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  clear: { color: colors.danger, fontSize: 13.5, fontWeight: '700' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 6 },
  emptyIcon: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.brandLight, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: colors.ink },
  emptySub: { fontSize: 13.5, color: colors.inkSoft, textAlign: 'center', lineHeight: 20, marginTop: 4 },
  snapBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.accent, borderRadius: 999, paddingHorizontal: 22, height: 50, marginTop: 22 },
  snapBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  count: { fontSize: 13, color: colors.inkSoft, fontWeight: '600', marginBottom: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: radius.md, padding: 14, ...shadow },
  check: { padding: 2 },
  name: { fontSize: 15, fontWeight: '700', color: colors.ink, textTransform: 'capitalize' },
  done: { textDecorationLine: 'line-through', color: colors.inkFaint },
  note: { fontSize: 12, color: colors.brandDark, marginTop: 2 },
  marketBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: 999, borderWidth: 1.5, borderColor: colors.brandLight, marginTop: 10 },
  marketText: { fontSize: 14, fontWeight: '700', color: colors.brandDark },
});
