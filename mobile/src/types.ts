// DTO types mirroring docs/API.md exactly.

export type Country = 'GH' | 'NG';
export type Currency = 'GHS' | 'NGN';
export type Role = 'USER' | 'VENDOR' | 'ADMIN';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  country: Country;
  avatarUrl: string | null;
  premium: boolean;
  premiumUntil: string | null;
  vendorId: number | null;
  emailVerified: boolean;
  pendingEmail: string | null;
}

export type VendorType = 'FOOD' | 'INGREDIENT' | 'BOTH';

export interface Vendor {
  id: number;
  name: string;
  bio: string;
  country: Country;
  logoUrl: string | null;
  coverUrl: string | null;
  type: VendorType;
  status: ApprovalStatus;
  rejectionFeedback: string | null;
  rating: number;
  reviewCount: number;
  specialty: string;
  location: string;
  phone: string;
}

export interface Ingredient {
  name: string;
  quantity: string;
  unit: string;
}

export interface RecipeStep {
  stepNumber: number;
  instruction: string;
  durationMinutes: number | null;
  imageUrl: string | null;
}

export type RecipeCategory = 'LOCAL' | 'CONTINENTAL' | 'FOREIGN' | 'DRINK';
export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK' | 'DRINK';

export interface Recipe {
  id: number;
  title: string;
  description: string;
  category: RecipeCategory;
  cuisine: string;
  countryOfOrigin: string;
  mealType: MealType;
  imageUrl: string | null;
  calories: number;
  servings: number;
  prepMinutes: number;
  cookMinutes: number;
  mealFrequency: string;
  mealFrequencyReason: string;
  ingredients: Ingredient[];
  steps: RecipeStep[];
  story: string | null;
  storyImageUrl: string | null;
  videoUrl: string | null;
  /** Public YouTube search link for the dish — never premium-gated. */
  videoSearchUrl: string | null;
  audioUrl: string | null;
  hasVideo: boolean;
  hasAudio: boolean;
  vendorId: number | null;
  vendorName: string | null;
  status: ApprovalStatus;
  rating: number;
  reviewCount: number;
  savedByMe: boolean;
  cookedByMe: boolean;
}

export type ListingType = 'FOOD' | 'INGREDIENT';

export interface Listing {
  id: number;
  type: ListingType;
  title: string;
  description: string;
  imageUrl: string | null;
  amountMinor: number;
  currency: Currency;
  compareAtMinor: number | null;
  country: Country;
  available: boolean;
  stockQty: number;
  quantity: string;
  unit: string;
  prepMinutes: number | null;
  vendorId: number;
  vendorName: string;
  vendorLogoUrl: string | null;
  status: ApprovalStatus;
  linkedRecipeId: number | null;
}

export interface Review {
  id: number;
  rating: number;
  comment: string;
  userName: string;
  userAvatarUrl: string | null;
  createdAt: string;
}

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'PREPARING'
  | 'READY'
  | 'COMPLETED'
  | 'CANCELLED';

export interface OrderItem {
  listingId: number;
  title: string;
  imageUrl: string | null;
  qty: number;
  amountMinor: number;
}

export interface Order {
  id: number;
  reference: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotalMinor: number;
  feeMinor: number;
  deliveryMinor: number;
  totalMinor: number;
  currency: Currency;
  vendorId: number;
  vendorName: string;
  createdAt: string;
}

export interface PaystackInit {
  authorizationUrl: string;
  reference: string;
  publicKey: string;
  amountMinor: number;
  currency: Currency;
}

export interface Plan {
  code: string;
  name: string;
  amountMinorGHS: number;
  amountMinorNGN: number;
  interval: string;
  features: string[];
}

export interface PassportStamp {
  country: string;
  countryName: string;
  cuisine: string;
  flagEmoji: string;
  recipesCooked: number;
  totalRecipes: number;
  stamped: boolean;
  firstCookedAt: string | null;
}

export interface Passport {
  stamps: PassportStamp[];
  countriesStamped: number;
  totalCooked: number;
}

export interface Story {
  id: number;
  recipeId: number;
  title: string;
  body: string;
  imageUrl: string | null;
  cuisine: string;
  countryName: string;
  vendorName: string | null;
}

export interface ChatThread {
  id: number;
  vendorId: number;
  vendorName: string;
  vendorLogoUrl: string | null;
  lastMessage: string | null;
  lastAt: string | null;
  unread: number;
}

export interface ChatMessage {
  id: number;
  threadId: number;
  senderId: number;
  senderName: string;
  mine: boolean;
  body: string;
  createdAt: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
}

