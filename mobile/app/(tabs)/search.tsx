import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '@/api';
import ChoiceChip from '@/components/ChoiceChip';
import EmptyState from '@/components/EmptyState';
import RecipeCard from '@/components/RecipeCard';
import SearchRow from '@/components/SearchRow';
import { SkeletonGrid } from '@/components/Skeleton';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';
import type { ThemeColors } from '@/theme';
import type { Page, Recipe, RecipeCategory, SmartSearchResponse } from '@/types';

const RECENTS_KEY = 'dishaspora.recentSearches';
const MAX_RECENTS = 6;

export default function Search() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [input, setInput] = useState('');
  const [smartQuery, setSmartQuery] = useState('');
  const [category, setCategory] = useState<RecipeCategory | null>(null);
  const [maxCalories, setMaxCalories] = useState<number | null>(null);
  const [maxMinutes, setMaxMinutes] = useState<number | null>(null);
  const [recents, setRecents] = useState<string[]>([]);

  const CATEGORIES: { label: string; value: RecipeCategory }[] = [
    { label: t('search.categoryLocal'), value: 'LOCAL' },
    { label: t('search.categoryContinental'), value: 'CONTINENTAL' },
    { label: t('search.categoryForeign'), value: 'FOREIGN' },
    { label: t('search.categoryDrinks'), value: 'DRINK' },
  ];

  const CALORIE_CHIPS = [
    { label: `${t('search.under')} 400 ${t('search.kcal')}`, value: 400 },
    { label: `${t('search.under')} 600 ${t('search.kcal')}`, value: 600 },
  ];
  const TIME_CHIPS = [
    { label: `${t('search.under')} 30 ${t('search.min')}`, value: 30 },
    { label: `${t('search.under')} 60 ${t('search.min')}`, value: 60 },
  ];

  const POPULAR_SEARCHES = [
    t('search.popularJollof'),
    t('search.popularQuickBreakfast'),
    t('search.popularHighProtein'),
    t('search.popularVegSoups'),
    t('search.popularUnder400'),
  ];

  // Load persisted recent searches once.
  useEffect(() => {
    AsyncStorage.getItem(RECENTS_KEY)
      .then((raw) => {
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setRecents(parsed.filter((x) => typeof x === 'string'));
        }
      })
      .catch(() => {});
  }, []);

  const pushRecent = useCallback((q: string) => {
    const clean = q.trim();
    if (clean.length < 2) return;
    setRecents((prev) => {
      const next = [clean, ...prev.filter((r) => r.toLowerCase() !== clean.toLowerCase())].slice(
        0,
        MAX_RECENTS
      );
      AsyncStorage.setItem(RECENTS_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const clearRecents = useCallback(() => {
    setRecents([]);
    AsyncStorage.removeItem(RECENTS_KEY).catch(() => {});
  }, []);

  // Debounced live search: after a short pause, run the query without needing Enter.
  useEffect(() => {
    const clean = input.trim();
    if (clean.length < 3) return;
    if (clean === smartQuery) return;
    const t = setTimeout(() => setSmartQuery(clean), 500);
    return () => clearTimeout(t);
  }, [input, smartQuery]);

  // Smart natural-language search when a query is submitted
  const smart = useQuery({
    queryKey: ['smart-search', smartQuery],
    queryFn: () => api.get<SmartSearchResponse>('/search/smart', { q: smartQuery }),
    enabled: smartQuery.length > 0,
  });

  // Standard filtered browse otherwise
  const browse = useQuery({
    queryKey: ['recipes', category, maxCalories, maxMinutes],
    queryFn: () =>
      api.get<Page<Recipe>>('/recipes', {
        category: category ?? undefined,
        maxCalories: maxCalories ?? undefined,
        maxMinutes: maxMinutes ?? undefined,
        page: 0,
        size: 30,
      }),
    enabled: smartQuery.length === 0,
  });

  const smartMode = smartQuery.length > 0;
  const loading = smartMode ? smart.isLoading : browse.isLoading;
  const recipes = smartMode ? smart.data?.recipes ?? [] : browse.data?.content ?? [];

  const parsedChips = useMemo(() => {
    const f = smart.data?.filters;
    if (!smartMode || !f) return [];
    const chips: { key: string; label: string }[] = [];
    if (f.q) chips.push({ key: 'q', label: `“${f.q}”` });
    if (f.category) chips.push({ key: 'category', label: f.category.toLowerCase() });
    if (f.cuisine) chips.push({ key: 'cuisine', label: f.cuisine });
    if (f.maxCalories) chips.push({ key: 'maxCalories', label: `≤ ${f.maxCalories} ${t('search.kcal')}` });
    if (f.maxMinutes) chips.push({ key: 'maxMinutes', label: `≤ ${f.maxMinutes} ${t('search.min')}` });
    return chips;
  }, [smart.data, smartMode, t]);

  const submit = () => {
    const clean = input.trim();
    if (!clean) return;
    setSmartQuery(clean);
    pushRecent(clean);
  };

  const runSuggestion = (q: string) => {
    setInput(q);
    setSmartQuery(q);
    pushRecent(q);
  };

  const clearSmart = () => {
    setSmartQuery('');
    setInput('');
  };

  const showSuggestions = !smartMode && input.trim().length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top + 10 }}>
      <View style={styles.searchWrap}>
        <SearchRow
          value={input}
          onChangeText={setInput}
          onSubmit={submit}
          placeholder={t('search.placeholder')}
        />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={smartMode ? smart.isRefetching : browse.isRefetching}
            onRefresh={() => (smartMode ? smart.refetch() : browse.refetch())}
            tintColor={colors.brandDark}
          />
        }
        keyboardShouldPersistTaps="handled"
      >
        {showSuggestions ? (
          <View style={styles.suggestWrap}>
            {recents.length > 0 ? (
              <View style={{ marginBottom: 16 }}>
                <View style={styles.suggestHeader}>
                  <Text style={styles.suggestTitle}>{t('search.recentSearches')}</Text>
                  <Text style={styles.clearLink} onPress={clearRecents}>
                    {t('search.clear')}
                  </Text>
                </View>
                <View style={styles.suggestChips}>
                  {recents.map((r) => (
                    <ChoiceChip key={r} label={r} onPress={() => runSuggestion(r)} />
                  ))}
                </View>
              </View>
            ) : null}
            <Text style={styles.suggestTitle}>{t('search.popularSearches')}</Text>
            <View style={styles.suggestChips}>
              {POPULAR_SEARCHES.map((s) => (
                <ChoiceChip key={s} label={s} onPress={() => runSuggestion(s)} />
              ))}
            </View>
          </View>
        ) : null}

        {smartMode ? (
          <View style={styles.chipsRow}>
            {parsedChips.map((chip) => (
              <ChoiceChip key={chip.key} label={chip.label} selected onRemove={clearSmart} />
            ))}
            {parsedChips.length > 0 ? (
              <ChoiceChip label={t('search.clear')} onPress={clearSmart} />
            ) : null}
          </View>
        ) : (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRowScroll}
            >
              {CATEGORIES.map((c) => (
                <ChoiceChip
                  key={c.value}
                  label={c.label}
                  selected={category === c.value}
                  onPress={() => setCategory(category === c.value ? null : c.value)}
                />
              ))}
            </ScrollView>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRowScroll}
            >
              {CALORIE_CHIPS.map((c) => (
                <ChoiceChip
                  key={c.value}
                  label={c.label}
                  selected={maxCalories === c.value}
                  onPress={() => setMaxCalories(maxCalories === c.value ? null : c.value)}
                />
              ))}
              {TIME_CHIPS.map((c) => (
                <ChoiceChip
                  key={c.value}
                  label={c.label}
                  selected={maxMinutes === c.value}
                  onPress={() => setMaxMinutes(maxMinutes === c.value ? null : c.value)}
                />
              ))}
            </ScrollView>
          </>
        )}

        <View style={styles.results}>
          {loading ? (
            <SkeletonGrid count={6} />
          ) : (smartMode ? smart.isError : browse.isError) ? (
            <EmptyState
              image={2}
              message={t('search.errorMessage')}
              actionLabel={t('common.retry')}
              onAction={() => (smartMode ? smart.refetch() : browse.refetch())}
            />
          ) : recipes.length === 0 ? (
            <EmptyState
              image={2}
              message={smartMode ? t('search.noMatch') : t('search.noFilterMatch')}
              actionLabel={t('search.clearSearch')}
              onAction={() => {
                clearSmart();
                setCategory(null);
                setMaxCalories(null);
                setMaxMinutes(null);
              }}
            />
          ) : (
            <View style={styles.grid}>
              {recipes.map((recipe, i) => (
                <Animated.View
                  key={recipe.id}
                  entering={FadeInDown.delay(i * 50).duration(320)}
                  style={styles.gridCell}
                >
                  <RecipeCard recipe={recipe} />
                </Animated.View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    searchWrap: { paddingHorizontal: 20, marginBottom: 14 },
    chipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      paddingHorizontal: 20,
      marginBottom: 12,
    },
    chipsRowScroll: { paddingHorizontal: 20, gap: 8, marginBottom: 10, paddingBottom: 2 },
    suggestWrap: { paddingHorizontal: 20, marginBottom: 8 },
    suggestHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    suggestTitle: { fontSize: 14, fontWeight: '700', color: colors.ink, marginBottom: 10 },
    clearLink: { fontSize: 13, fontWeight: '600', color: colors.brandDark },
    suggestChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    results: { paddingHorizontal: 20, paddingTop: 8 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
    gridCell: { width: '47%', flexGrow: 1 },
  });
