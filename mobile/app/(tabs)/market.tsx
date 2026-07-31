import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '@/api';
import EmptyState from '@/components/EmptyState';
import ProductCard from '@/components/ProductCard';
import SearchRow from '@/components/SearchRow';
import SegmentChips from '@/components/SegmentChips';
import { SkeletonGrid } from '@/components/Skeleton';
import { useAuth } from '@/context/AuthContext';
import { colors, spacing } from '@/theme';
import type { Listing, Page } from '@/types';

const SEGMENTS = ['Meals', 'Ingredients'];
const PAGE_SIZE = 20;

export default function Market() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [segment, setSegment] = useState('Meals');
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');

  const type = segment === 'Meals' ? 'FOOD' : 'INGREDIENT';

  // Paginated + virtualized: pages load on demand as the user scrolls, and the
  // FlatList only mounts visible rows (was ScrollView + .map rendering everything).
  const listings = useInfiniteQuery({
    queryKey: ['listings', type, query, user?.country],
    queryFn: ({ pageParam = 0 }) =>
      api.get<Page<Listing>>('/listings', {
        type,
        q: query || undefined,
        country: user?.country,
        page: pageParam,
        size: PAGE_SIZE,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) =>
      pages.length < lastPage.totalPages ? pages.length : undefined,
  });

  const rows = listings.data?.pages.flatMap((p) => p.content) ?? [];

  const loadMore = useCallback(() => {
    if (listings.hasNextPage && !listings.isFetchingNextPage) listings.fetchNextPage();
  }, [listings]);

  const renderItem = useCallback(
    ({ item }: { item: Listing }) => (
      <Animated.View entering={FadeIn.duration(220)} style={styles.gridCell}>
        <ProductCard listing={item} />
      </Animated.View>
    ),
    []
  );

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

      {listings.isLoading ? (
        <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
          <SkeletonGrid count={6} />
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(l) => String(l.id)}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.column}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={listings.isRefetching && !listings.isFetchingNextPage}
              onRefresh={() => listings.refetch()}
              tintColor={colors.brandDark}
            />
          }
          ListEmptyComponent={
            listings.isError ? (
              <EmptyState
                image={3}
                message="We couldn't load the market. Check your connection and try again."
                actionLabel="Retry"
                onAction={() => listings.refetch()}
              />
            ) : (
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
            )
          }
          ListFooterComponent={
            listings.isFetchingNextPage ? (
              <ActivityIndicator color={colors.brandDark} style={{ marginVertical: spacing.lg }} />
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  top: { paddingHorizontal: 20 },
  list: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 120, flexGrow: 1 },
  column: { gap: 14 },
  gridCell: { width: '47%', flexGrow: 1, marginBottom: 14 },
});
