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
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';
import type { Recipe } from '@/types';

export default function Saved() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useI18n();
  const saved = useQuery({
    queryKey: ['saved'],
    queryFn: () => api.get<Recipe[]>('/users/me/saved'),
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top + 6 }}>
      <ScreenHeader title={t('nutrition.savedTitle')} />
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
            message={t('nutrition.savedLoadError')}
            actionLabel={t('nutrition.retry')}
            onAction={() => saved.refetch()}
          />
        ) : (saved.data ?? []).length === 0 ? (
          <EmptyState
            image={2}
            message={t('nutrition.savedEmpty')}
            actionLabel={t('nutrition.findRecipes')}
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
