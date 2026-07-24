import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, ApiError } from '@/api';
import { IMG } from '@/config';
import { addToShoppingList } from '@/shoppingList';
import { colors, radius, shadow, shadowStrong } from '@/theme';
import type { IngredientScanResult, RecipeMatch, SnapResult } from '@/types';

type Phase = 'input' | 'analyzing' | 'results' | 'dish' | 'error';
type Method = 'camera' | 'type';

const DIFF_COLOR: Record<string, string> = {
  Easy: colors.success,
  Medium: colors.accent,
  Hard: colors.danger,
};

async function compress(uri: string): Promise<string> {
  const out = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: 1024 } }], {
    compress: 0.7,
    format: ImageManipulator.SaveFormat.JPEG,
  });
  return out.uri;
}

export default function Snap() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [phase, setPhase] = useState<Phase>('input');
  const [method, setMethod] = useState<Method>('camera');
  const [dishMode, setDishMode] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [scan, setScan] = useState<IngredientScanResult | null>(null);
  const [dish, setDish] = useState<SnapResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // typed ingredients
  const [entry, setEntry] = useState('');
  const [typed, setTyped] = useState<string[]>([]);

  const analyzePhoto = async (uri: string) => {
    setPreview(uri);
    setPhase('analyzing');
    try {
      const compressed = await compress(uri);
      const file = { uri: compressed, name: 'photo.jpg', mimeType: 'image/jpeg' };
      if (dishMode) {
        const res = await api.snap<SnapResult>(file);
        setDish(res);
        setPhase('dish');
      } else {
        const res = await api.snapIngredients<IngredientScanResult>(file);
        setScan(res);
        setPhase('results');
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (e) {
      setErrorMsg(e instanceof ApiError ? e.message : 'Something went wrong. Please try again.');
      setPhase('error');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    }
  };

  const findFromTyped = async () => {
    if (typed.length === 0) return Alert.alert('Add ingredients', 'Add at least one ingredient first.');
    setPreview(null);
    setPhase('analyzing');
    try {
      const res = await api.post<IngredientScanResult>('/snap/recommend', { ingredients: typed });
      setScan(res);
      setPhase('results');
    } catch (e) {
      setErrorMsg(e instanceof ApiError ? e.message : 'Something went wrong. Please try again.');
      setPhase('error');
    }
  };

  const takePhoto = async () => {
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.8 });
      if (photo?.uri) analyzePhoto(photo.uri);
    } catch {
      setErrorMsg('Could not take the photo. Please try again.');
      setPhase('error');
    }
  };

  const pickFromGallery = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 });
    if (!res.canceled && res.assets[0]) analyzePhoto(res.assets[0].uri);
  };

  const addTyped = () => {
    const v = entry.trim().toLowerCase();
    if (v && !typed.includes(v)) setTyped((t) => [...t, v]);
    setEntry('');
  };

  const reset = () => {
    setScan(null);
    setDish(null);
    setPreview(null);
    setErrorMsg('');
    setPhase('input');
  };

  const Header = ({ light }: { light?: boolean }) => (
    <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
      <TouchableOpacity onPress={() => router.back()} hitSlop={10} style={styles.hIcon}>
        <Ionicons name="chevron-back" size={24} color={light ? '#FFF' : colors.ink} />
      </TouchableOpacity>
      <Text style={[styles.hTitle, light && { color: '#FFF' }]}>Snap & Cook</Text>
      <TouchableOpacity onPress={() => router.push('/shopping-list')} hitSlop={10} style={styles.hIcon}>
        <Ionicons name="cart-outline" size={22} color={light ? '#FFF' : colors.ink} />
      </TouchableOpacity>
    </View>
  );

  // ---------- ANALYZING ----------
  if (phase === 'analyzing') {
    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        {preview ? <Image source={{ uri: preview }} style={StyleSheet.absoluteFill} contentFit="cover" /> : (
          <LinearGradient colors={[colors.blue, colors.brand]} style={StyleSheet.absoluteFill} />
        )}
        <View style={styles.analyzeOverlay}>
          <ActivityIndicator color="#FFF" size="large" />
          <Text style={styles.analyzeText}>{dishMode ? 'Identifying your dish…' : 'Finding recipes you can make…'}</Text>
          <Text style={styles.analyzeSub}>{dishMode ? 'Reading the plate' : 'Detecting ingredients & matching recipes'}</Text>
        </View>
      </View>
    );
  }

  // ---------- ERROR ----------
  if (phase === 'error') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Header />
        <View style={styles.center}>
          <View style={styles.errIcon}><Ionicons name="alert-circle" size={40} color={colors.danger} /></View>
          <Text style={styles.errTitle}>Couldn't do that</Text>
          <Text style={styles.errSub}>{errorMsg}</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={reset}>
            <Ionicons name="refresh" size={18} color="#FFF" />
            <Text style={styles.primaryBtnText}>Try again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ---------- RESULTS (ingredient scan) ----------
  if (phase === 'results' && scan) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Header />
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40, gap: 16 }} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.duration(350)}>
            <Text style={styles.sectionTitle}>Detected ingredients</Text>
            <View style={styles.chipWrap}>
              {scan.detectedIngredients.map((d) => (
                <View key={d.name} style={styles.detChip}>
                  <Ionicons name="checkmark-circle" size={13} color={colors.success} />
                  <Text style={styles.detChipText}>{d.name}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          <Text style={styles.sectionTitle}>
            {scan.recommendations.length} recipe{scan.recommendations.length === 1 ? '' : 's'} you can make
          </Text>
          {scan.recommendations.length === 0 ? (
            <Text style={styles.empty}>No matches yet — try adding a few more ingredients.</Text>
          ) : (
            scan.recommendations.map((m, i) => <RecCard key={m.recipe.id} m={m} index={i} />)
          )}

          <TouchableOpacity style={styles.ghostBtn} onPress={reset}>
            <Ionicons name="camera-outline" size={18} color={colors.ink} />
            <Text style={styles.ghostBtnText}>Scan again</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ---------- DISH result ----------
  if (phase === 'dish' && dish) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Header />
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40, gap: 16 }}>
          {preview ? <Image source={{ uri: preview }} style={styles.dishPhoto} contentFit="cover" /> : null}
          <View>
            <Text style={styles.dishName}>{dish.dishName}</Text>
            {dish.cuisine ? <Text style={styles.dishCuisine}>{dish.cuisine} cuisine · {dish.confidence}% match</Text> : null}
            {dish.description ? <Text style={styles.dishDesc}>{dish.description}</Text> : null}
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Nutrition · per serving</Text>
            <View style={styles.macroRow}>
              {[['Calories', dish.nutrition.calories, 'kcal'], ['Protein', dish.nutrition.protein, 'g'], ['Carbs', dish.nutrition.carbs, 'g'], ['Fat', dish.nutrition.fat, 'g']].map(([l, v, u]) => (
                <View key={l as string} style={styles.macro}>
                  <Text style={styles.macroV}>{v as number}</Text>
                  <Text style={styles.macroU}>{u as string}</Text>
                  <Text style={styles.macroL}>{l as string}</Text>
                </View>
              ))}
            </View>
          </View>
          {dish.ingredients.length > 0 ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Ingredients</Text>
              {dish.ingredients.map((ing, i) => (
                <View key={i} style={styles.liRow}><View style={styles.bullet} /><Text style={styles.liName}>{ing.name}</Text>{ing.quantity ? <Text style={styles.liQty}>{ing.quantity}</Text> : null}</View>
              ))}
            </View>
          ) : null}
          {dish.steps.length > 0 ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>How to cook it</Text>
              {dish.steps.map((s) => (
                <View key={s.number} style={styles.stepRow}><View style={styles.stepNum}><Text style={styles.stepNumT}>{s.number}</Text></View><Text style={styles.stepT}>{s.instruction}</Text></View>
              ))}
            </View>
          ) : null}
          <TouchableOpacity style={styles.primaryBtn} onPress={reset}>
            <Ionicons name="camera" size={18} color="#FFF" />
            <Text style={styles.primaryBtnText}>Snap another</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ---------- INPUT ----------
  // Typed-ingredient input
  if (method === 'type') {
    return (
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Header />
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled">
          <ModeToggle method={method} setMethod={setMethod} dishMode={dishMode} setDishMode={setDishMode} />
          <Text style={styles.sectionTitle}>What's in your kitchen?</Text>
          <Text style={styles.hint}>Add the ingredients you have and we'll find recipes you can cook.</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={entry}
              onChangeText={setEntry}
              placeholder="e.g. tomato, onion, egg…"
              placeholderTextColor={colors.inkFaint}
              onSubmitEditing={addTyped}
              autoCapitalize="none"
              returnKeyType="done"
            />
            <TouchableOpacity style={styles.addBtn} onPress={addTyped}>
              <Ionicons name="add" size={22} color="#FFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.chipWrap}>
            {typed.map((t) => (
              <TouchableOpacity key={t} style={styles.typedChip} onPress={() => setTyped((arr) => arr.filter((x) => x !== t))}>
                <Text style={styles.typedChipText}>{t}</Text>
                <Ionicons name="close" size={13} color={colors.brandDark} />
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={[styles.primaryBtn, typed.length === 0 && { opacity: 0.5 }]} onPress={findFromTyped} disabled={typed.length === 0}>
            <Ionicons name="sparkles" size={18} color="#FFF" />
            <Text style={styles.primaryBtnText}>Find recipes</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // Camera input
  if (!permission) {
    return <View style={styles.center}><ActivityIndicator color={colors.brandDark} /></View>;
  }
  if (!permission.granted) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Header />
        <View style={styles.center}>
          <ModeToggle method={method} setMethod={setMethod} dishMode={dishMode} setDishMode={setDishMode} />
          <View style={styles.permIcon}><Ionicons name="camera" size={40} color={colors.brandDark} /></View>
          <Text style={styles.errTitle}>Camera access</Text>
          <Text style={styles.errSub}>
            {dishMode ? 'Point at a dish to identify it and get the recipe.' : 'Point at your ingredients to get recipe ideas.'} You can also type or pick from your gallery.
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={requestPermission}><Text style={styles.primaryBtnText}>Enable camera</Text></TouchableOpacity>
          <TouchableOpacity style={styles.ghostBtn} onPress={() => setMethod('type')}>
            <Ionicons name="create-outline" size={18} color={colors.ink} /><Text style={styles.ghostBtnText}>Type ingredients instead</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
      <Header light />
      <View style={styles.camTop}>
        <View style={styles.camModePill}>
          <Text style={styles.camModeText}>{dishMode ? 'Identify a dish' : 'Cook with ingredients'}</Text>
        </View>
      </View>
      <View style={styles.reticle} pointerEvents="none" />
      <Text style={[styles.camHint, { bottom: insets.bottom + 150 }]}>
        {dishMode ? 'Frame the whole plate' : 'Frame your ingredients, then tap'}
      </Text>
      <View style={[styles.camControls, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity style={styles.galleryBtn} onPress={pickFromGallery}><Ionicons name="images" size={24} color="#FFF" /></TouchableOpacity>
        <TouchableOpacity style={styles.shutter} onPress={takePhoto} activeOpacity={0.8}><View style={styles.shutterInner} /></TouchableOpacity>
        <TouchableOpacity style={styles.galleryBtn} onPress={() => setMethod('type')}><Ionicons name="create-outline" size={24} color="#FFF" /></TouchableOpacity>
      </View>
      <View style={[styles.camToggleWrap, { top: insets.top + 54 }]}>
        <TouchableOpacity style={styles.camToggle} onPress={() => setDishMode((d) => !d)}>
          <Ionicons name="swap-horizontal" size={15} color="#FFF" />
          <Text style={styles.camToggleText}>{dishMode ? 'Switch to ingredients' : 'Switch to dish'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ModeToggle({ method, setMethod, dishMode, setDishMode }: { method: Method; setMethod: (m: Method) => void; dishMode: boolean; setDishMode: (b: boolean) => void }) {
  return (
    <View style={{ gap: 10, marginBottom: 6 }}>
      <View style={styles.seg}>
        <TouchableOpacity style={[styles.segBtn, method === 'camera' && styles.segActive]} onPress={() => setMethod('camera')}>
          <Ionicons name="camera" size={15} color={method === 'camera' ? '#FFF' : colors.inkSoft} />
          <Text style={[styles.segText, method === 'camera' && styles.segTextActive]}>Snap</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.segBtn, method === 'type' && styles.segActive]} onPress={() => setMethod('type')}>
          <Ionicons name="create-outline" size={15} color={method === 'type' ? '#FFF' : colors.inkSoft} />
          <Text style={[styles.segText, method === 'type' && styles.segTextActive]}>Type</Text>
        </TouchableOpacity>
      </View>
      {method === 'camera' ? (
        <TouchableOpacity style={styles.dishToggle} onPress={() => setDishMode(!dishMode)}>
          <Text style={styles.dishToggleText}>{dishMode ? 'Mode: identify a dish' : 'Mode: cook with ingredients'}</Text>
          <Text style={styles.dishToggleSwap}>switch</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function RecCard({ m, index }: { m: RecipeMatch; index: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const r = m.recipe;
  const addMissing = async () => {
    const n = await addToShoppingList(m.missingIngredients.map((i) => ({ name: i.name, note: i.substitution })));
    Haptics.selectionAsync().catch(() => {});
    Alert.alert('Shopping list', n > 0 ? `Added ${n} item${n === 1 ? '' : 's'} to your shopping list.` : 'Those are already on your list.');
  };
  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(360)} style={styles.recCard}>
      <TouchableOpacity activeOpacity={0.85} onPress={() => setOpen((o) => !o)}>
        <View style={styles.recTop}>
          {r.imageUrl ? <Image source={{ uri: IMG(r.imageUrl) }} style={styles.recImg} contentFit="cover" /> : <View style={[styles.recImg, styles.recImgFallback]}><Ionicons name="restaurant" size={20} color={colors.inkFaint} /></View>}
          <View style={{ flex: 1 }}>
            <Text style={styles.recTitle} numberOfLines={1}>{r.title}</Text>
            <View style={styles.recMetaRow}>
              <View style={[styles.diffBadge, { backgroundColor: (DIFF_COLOR[m.difficulty] ?? colors.inkSoft) + '22' }]}>
                <Text style={[styles.diffText, { color: DIFF_COLOR[m.difficulty] ?? colors.inkSoft }]}>{m.difficulty}</Text>
              </View>
              <View style={styles.metaItem}><Ionicons name="time-outline" size={12} color={colors.inkSoft} /><Text style={styles.metaText}>{m.cookTimeMinutes}m</Text></View>
              <View style={styles.metaItem}><Ionicons name="flame-outline" size={12} color={colors.inkSoft} /><Text style={styles.metaText}>{r.calories}kcal</Text></View>
            </View>
          </View>
          <View style={styles.matchBadge}>
            <Text style={styles.matchPct}>{m.matchPercent}%</Text>
            <Text style={styles.matchLbl}>match</Text>
          </View>
        </View>
        <View style={styles.matchBar}><View style={[styles.matchFill, { width: `${m.matchPercent}%` }]} /></View>
        <View style={styles.recFootRow}>
          <Text style={styles.haveText}><Ionicons name="checkmark-circle" size={12} color={colors.success} /> {m.haveIngredients.length} you have</Text>
          {m.missingIngredients.length > 0 ? <Text style={styles.missText}>{m.missingIngredients.length} missing</Text> : <Text style={styles.readyText}>Ready to cook!</Text>}
          <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={colors.inkFaint} />
        </View>
      </TouchableOpacity>

      {open ? (
        <Animated.View entering={FadeIn.duration(220)} style={styles.recExpand}>
          {m.missingIngredients.length > 0 ? (
            <>
              <Text style={styles.expandLabel}>Missing ingredients</Text>
              {m.missingIngredients.map((mi) => (
                <View key={mi.name} style={styles.missRow}>
                  <Ionicons name="ellipse-outline" size={14} color={colors.accentDark} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.missName}>{mi.name}{mi.quantity ? <Text style={styles.missQty}>  {mi.quantity}</Text> : null}</Text>
                    {mi.substitution ? <Text style={styles.subText}>↔ use {mi.substitution}</Text> : null}
                  </View>
                </View>
              ))}
            </>
          ) : null}
          <View style={styles.recActions}>
            <TouchableOpacity style={styles.recActionOutline} onPress={() => router.push({ pathname: '/recipe/[id]', params: { id: String(r.id) } })}>
              <Ionicons name="book-outline" size={16} color={colors.brandDark} />
              <Text style={styles.recActionOutlineText}>View recipe</Text>
            </TouchableOpacity>
            {m.missingIngredients.length > 0 ? (
              <TouchableOpacity style={styles.recActionFill} onPress={addMissing}>
                <Ionicons name="cart" size={16} color="#FFF" />
                <Text style={styles.recActionFillText}>Add missing</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 10 },
  hIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  hTitle: { fontSize: 17, fontWeight: '800', color: colors.ink },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30, gap: 6 },
  permIcon: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.brandLight, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  errIcon: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#FDEBEC', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  errTitle: { fontSize: 20, fontWeight: '800', color: colors.ink, marginTop: 6 },
  errSub: { fontSize: 13.5, color: colors.inkSoft, textAlign: 'center', lineHeight: 20, marginTop: 4 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, alignSelf: 'stretch', backgroundColor: colors.accent, borderRadius: 999, height: 52, marginTop: 20 },
  primaryBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  ghostBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14 },
  ghostBtnText: { color: colors.ink, fontSize: 14, fontWeight: '600' },

  seg: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 999, padding: 4 },
  segBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 40, borderRadius: 999 },
  segActive: { backgroundColor: colors.brandDark },
  segText: { fontSize: 13.5, fontWeight: '700', color: colors.inkSoft },
  segTextActive: { color: '#FFF' },
  dishToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6 },
  dishToggleText: { fontSize: 12.5, color: colors.inkSoft, fontWeight: '600' },
  dishToggleSwap: { fontSize: 12.5, color: colors.blueDark, fontWeight: '700' },

  sectionTitle: { fontSize: 17, fontWeight: '800', color: colors.ink },
  hint: { fontSize: 13.5, color: colors.inkSoft, lineHeight: 20, marginTop: -6 },
  inputRow: { flexDirection: 'row', gap: 10 },
  input: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: 16, height: 50, fontSize: 15, color: colors.ink },
  addBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typedChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.brandLight, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  typedChipText: { fontSize: 13, fontWeight: '700', color: colors.brandDark, textTransform: 'capitalize' },
  detChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#E4F7EC', borderRadius: 999, paddingHorizontal: 11, paddingVertical: 7 },
  detChipText: { fontSize: 12.5, fontWeight: '700', color: colors.ink, textTransform: 'capitalize' },
  empty: { fontSize: 13.5, color: colors.inkFaint, fontStyle: 'italic' },

  recCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 14, ...shadow },
  recTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  recImg: { width: 56, height: 56, borderRadius: 14, backgroundColor: colors.surfaceAlt },
  recImgFallback: { alignItems: 'center', justifyContent: 'center' },
  recTitle: { fontSize: 15.5, fontWeight: '800', color: colors.ink },
  recMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5 },
  diffBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  diffText: { fontSize: 11, fontWeight: '800' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  metaText: { fontSize: 11.5, color: colors.inkSoft, fontWeight: '600' },
  matchBadge: { alignItems: 'center' },
  matchPct: { fontSize: 18, fontWeight: '800', color: colors.brandDark },
  matchLbl: { fontSize: 9.5, color: colors.inkFaint, marginTop: -2 },
  matchBar: { height: 6, borderRadius: 3, backgroundColor: colors.surfaceAlt, overflow: 'hidden', marginTop: 12 },
  matchFill: { height: '100%', borderRadius: 3, backgroundColor: colors.brand },
  recFootRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  haveText: { fontSize: 12, color: colors.inkSoft, fontWeight: '600', flex: 1 },
  missText: { fontSize: 12, color: colors.accentDark, fontWeight: '700' },
  readyText: { fontSize: 12, color: colors.success, fontWeight: '700' },
  recExpand: { marginTop: 12, borderTopWidth: 1, borderTopColor: colors.surfaceAlt, paddingTop: 12, gap: 8 },
  expandLabel: { fontSize: 11.5, fontWeight: '800', color: colors.inkSoft, textTransform: 'uppercase', letterSpacing: 0.4 },
  missRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  missName: { fontSize: 13.5, color: colors.ink, fontWeight: '600', textTransform: 'capitalize' },
  missQty: { fontSize: 12, color: colors.inkFaint, fontWeight: '500' },
  subText: { fontSize: 12, color: colors.brandDark, marginTop: 1 },
  recActions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  recActionOutline: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 44, borderRadius: 999, borderWidth: 1.5, borderColor: colors.brandLight },
  recActionOutlineText: { fontSize: 13.5, fontWeight: '700', color: colors.brandDark },
  recActionFill: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 44, borderRadius: 999, backgroundColor: colors.accent },
  recActionFillText: { fontSize: 13.5, fontWeight: '700', color: '#FFF' },

  // camera
  camTop: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center', paddingTop: 4 },
  camModePill: { backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 },
  camModeText: { color: '#FFF', fontSize: 12.5, fontWeight: '700' },
  camToggleWrap: { position: 'absolute', right: 16 },
  camToggle: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  camToggleText: { color: '#FFF', fontSize: 11.5, fontWeight: '700' },
  reticle: { position: 'absolute', top: '24%', left: '10%', right: '10%', height: '44%', borderWidth: 2, borderColor: 'rgba(255,255,255,0.8)', borderRadius: 28 },
  camHint: { position: 'absolute', alignSelf: 'center', color: '#FFF', fontSize: 13, fontWeight: '600', textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 6 },
  camControls: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 40 },
  galleryBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  shutter: { width: 78, height: 78, borderRadius: 39, borderWidth: 5, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#FFF' },
  analyzeOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', gap: 8 },
  analyzeText: { color: '#FFF', fontSize: 17, fontWeight: '700', marginTop: 8 },
  analyzeSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },

  // dish
  dishPhoto: { width: '100%', height: 210, borderRadius: radius.lg, backgroundColor: colors.surfaceAlt },
  dishName: { fontSize: 24, fontWeight: '800', color: colors.ink },
  dishCuisine: { fontSize: 13, color: colors.accentDark, fontWeight: '600', marginTop: 4 },
  dishDesc: { fontSize: 14, color: colors.inkSoft, lineHeight: 21, marginTop: 8 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, ...shadow },
  cardTitle: { fontSize: 12, fontWeight: '800', color: colors.inkSoft, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 12 },
  macroRow: { flexDirection: 'row', justifyContent: 'space-between' },
  macro: { alignItems: 'center', flex: 1 },
  macroV: { fontSize: 20, fontWeight: '800', color: colors.ink },
  macroU: { fontSize: 11, color: colors.inkFaint, marginTop: -2 },
  macroL: { fontSize: 11.5, color: colors.inkSoft, marginTop: 4 },
  liRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent },
  liName: { fontSize: 14, color: colors.ink, flex: 1 },
  liQty: { fontSize: 13, color: colors.inkSoft, fontWeight: '600' },
  stepRow: { flexDirection: 'row', gap: 12, paddingVertical: 8 },
  stepNum: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
  stepNumT: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  stepT: { fontSize: 14, color: colors.ink, lineHeight: 21, flex: 1, marginTop: 2 },
});
