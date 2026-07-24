import React, { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '@/api';
import EmptyState from '@/components/EmptyState';
import ProductCard from '@/components/ProductCard';
import SearchRow from '@/components/SearchRow';
import SegmentChips from '@/components/SegmentChips';
import { SkeletonGrid } from '@/components/Skeleton';
import { useAuth } from '@/context/AuthContext';
import { colors } from '@/theme';
import type { Listing, Page } from '@/types';

const SEGMENTS = ['Meals', 'Ingredients'];

export default function Market() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [segment, setSegment] = useState('Meals');
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');

  const type = segment === 'Meals' ? 'FOOD' : 'INGREDIENT';
  const listings = useQuery({
    queryKey: ['listings', type, query, user?.country],
    queryFn: () =>
      api.get<Page<Listing>>('/listings', {
        type,
        q: query || undefined,
        country: user?.country,
        page: 0,
        size: 30,
      }),
  });

  const rows = listings.data?.content ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top + 10 }}>
      <View style={styles.top}>
        <SearchRow
          value={q}
          onChangeText={setQ}
          onSubmit={() => setQuery(q.trim())}
          placeholder="Search the market"
        />
        <SegmentChips
          segments={SEGMENTS}
          value={segment}
          onChange={setSegment}
          style={{ marginTop: 14 }}
        />
      </View>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={listings.isRefetching}
            onRefresh={() => listings.refetch()}
            tintColor={colors.brandDark}
          />
        }
      >
        {listings.isLoading ? (
          <SkeletonGrid count={6} />
        ) : listings.isError ? (
          <EmptyState
            image={3}
            message="We couldn't load the market. Check your connection and try again."
            actionLabel="Retry"
            onAction={() => listings.refetch()}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            image={3}
            message={
              query
                ? 'Nothing in the market matches that search yet.'
                : 'No listings available near you yet — check back soon.'
            }
            actionLabel={query ? 'Clear search' : undefined}
            onAction={
              query
                ? () => {
                    setQ('');
                    setQuery('');
                  }
                : undefined
            }
          />
        ) : (
          <View style={styles.grid}>
            {rows.map((listing, i) => (
              <Animated.View
                key={listing.id}
                entering={FadeInDown.delay(i * 45).duration(320)}
                style={styles.gridCell}
              >
                <ProductCard listing={listing} />
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { paddingHorizontal: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  gridCell: { width: '47%', flexGrow: 1 },
});
