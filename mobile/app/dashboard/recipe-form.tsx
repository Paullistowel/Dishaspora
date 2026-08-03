import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '@/api';
import ChoiceChip from '@/components/ChoiceChip';
import Input from '@/components/Input';
import PrimaryButton from '@/components/PrimaryButton';
import ScreenHeader from '@/components/ScreenHeader';
import { IMG } from '@/config';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';
import { shadow, type ThemeColors } from '@/theme';
import type { MealType, Recipe, RecipeCategory } from '@/types';

const CATEGORIES: RecipeCategory[] = ['LOCAL', 'CONTINENTAL', 'FOREIGN', 'DRINK'];
const MEAL_TYPES: MealType[] = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'DRINK'];

interface IngredientDraft {
  name: string;
  quantity: string;
  unit: string;
}
interface StepDraft {
  instruction: string;
  durationMinutes: string;
}

export default function RecipeForm() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<RecipeCategory>('LOCAL');
  const [cuisine, setCuisine] = useState('');
  const [countryOfOrigin, setCountryOfOrigin] = useState('GH');
  const [mealType, setMealType] = useState<MealType>('LUNCH');
  const [calories, setCalories] = useState('');
  const [servings, setServings] = useState('');
  const [prepMinutes, setPrepMinutes] = useState('');
  const [cookMinutes, setCookMinutes] = useState('');
  const [mealFrequency, setMealFrequency] = useState('');
  const [mealFrequencyReason, setMealFrequencyReason] = useState('');
  const [story, setStory] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<IngredientDraft[]>([
    { name: '', quantity: '', unit: '' },
  ]);
  const [steps, setSteps] = useState<StepDraft[]>([{ instruction: '', durationMinutes: '' }]);

  const pickAndUpload = async (
    kind: 'image' | 'video' | 'audio',
    setter: (url: string) => void
  ) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: kind === 'video' ? ['videos'] : ['images'],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setUploading(kind);
    try {
      const { url } = await api.upload({
        uri: asset.uri,
        name: asset.fileName ?? `${kind}.${kind === 'video' ? 'mp4' : 'jpg'}`,
        mimeType: asset.mimeType ?? (kind === 'video' ? 'video/mp4' : 'image/jpeg'),
      });
      setter(url);
    } catch {
      Alert.alert(t('dashboard.uploadFailed'), t('dashboard.uploadFileError'));
    } finally {
      setUploading(null);
    }
  };

  const submit = useMutation({
    mutationFn: () =>
      api.post<Recipe>('/recipes', {
        title: title.trim(),
        description: description.trim(),
        category,
        cuisine: cuisine.trim(),
        countryOfOrigin: countryOfOrigin.trim(),
        mealType,
        imageUrl,
        calories: Number(calories) || 0,
        servings: Number(servings) || 1,
        prepMinutes: Number(prepMinutes) || 0,
        cookMinutes: Number(cookMinutes) || 0,
        mealFrequency: mealFrequency.trim(),
        mealFrequencyReason: mealFrequencyReason.trim(),
        story: story.trim() || null,
        storyImageUrl: imageUrl,
        videoUrl,
        audioUrl,
        ingredients: ingredients
          .filter((i) => i.name.trim())
          .map((i) => ({ name: i.name.trim(), quantity: i.quantity.trim(), unit: i.unit.trim() })),
        steps: steps
          .filter((s) => s.instruction.trim())
          .map((s, idx) => ({
            stepNumber: idx + 1,
            instruction: s.instruction.trim(),
            durationMinutes: s.durationMinutes ? Number(s.durationMinutes) : null,
            imageUrl: null,
          })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-recipes'] });
      Alert.alert(t('dashboard.recipeSubmitted'), t('dashboard.recipePendingReview'), [
        { text: t('dashboard.ok'), onPress: () => router.back() },
      ]);
    },
    onError: (e: any) => Alert.alert(t('dashboard.submissionFailed'), e?.message ?? t('dashboard.pleaseTryAgain')),
  });

  const valid =
    title.trim() &&
    cuisine.trim() &&
    ingredients.some((i) => i.name.trim()) &&
    steps.some((s) => s.instruction.trim());

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ flex: 1, paddingTop: insets.top + 6 }}>
        <ScreenHeader title={t('dashboard.uploadRecipe')} />
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 80, gap: 14 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Image */}
          <TouchableOpacity
            style={styles.imagePick}
            onPress={() => pickAndUpload('image', setImageUrl)}
          >
            {imageUrl ? (
              <Image source={{ uri: IMG(imageUrl) }} style={styles.imagePreview} contentFit="cover" />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="image-outline" size={28} color={colors.inkFaint} />
                <Text style={styles.imageHint}>
                  {uploading === 'image' ? t('dashboard.uploading') : t('dashboard.addACoverPhoto')}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <Input placeholder={t('dashboard.recipeTitle')} value={title} onChangeText={setTitle} />
          <Input placeholder={t('dashboard.shortDescription')} value={description} onChangeText={setDescription} multiline />

          <Text style={styles.label}>{t('dashboard.category')}</Text>
          <View style={styles.chips}>
            {CATEGORIES.map((c) => (
              <ChoiceChip key={c} label={c.toLowerCase()} selected={category === c} onPress={() => setCategory(c)} />
            ))}
          </View>

          <Text style={styles.label}>{t('dashboard.mealType')}</Text>
          <View style={styles.chips}>
            {MEAL_TYPES.map((m) => (
              <ChoiceChip key={m} label={m.toLowerCase()} selected={mealType === m} onPress={() => setMealType(m)} />
            ))}
          </View>

          <View style={styles.row2}>
            <Input placeholder={t('dashboard.cuisinePlaceholder')} value={cuisine} onChangeText={setCuisine} style={{ flex: 1 }} />
            <Input placeholder={t('dashboard.originPlaceholder')} value={countryOfOrigin} onChangeText={setCountryOfOrigin} style={{ width: 130 }} />
          </View>
          <View style={styles.row2}>
            <Input placeholder={t('dashboard.calories')} value={calories} onChangeText={setCalories} keyboardType="number-pad" style={{ flex: 1 }} />
            <Input placeholder={t('dashboard.servings')} value={servings} onChangeText={setServings} keyboardType="number-pad" style={{ flex: 1 }} />
          </View>
          <View style={styles.row2}>
            <Input placeholder={t('dashboard.prepMin')} value={prepMinutes} onChangeText={setPrepMinutes} keyboardType="number-pad" style={{ flex: 1 }} />
            <Input placeholder={t('dashboard.cookMin')} value={cookMinutes} onChangeText={setCookMinutes} keyboardType="number-pad" style={{ flex: 1 }} />
          </View>
          <Input placeholder={t('dashboard.mealFrequencyPlaceholder')} value={mealFrequency} onChangeText={setMealFrequency} />
          <Input placeholder={t('dashboard.mealFrequencyReasonPlaceholder')} value={mealFrequencyReason} onChangeText={setMealFrequencyReason} multiline />

          {/* Ingredients repeater */}
          <Text style={styles.label}>{t('dashboard.ingredients')}</Text>
          {ingredients.map((ingredient, i) => (
            <View key={i} style={styles.repeaterRow}>
              <Input
                placeholder={t('dashboard.name')}
                value={ingredient.name}
                onChangeText={(val) =>
                  setIngredients((arr) => arr.map((x, xi) => (xi === i ? { ...x, name: val } : x)))
                }
                style={{ flex: 1.6 }}
              />
              <Input
                placeholder={t('dashboard.qty')}
                value={ingredient.quantity}
                onChangeText={(val) =>
                  setIngredients((arr) => arr.map((x, xi) => (xi === i ? { ...x, quantity: val } : x)))
                }
                style={{ flex: 0.7 }}
              />
              <Input
                placeholder={t('dashboard.unit')}
                value={ingredient.unit}
                onChangeText={(val) =>
                  setIngredients((arr) => arr.map((x, xi) => (xi === i ? { ...x, unit: val } : x)))
                }
                style={{ flex: 0.7 }}
              />
              <TouchableOpacity
                onPress={() => setIngredients((arr) => arr.filter((_, xi) => xi !== i))}
                disabled={ingredients.length === 1}
                style={[styles.removeBtn, ingredients.length === 1 && { opacity: 0.3 }]}
              >
                <Ionicons name="remove" size={16} color={colors.danger} />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            style={styles.addRow}
            onPress={() => setIngredients((arr) => [...arr, { name: '', quantity: '', unit: '' }])}
          >
            <Ionicons name="add" size={16} color={colors.brandDark} />
            <Text style={styles.addRowText}>{t('dashboard.addIngredient')}</Text>
          </TouchableOpacity>

          {/* Steps repeater */}
          <Text style={styles.label}>{t('dashboard.steps')}</Text>
          {steps.map((step, i) => (
            <View key={i} style={styles.repeaterRow}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{i + 1}</Text>
              </View>
              <Input
                placeholder={t('dashboard.instruction')}
                value={step.instruction}
                onChangeText={(val) =>
                  setSteps((arr) => arr.map((x, xi) => (xi === i ? { ...x, instruction: val } : x)))
                }
                style={{ flex: 1 }}
              />
              <Input
                placeholder={t('dashboard.min')}
                value={step.durationMinutes}
                onChangeText={(val) =>
                  setSteps((arr) => arr.map((x, xi) => (xi === i ? { ...x, durationMinutes: val } : x)))
                }
                keyboardType="number-pad"
                style={{ width: 74 }}
              />
              <TouchableOpacity
                onPress={() => setSteps((arr) => arr.filter((_, xi) => xi !== i))}
                disabled={steps.length === 1}
                style={[styles.removeBtn, steps.length === 1 && { opacity: 0.3 }]}
              >
                <Ionicons name="remove" size={16} color={colors.danger} />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            style={styles.addRow}
            onPress={() => setSteps((arr) => [...arr, { instruction: '', durationMinutes: '' }])}
          >
            <Ionicons name="add" size={16} color={colors.brandDark} />
            <Text style={styles.addRowText}>{t('dashboard.addStep')}</Text>
          </TouchableOpacity>

          <Input placeholder={t('dashboard.foodStoryPlaceholder')} value={story} onChangeText={setStory} multiline />

          {/* Optional media */}
          <View style={styles.row2}>
            <TouchableOpacity
              style={[styles.mediaBtn, videoUrl ? styles.mediaBtnDone : null]}
              onPress={() => pickAndUpload('video', setVideoUrl)}
            >
              <Ionicons name="videocam-outline" size={18} color={videoUrl ? colors.success : colors.inkSoft} />
              <Text style={styles.mediaText}>
                {uploading === 'video' ? t('dashboard.uploading') : videoUrl ? t('dashboard.videoAdded') : t('dashboard.addVideo')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.mediaBtn, audioUrl ? styles.mediaBtnDone : null]}
              onPress={() => pickAndUpload('audio', setAudioUrl)}
            >
              <Ionicons name="mic-outline" size={18} color={audioUrl ? colors.success : colors.inkSoft} />
              <Text style={styles.mediaText}>
                {uploading === 'audio' ? t('dashboard.uploading') : audioUrl ? t('dashboard.audioAdded') : t('dashboard.addAudio')}
              </Text>
            </TouchableOpacity>
          </View>

          <PrimaryButton
            title={t('dashboard.submitForReview')}
            disabled={!valid || uploading !== null}
            loading={submit.isPending}
            onPress={() => submit.mutate()}
            style={{ marginTop: 8 }}
          />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    imagePick: { borderRadius: 20, overflow: 'hidden', ...shadow },
    imagePreview: { width: '100%', height: 170 },
    imagePlaceholder: {
      height: 150,
      borderRadius: 20,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: colors.inkFaint,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    imageHint: { fontSize: 13, color: colors.inkFaint },
    label: { fontSize: 14, fontWeight: '600', color: colors.ink, marginTop: 6 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    row2: { flexDirection: 'row', gap: 10 },
    repeaterRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    removeBtn: {
      width: 30,
      height: 30,
      borderRadius: 15,
      borderWidth: 1.5,
      borderColor: '#FDECEC',
      alignItems: 'center',
      justifyContent: 'center',
    },
    addRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
    addRowText: { fontSize: 13.5, color: colors.brandDark, fontWeight: '600' },
    stepNum: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: colors.accentLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepNumText: { fontSize: 12, fontWeight: '700', color: colors.accentDark },
    mediaBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.surface,
      borderRadius: 999,
      paddingVertical: 13,
    },
    mediaBtnDone: { backgroundColor: '#E7F8EF' },
    mediaText: { fontSize: 13, color: colors.inkSoft, fontWeight: '600' },
  });
