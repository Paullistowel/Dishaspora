import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import PressableScale from './PressableScale';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { IMG } from '../config';
import { colors, shadow } from '../theme';
import type { Recipe } from '../types';
import Avatar from './Avatar';

/**
 * 2-col grid recipe card (ref pattern #2): rounded image, bottom overlay row =
 * vendor chip (logo circle + name on dark translucent pill) + circular orange arrow.
 */
function RecipeCard({
  recipe,
  style,
  showMeta = true,
}: {
  recipe: Recipe;
  style?: ViewStyle;
  showMeta?: boolean;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const totalMin = recipe.prepMinutes + recipe.cookMinutes;
  const open = () => {
    // Warm the detail query so the recipe screen paints instantly on arrival.
    queryClient.prefetchQuery({
      queryKey: ['recipe', recipe.id],
      queryFn: () => api.get<Recipe>(`/recipes/${recipe.id}`),
    });
    router.push({ pathname: '/recipe/[id]', params: { id: String(recipe.id) } });
  };

  return (
    <PressableScale
      style={[styles.card, style]}
      onPress={open}
      tilt
      accessibilityLabel={`Recipe: ${recipe.title}, ${totalMin} minutes`}
      accessibilityHint="Opens the recipe"
    >
      <View style={styles.imageWrap}>
        <Image
          source={{ uri: IMG(recipe.imageUrl) }}
          style={styles.image}
          contentFit="cover"
          transition={150}
        />
        <View style={styles.overlayRow}>
          <View style={styles.vendorChip}>
            <Avatar url={null} name={recipe.vendorName ?? 'Dishaspora'} size={18} />
            <Text style={styles.vendorName} numberOfLines={1}>
              {recipe.vendorName ?? 'Dishaspora'}
            </Text>
          </View>
          <View style={styles.arrowBtn}>
            <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
          </View>
        </View>
      </View>
      {showMeta ? (
        <View style={styles.meta}>
          <Text style={styles.title} numberOfLines={1}>
            {recipe.title}
          </Text>
          <View style={styles.metaRow}>
            <Ionicons name="star" size={11} color={colors.star} />
            <Text style={styles.metaText}>
              {recipe.rating ? recipe.rating.toFixed(1) : '—'}
            </Text>
            <Ionicons name="time-outline" size={11} color={colors.inkFaint} style={{ marginLeft: 6 }} />
            <Text style={styles.metaText}>{totalMin} min</Text>
            <Ionicons name="flame-outline" size={11} color={colors.accentDark} style={{ marginLeft: 6 }} />
            <Text style={styles.metaText}>{recipe.calories} kcal</Text>
          </View>
        </View>
      ) : null}
    </PressableScale>
  );
}

// Memoized: recipe cards populate long grids/carousels; skip re-renders when the
// recipe/style/showMeta props are unchanged.
export default React.memo(RecipeCard);

const styles = StyleSheet.create({
  card: { flex: 1 },
  imageWrap: {
    borderRadius: 20,
    overflow: 'hidden',
    aspectRatio: 0.92,
    backgroundColor: colors.surfaceAlt,
    ...shadow,
  },
  image: { width: '100%', height: '100%' },
  overlayRow: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vendorChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(23,37,42,0.65)',
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 7,
  },
  vendorName: { flex: 1, color: '#FFFFFF', fontSize: 11, fontWeight: '600' },
  arrowBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: { paddingTop: 8, paddingHorizontal: 2 },
  title: { fontSize: 14, fontWeight: '600', color: colors.ink },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 3,
  },
  metaText: { fontSize: 11, color: colors.inkSoft },
});