export interface BasketItem {
  ingredient: Ingredient;
  listing: Listing;
  qty: number;
}

export interface Basket {
  vendor: Vendor | null;
  items: BasketItem[];
  totalMinor: number;
  currency: Currency;
  unmatched: Ingredient[];
}

export interface AuthResponse {
  token: string;
  /** Long-lived rotation token; present once the backend issues refresh tokens. */
  refreshToken?: string;
  user: User;
}

// --- Notifications (Phase 5) ---
export type NotificationType =
  | 'MEAL_UPDATE'
  | 'ORDER_UPDATE'
  | 'RECOMMENDATION'
  | 'SECURITY'
  | 'ANNOUNCEMENT'
  | 'PROMOTION';

export interface AppNotification {
  id: number;
  type: NotificationType;
  title: string;
  body: string;
  /** Optional in-app route to open on tap, e.g. "/orders". */
  deepLink: string | null;
  imageUrl: string | null;
  read: boolean;
  createdAt: string;
}

export interface UnreadCount {
  unread: number;
}

// --- Feedback (Phase 8) ---
export type FeedbackType = 'BUG' | 'FEATURE' | 'GENERAL' | 'RATING';
export type FeedbackStatus = 'NEW' | 'IN_REVIEW' | 'RESOLVED';

export interface Feedback {
  id: number;
  type: FeedbackType;
  message: string;
  rating: number | null;
  screenshotUrl: string | null;
  status: FeedbackStatus;
  createdAt: string;
}

export interface CreateFeedbackRequest {
  type: FeedbackType;
  message: string;
  rating?: number | null;
  screenshotUrl?: string | null;
  deviceInfo?: string | null;
  appVersion?: string | null;
}

export interface CookedResponse {
  stamp: PassportStamp;
  newStamp: boolean;
}

export interface SmartSearchFilters {
  q: string | null;
  category: RecipeCategory | null;
  maxCalories: number | null;
  maxMinutes: number | null;
  cuisine: string | null;
}

export interface SmartSearchResponse {
  filters: SmartSearchFilters;
  recipes: Recipe[];
}

export interface AssistantMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AssistantResponse {
  reply: string;
  recipes: Recipe[];
}

export interface SubscriptionMe {
  premium: boolean;
  premiumUntil: string | null;
  planCode: string | null;
}

export interface OrderCreateResponse {
  order: Order;
  payment: PaystackInit;
}

// --- Snap & Cook ---
export interface SnapIngredient {
  name: string;
  quantity: string;
}

export interface SnapStep {
  number: number;
  instruction: string;
}

export interface SnapNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servings: number;
}

export interface SnapResult {
  dishName: string;
  description: string;
  cuisine: string;
  confidence: number;
  isFood: boolean;
  ingredients: SnapIngredient[];
  steps: SnapStep[];
  nutrition: SnapNutrition;
  matchedRecipes: Recipe[];
}

export interface DetectedIngredient {
  name: string;
  confidence: number;
}

export interface MissingIngredientItem {
  name: string;
  quantity: string | null;
  substitution: string | null;
}

export interface RecipeMatch {
  recipe: Recipe;
  difficulty: string; // Easy | Medium | Hard
  cookTimeMinutes: number;
  matchPercent: number;
  haveIngredients: string[];
  missingIngredients: MissingIngredientItem[];
}

export interface IngredientScanResult {
  detectedIngredients: DetectedIngredient[];
  recommendations: RecipeMatch[];
}

// --- Meal planning & calorie tracking (Phases 4 & 5) ---
export type MealSlot = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK' | 'DRINK';

export interface PlannedMeal {
  id: number;
  date: string; // YYYY-MM-DD
  slot: MealSlot;
  title: string;
  recipeId: number | null;
  imageUrl: string | null;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  eaten: boolean;
  notes: string | null;
}

export interface MacroProgress {
  consumed: number;
  goal: number;
}

export interface DaySummary {
  date: string;
  calorieGoal: number;
  caloriesConsumed: number;
  caloriesRemaining: number;
  caloriesPlanned: number;
  protein: MacroProgress;
  carbs: MacroProgress;
  fat: MacroProgress;
  waterMl: number;
  waterGoalMl: number;
  meals: PlannedMeal[];
}

export interface DayTotals {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  waterMl: number;
}

export interface Goals {
  calorieGoal: number;
  proteinGoal: number;
  carbGoal: number;
  fatGoal: number;
  waterGoalMl: number;
}
