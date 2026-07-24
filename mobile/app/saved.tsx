import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '@/api';
import EmptyState from '@/components/EmptyState';
import RecipeCard from '@/components/RecipeCard';
import ScreenHeader from '@/components/ScreenHeader';
import { SkeletonGrid } from '@/components/Skeleton';
import { colors } from '@/theme';
import type { Recipe } from '@/types';

export default function Saved() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const saved = useQuery({
    queryKey: ['saved'],
    queryFn: () => api.get<Recipe[]>('/users/me/saved'),
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top + 6 }}>
      <ScreenHeader title="My favorites" />
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        refreshControl={
          <RefreshControl
            refreshing={saved.isRefetching}
            onRefresh={() => saved.refetch()}
            tintColor={colors.brandDark}
          />
        }
      >
        {saved.isLoading ? (
          <SkeletonGrid count={4} />
        ) : saved.isError ? (
          <EmptyState
            image={2}
            message="We couldn't load your favorites. Check your connection and try again."
            actionLabel="Retry"
            onAction={() => saved.refetch()}
          />
        ) : (saved.data ?? []).length === 0 ? (
          <EmptyState
            image={2}
            message="You haven't saved any recipes yet. Tap the heart on a recipe to keep it here."
            actionLabel="Find recipes"
            onAction={() => router.push('/(tabs)/search')}
          />
        ) : (
          <View style={styles.grid}>
            {(saved.data ?? []).map((recipe, i) => (
              <Animated.View
                key={recipe.id}
                entering={FadeInDown.delay(i * 50).duration(300)}
                style={styles.cell}
              >
                <RecipeCard recipe={recipe} />
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  cell: { width: '47%', flexGrow: 1 },
});
