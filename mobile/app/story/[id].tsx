import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '@/api';
import CircleButton from '@/components/CircleButton';
import PrimaryButton from '@/components/PrimaryButton';
import { ErrorView, LoadingView } from '@/components/StatusViews';
import TwoToneTitle from '@/components/TwoToneTitle';
import { IMG } from '@/config';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';
import type { ThemeColors } from '@/theme';
import type { Page, Recipe, Story } from '@/types';

/**
 * Full-screen story reader. Opens either a Story (by id from the stories feed)
 * or a recipe's Food Story (when `recipeId` param is set — the API has no
 * GET /stories/{id}, so feed stories are looked up from the list query).
 */
export default function StoryReader() {
  const { id, recipeId } = useLocalSearchParams<{ id: string; recipeId?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const byRecipe = !!recipeId && recipeId !== '0';

  const stories = useQuery({
    queryKey: ['stories'],
    queryFn: () => api.get<Page<Story>>('/stories', { country: user?.country }),
    enabled: !byRecipe,
  });
  const recipe = useQuery({
    queryKey: ['recipe', Number(recipeId)],
    queryFn: () => api.get<Recipe>(`/recipes/${recipeId}`),
    enabled: byRecipe,
  });

  const loading = byRecipe ? recipe.isLoading : stories.isLoading;
  if (loading) return <LoadingView />;

  let title: string;
  let body: string;
  let imageUrl: string | null;
  let meta: string;
  let viewRecipeId: number | null;

  if (byRecipe) {
    if (!recipe.data) return <ErrorView message={t('intro.storyNotFound')} />;
    title = `${t('intro.storyOf')} ${recipe.data.title}`;
    body = recipe.data.story ?? t('intro.noStory');
    // Show the dish's own photo on its story page so image and story match.
    imageUrl = recipe.data.imageUrl ?? recipe.data.storyImageUrl;
    meta = `${recipe.data.cuisine}${recipe.data.vendorName ? ` · ${recipe.data.vendorName}` : ''}`;
    viewRecipeId = recipe.data.id;
  } else {
    const story = (stories.data?.content ?? []).find((s) => s.id === Number(id));
    if (!story) return <ErrorView message={t('intro.storyNotFound')} />;
    title = story.title;
    body = story.body;
    imageUrl = story.imageUrl;
    meta = `${story.cuisine} · ${story.countryName}${story.vendorName ? ` · ${story.vendorName}` : ''}`;
    viewRecipeId = story.recipeId;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <Image source={{ uri: IMG(imageUrl) }} style={styles.hero} contentFit="cover" />
        <View style={styles.body}>
          <Animated.View entering={FadeInDown.duration(320)}>
            <TwoToneTitle text={title} size={24} />
            <Text style={styles.meta}>{meta}</Text>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(80).duration(320)}>
            <Text style={styles.narrative}>{body}</Text>
          </Animated.View>
        </View>
      </ScrollView>
      <View style={[styles.back, { top: insets.top + 8 }]}>
        <CircleButton icon="chevron-back" onPress={() => router.back()} />
      </View>
      {viewRecipeId ? (
        <View style={[styles.cta, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <PrimaryButton
            title={t('intro.viewRecipe')}
            onPress={() =>
              router.push({ pathname: '/recipe/[id]', params: { id: String(viewRecipeId) } })
            }
          />
        </View>
      ) : null}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    hero: { width: '100%', height: 340, backgroundColor: colors.surfaceAlt },
    body: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      marginTop: -24,
      padding: 24,
    },
    meta: { fontSize: 12.5, color: colors.brandDark, fontWeight: '600', marginTop: 6 },
    narrative: { fontSize: 15, color: colors.inkSoft, lineHeight: 24, marginTop: 16 },
    back: { position: 'absolute', left: 16 },
    cta: { position: 'absolute', left: 20, right: 20, bottom: 0 },
  });
