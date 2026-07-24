// Rich local demo data mirroring docs/API.md DTOs, with real photo URLs from
// docs/IMAGES.md so DEMO MODE shows real photography with zero backend.
import type {
  ChatMessage,
  ChatThread,
  Ingredient,
  Listing,
  Order,
  PassportStamp,
  Plan,
  Recipe,
  RecipeStep,
  Review,
  Story,
  User,
  Vendor,
} from '../types';

const U = (id: string, w = 640, h = 480) =>
  `https://images.unsplash.com/${id}?w=${w}&h=${h}&fit=crop&q=80&auto=format`;

// Real, dish-accurate photos (freely-licensed, Wikimedia Commons). See docs/IMAGES.md.
const WM = (path: string) => `https://upload.wikimedia.org/wikipedia/commons/${path}`;

export const PHOTOS = {
  // Indices are chosen so each demo recipe below references the photo of its OWN dish.
  recipe: [
    WM('thumb/0/0a/Jollof_Rice_with_Stew.jpg/960px-Jollof_Rice_with_Stew.jpg'), // 0 jollof
    WM('thumb/5/58/Goat_meat_and_light_soup.jpg/960px-Goat_meat_and_light_soup.jpg'), // 1 light soup + goat
    WM('thumb/7/75/Fish_pepper_soup.jpg/960px-Fish_pepper_soup.jpg'), // 2 pepper soup
    WM('thumb/2/23/Efo_riro_and_pounded_yam.jpg/960px-Efo_riro_and_pounded_yam.jpg'), // 3 pounded yam + efo
    WM('2/29/Fried_rice_and_chicken_garnished_with_sweet_corn%2C_carrot_and_green_peas.jpg'), // 4 west african fried rice
    WM('thumb/a/ab/SuyavarietiesTX.JPG/960px-SuyavarietiesTX.JPG'), // 5 suya
    WM('3/37/Kelewele.jpg'), // 6 kelewele
    WM('f/f9/Red_red_and_ripe_plantain.jpg'), // 7 red red
    WM('thumb/2/26/Moin-Moin-good.jpg/960px-Moin-Moin-good.jpg'), // 8 moi moi
    WM('thumb/f/ff/Fufu.jpg/960px-Fufu.jpg'), // 9 groundnut soup
    WM('thumb/e/e3/%D0%A8%D0%B0%D1%83%D1%80%D0%BC%D0%B0_6.jpg/960px-%D0%A8%D0%B0%D1%83%D1%80%D0%BC%D0%B0_6.jpg'), // 10 chicken shawarma
    WM('thumb/c/c1/Agua_de_Jamaica.jpg/960px-Agua_de_Jamaica.jpg'), // 11 sobolo / hibiscus drink
    WM('c/cd/Waakye_with_vegetables%2C_fish_and_egg_with_ripe_plantains.jpg'), // 12 waakye
    WM('thumb/d/d8/Pot_of_Egusi_soup.jpg/960px-Pot_of_Egusi_soup.jpg'), // 13 egusi soup
    WM('thumb/0/01/Chapman_drink.jpg/960px-Chapman_drink.jpg'), // 14 chapman
    WM('thumb/b/bf/Grilled_tilapia_with_banku.jpg/960px-Grilled_tilapia_with_banku.jpg'), // 15 banku & tilapia
  ],
  listing: [
    WM('thumb/f/fa/Banane_plantain_de_la_RCA.jpg/960px-Banane_plantain_de_la_RCA.jpg'), // 0 plantain
    WM('thumb/b/bf/Grilled_tilapia_with_banku.jpg/960px-Grilled_tilapia_with_banku.jpg'), // 1 banku & tilapia
    WM('thumb/7/75/Fish_pepper_soup.jpg/960px-Fish_pepper_soup.jpg'), // 2 pepper soup
    WM('thumb/f/f8/Basmati_Rice_India%2C_raw.jpg/960px-Basmati_Rice_India%2C_raw.jpg'), // 3 rice (raw)
    WM('thumb/8/89/Tomato_je.jpg/960px-Tomato_je.jpg'), // 4 tomatoes
    WM('thumb/a/ab/SuyavarietiesTX.JPG/960px-SuyavarietiesTX.JPG'), // 5 suya
    WM('thumb/a/a2/Mixed_onions.jpg/960px-Mixed_onions.jpg'), // 6 onions
    WM('thumb/9/97/Scotch_bonnet_chili_pepper.jpg/960px-Scotch_bonnet_chili_pepper.jpg'), // 7 scotch bonnet
    WM('thumb/f/ff/Fufu.jpg/960px-Fufu.jpg'), // 8 groundnut soup
    WM('thumb/2/26/Moin-Moin-good.jpg/960px-Moin-Moin-good.jpg'), // 9 moi moi
    WM('thumb/3/3a/Egusi_soup_with_pounded_yam_and_assorted_meats.jpg/960px-Egusi_soup_with_pounded_yam_and_assorted_meats.jpg'), // 10 egusi + pounded yam
    WM('thumb/f/f5/Whole_raw_chicken_-_Japan_Dec_22_2019.jpeg/960px-Whole_raw_chicken_-_Japan_Dec_22_2019.jpeg'), // 11 whole chicken (raw)
    WM('thumb/4/4a/Palm_oil.jpg/960px-Palm_oil.jpg'), // 12 palm oil
    WM('thumb/c/c5/Black-eyed-pea.jpg/960px-Black-eyed-pea.jpg'), // 13 black-eyed beans
    WM('thumb/0/0a/Jollof_Rice_with_Stew.jpg/960px-Jollof_Rice_with_Stew.jpg'), // 14 jollof
    WM('thumb/3/3d/Ginger_rhizome.jpg/960px-Ginger_rhizome.jpg'), // 15 ginger
    WM('c/cd/Waakye_with_vegetables%2C_fish_and_egg_with_ripe_plantains.jpg'), // 16 waakye
    WM('thumb/2/22/Egusi_seeds.jpg/960px-Egusi_seeds.jpg'), // 17 egusi seeds
    WM('thumb/b/b6/Spices1.jpg/960px-Spices1.jpg'), // 18 spice / yaji
    WM('3/37/Kelewele.jpg'), // 19 kelewele
    WM('thumb/7/72/Yam_at_monday_market_kaduna_state_01.jpg/960px-Yam_at_monday_market_kaduna_state_01.jpg'), // 20 yam tubers
    WM('thumb/a/ad/Dried_crayfish_on_a_tray.jpg/960px-Dried_crayfish_on_a_tray.jpg'), // 21 dried crayfish
    WM('7/7f/Stockfisch.wmt.jpg'), // 22 stockfish
  ],
  vendor: [
    U('photo-1556910103-1c02745aae4d', 512, 512),
    U('photo-1466637574441-749b8f19452f', 512, 512),
    U('photo-1528712306091-ed0763094c98', 512, 512),
    U('photo-1577219491135-ce391730fb2c', 512, 512),
    U('photo-1581299894007-aaa50297cf16', 512, 512),
    U('photo-1600565193348-f74bd3c7ccdf', 512, 512),
  ],
  story: [
    U('photo-1504674900247-0877df9cc836', 640, 800),
    U('photo-1546069901-ba9599a7e63c', 640, 800),
    U('photo-1512621776951-a57141f2eefd', 640, 800),
    U('photo-1540189549336-e6e99c3679fe', 640, 800),
    U('photo-1574484284002-952d92456975', 640, 800),
    U('photo-1585032226651-759b368d7246', 640, 800),
    U('photo-1603133872878-684f208fb84b', 640, 800),
    U('photo-1414235077428-338989a2e8c0', 640, 800),
  ],
  banner: [
    U('photo-1488459716781-31db52582fe9', 1024, 480),
    U('photo-1542838132-92c53300491e', 1024, 480),
    U('photo-1550989460-0adf9ea622e2', 1024, 480),
    WM('thumb/3/35/Market_In_Africa.jpg/960px-Market_In_Africa.jpg'), // 3 African food market
  ],
  avatar: [
    U('photo-1494790108377-be9c29b29330', 256, 256),
    U('photo-1507003211169-0a1dd7228f2d', 256, 256),
    U('photo-1500648767791-00dcc994a43e', 256, 256),
    U('photo-1534528741775-53994a69daeb', 256, 256),
    U('photo-1506794778202-cad84cf45f1d', 256, 256),
    U('photo-1517841905240-472988babdf9', 256, 256),
    U('photo-1539571696357-5a69c17a67c6', 256, 256),
    U('photo-1544005313-94ddf0286df2', 256, 256),
  ],
};

export const demoUser: User = {
  id: 1,
  name: 'Ama Mensah',
  email: 'ama@demo.com',
  role: 'USER',
  country: 'GH',
  avatarUrl: PHOTOS.avatar[0],
  premium: true,
  premiumUntil: '2026-12-31T00:00:00Z',
  vendorId: null,
  emailVerified: true,
  pendingEmail: null,
};

export const demoVendors: Vendor[] = [
  {
    id: 1,
    name: "Auntie Ama's Kitchen",
    bio: 'Home-style Ghanaian cooking, from our clay pots to your table. Every dish carries a story from Osu.',
    country: 'GH',
    logoUrl: PHOTOS.vendor[0],
    coverUrl: PHOTOS.banner[0],
    type: 'BOTH',
    status: 'APPROVED',
    rejectionFeedback: null,
    rating: 4.4,
    reviewCount: 455,
    specialty: 'Ghanaian classics',
    location: 'Osu, Accra',
    phone: '+233 24 000 1111',
  },
  {
    id: 2,
    name: 'Mama Ngozi Foods',
    bio: 'Authentic Naija flavours — egusi, suya spice, and the softest pounded yam in Lagos.',
    country: 'NG',
    logoUrl: PHOTOS.vendor[1],
    coverUrl: PHOTOS.banner[1],
    type: 'BOTH',
    status: 'APPROVED',
    rejectionFeedback: null,
    rating: 4.7,
    reviewCount: 812,
    specialty: 'Nigerian home cooking',
    location: 'Surulere, Lagos',
    phone: '+234 80 222 3333',
  },
  {
    id: 3,
    name: 'Makola Fresh Market',
    bio: 'Fresh produce and pantry staples straight from Makola Market, delivered same day.',
    country: 'GH',
    logoUrl: PHOTOS.vendor[2],
    coverUrl: PHOTOS.banner[2],
    type: 'INGREDIENT',
    status: 'APPROVED',
    rejectionFeedback: null,
    rating: 4.2,
    reviewCount: 233,
    specialty: 'Market-fresh ingredients',
    location: 'Makola, Accra',
    phone: '+233 20 444 5555',
  },
  {
    id: 4,
    name: 'Lagos Spice Hub',
    bio: 'Every spice a Nigerian kitchen needs — ground fresh weekly.',
    country: 'NG',
    logoUrl: PHOTOS.vendor[3],
    coverUrl: PHOTOS.banner[3],
    type: 'INGREDIENT',
    status: 'APPROVED',
    rejectionFeedback: null,
    rating: 4.5,
    reviewCount: 167,
    specialty: 'Spices & dry goods',
    location: 'Yaba, Lagos',
    phone: '+234 81 666 7777',
  },
  {
    id: 5,
    name: 'Chale Chop Bar',
    bio: 'Street-food energy, restaurant quality. Waakye every morning until it sells out.',
    country: 'GH',
    logoUrl: PHOTOS.vendor[4],
    coverUrl: PHOTOS.banner[0],
    type: 'FOOD',
    status: 'APPROVED',
    rejectionFeedback: null,
    rating: 4.8,
    reviewCount: 1024,
    specialty: 'Waakye & street food',
    location: 'Labadi, Accra',
    phone: '+233 26 888 9999',
  },
  {
    id: 6,
    name: 'Naija Bites',
    bio: 'Small chops, big joy. Party trays and single meals across Lagos mainland.',
    country: 'NG',
    logoUrl: PHOTOS.vendor[5],
    coverUrl: PHOTOS.banner[1],
    type: 'FOOD',
    status: 'APPROVED',
    rejectionFeedback: null,
    rating: 4.3,
    reviewCount: 389,
    specialty: 'Small chops & grills',
    location: 'Ikeja, Lagos',
    phone: '+234 90 123 4567',
  },
];

const ing = (name: string, quantity: string, unit: string): Ingredient => ({ name, quantity, unit });

const steps = (
  list: [string, number | null][],
  imageUrl: string | null = null
): RecipeStep[] =>
  list.map(([instruction, durationMinutes], i) => ({
    stepNumber: i + 1,
    instruction,
    durationMinutes,
    imageUrl: i === 0 ? imageUrl : null,
  }));

type RecipeSeed = Omit<
  Recipe,
  | 'videoUrl'
  | 'videoSearchUrl'
  | 'audioUrl'
  | 'hasVideo'
  | 'hasAudio'
  | 'status'
  | 'savedByMe'
  | 'cookedByMe'
> &
  Partial<
    Pick<Recipe, 'videoSearchUrl' | 'hasVideo' | 'hasAudio' | 'savedByMe' | 'cookedByMe'>
  >;

/** Public "watch someone cook this" link. Always resolves, never rots. */
export const youtubeSearch = (title: string) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(`${title} recipe`)}`;

const DEMO_VIDEO =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
const DEMO_AUDIO =
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

const r = (seed: RecipeSeed): Recipe => ({
  videoUrl: DEMO_VIDEO,
  audioUrl: DEMO_AUDIO,
  hasVideo: true,
  hasAudio: true,
  status: 'APPROVED',
  savedByMe: false,
  cookedByMe: false,
  ...seed,
  videoSearchUrl: seed.videoSearchUrl ?? youtubeSearch(seed.title),
});

export const demoRecipes: Recipe[] = [
  r({
    id: 1,
    title: 'Jollof Rice',
    description:
      'The one-pot legend of West Africa — long-grain rice simmered in a smoky, peppery tomato base until every grain glows red-orange.',
    category: 'LOCAL',
    cuisine: 'Ghanaian',
    countryOfOrigin: 'GH',
    mealType: 'LUNCH',
    imageUrl: PHOTOS.recipe[0],
    calories: 620,
    servings: 4,
    prepMinutes: 20,
    cookMinutes: 45,
    mealFrequency: '2-3 times per week',
    mealFrequencyReason:
      'Balanced but rice-heavy; pair with grilled protein and a side of vegetables to round it out.',
    ingredients: [
      ing('Long-grain rice', '3', 'cups'),
      ing('Tomatoes', '6', 'pcs'),
      ing('Onions', '2', 'pcs'),
      ing('Tomato paste', '3', 'tbsp'),
      ing('Scotch bonnet pepper', '2', 'pcs'),
      ing('Chicken stock', '2', 'cups'),
      ing('Vegetable oil', '4', 'tbsp'),
      ing('Curry powder & thyme', '1', 'tbsp'),
    ],
    steps: steps(
      [
        ['Blend tomatoes, one onion and the scotch bonnet into a smooth mix.', 5],
        ['Fry sliced onion in hot oil until golden, then add tomato paste and fry 3 minutes.', 5],
        ['Pour in the blended mix and cook down until it darkens and the oil rises.', 15],
        ['Season with curry, thyme, and stock. Stir in washed rice and coat well.', 5],
        ['Cover with foil and a tight lid; steam on low heat without peeking.', 25],
        ['Fluff gently, let the bottom crisp slightly for that party-jollof smokiness.', 5],
      ],
      PHOTOS.recipe[0]
    ),
    story:
      'No dish sparks more joyful arguments across West Africa than jollof. In Ghana, jollof means basmati aroma at weddings, smoky "party jollof" scooped from giant dadesen pots, and the eternal, loving rivalry with Nigeria over whose pot reigns. Its roots trace to the Wolof people of the Senegambia, whose thieboudienne travelled the coast with traders and evolved in every kitchen it touched.',
    storyImageUrl: PHOTOS.story[0],
    vendorId: 1,
    vendorName: "Auntie Ama's Kitchen",
    rating: 4.8,
    reviewCount: 231,
    savedByMe: true,
  }),
  r({
    id: 2,
    title: 'Waakye',
    description:
      'Ghana’s beloved rice-and-beans breakfast, stained deep burgundy by dried millet leaves and served with shito, gari and spaghetti.',
    category: 'LOCAL',
    cuisine: 'Ghanaian',
    countryOfOrigin: 'GH',
    mealType: 'BREAKFAST',
    imageUrl: PHOTOS.recipe[12],
    calories: 540,
    servings: 4,
    prepMinutes: 15,
    cookMinutes: 60,
    mealFrequency: '2-3 times per week',
    mealFrequencyReason:
      'A hearty combination of complex carbs and legumes — great fuel, best balanced with lighter dinners.',
    ingredients: [
      ing('Rice', '2', 'cups'),
      ing('Black-eyed beans', '1', 'cup'),
      ing('Dried millet leaves (waakye leaves)', '6', 'pcs'),
      ing('Baking soda', '1/4', 'tsp'),
      ing('Salt', '1', 'tsp'),
      ing('Gari & shito to serve', '1', 'cup'),
    ],
    steps: steps(
      [
        ['Soak beans for 30 minutes, then boil with baking soda until almost tender.', 30],
        ['Add washed millet leaves and simmer until the water turns deep red.', 10],
        ['Add rice and salt; top up water just above the mix.', 3],
        ['Cook covered on low until rice is tender and evenly stained.', 20],
        ['Remove leaves, fluff, and serve with shito, gari, boiled egg and spaghetti.', 5],
      ],
      PHOTOS.recipe[12]
    ),
    story:
      'Waakye began as a northern Ghanaian farmer’s meal — rice and beans stretched with what the land gave — and rode south with traders to become Accra’s definitive breakfast. The queue at a good waakye joint at 7am is a civic institution: office workers, schoolkids and taxi drivers all waiting on the same steaming basin wrapped in leaves.',
    storyImageUrl: PHOTOS.story[1],
    vendorId: 5,
    vendorName: 'Chale Chop Bar',
    rating: 4.9,
    reviewCount: 402,
    savedByMe: true,
    cookedByMe: true,
  }),
  r({
    id: 3,
    title: 'Light Soup with Goat',
    description:
      'A clear, fiery Ghanaian tomato broth with tender goat meat — the soup for rainy days and recovery days alike.',
    category: 'LOCAL',
    cuisine: 'Ghanaian',
    countryOfOrigin: 'GH',
    mealType: 'DINNER',
    imageUrl: PHOTOS.recipe[1],
    calories: 380,
    servings: 4,
    prepMinutes: 20,
    cookMinutes: 70,
    mealFrequency: 'Up to 4 times per week',
    mealFrequencyReason: 'Light, protein-rich and low in oil — one of the leaner soups in the canon.',
    ingredients: [
      ing('Goat meat', '800', 'g'),
      ing('Tomatoes', '5', 'pcs'),
      ing('Garden eggs', '3', 'pcs'),
      ing('Onions', '2', 'pcs'),
      ing('Ginger & garlic paste', '2', 'tbsp'),
      ing('Scotch bonnet pepper', '2', 'pcs'),
    ],
    steps: steps(
      [
        ['Season goat with salt, onion, ginger and garlic; steam in its own juices.', 15],
        ['Boil tomatoes, garden eggs and pepper until soft, then blend smooth.', 10],
        ['Pour the blend over the meat, add water and simmer.', 35],
        ['Adjust seasoning; simmer until the broth is light and clear with oil beads.', 10],
        ['Serve steaming hot with fufu or rice balls.', 2],
      ],
      PHOTOS.recipe[1]
    ),
    story:
      'Nkrakra — light soup — is Ghana’s chicken-soup-for-the-soul. It is what your grandmother makes when you are unwell, what welcomes a new mother home, and what anchors the Sunday fufu table. Its clarity is the point: no thickeners, just tomatoes, pepper and patience.',
    storyImageUrl: PHOTOS.story[2],
    vendorId: 1,
    vendorName: "Auntie Ama's Kitchen",
    rating: 4.6,
    reviewCount: 148,
  }),
  r({
    id: 4,
    title: 'Banku & Grilled Tilapia',
    description:
      'Fermented corn-and-cassava dough cooked to a smooth swallow, served with charred whole tilapia and fresh pepper sauce.',
    category: 'LOCAL',
    cuisine: 'Ghanaian',
    countryOfOrigin: 'GH',
    mealType: 'DINNER',
    imageUrl: PHOTOS.recipe[15],
    calories: 710,
    servings: 2,
    prepMinutes: 25,
    cookMinutes: 40,
    mealFrequency: '1-2 times per week',
    mealFrequencyReason: 'Rich and filling; the fermented dough is heavy — enjoy as a weekly treat.',
    ingredients: [
      ing('Corn dough', '500', 'g'),
      ing('Cassava dough', '250', 'g'),
      ing('Whole tilapia', '2', 'pcs'),
      ing('Ginger, garlic & chilli rub', '3', 'tbsp'),
      ing('Tomatoes & onion for pepper sauce', '4', 'pcs'),
    ],
    steps: steps(
      [
        ['Mix corn and cassava dough with water into a smooth slurry.', 5],
        ['Cook on medium heat, stirring hard with a banku ta until thick and stretchy.', 20],
        ['Score tilapia, rub with spice paste, and rest.', 10],
        ['Grill fish over charcoal until the skin blisters.', 15],
        ['Grind fresh pepper sauce and serve everything together.', 5],
      ],
      PHOTOS.recipe[15]
    ),
    story:
      'Along the Ga coast, banku and tilapia is Friday night itself. The smell of charcoal-grilled fish drifting over Labadi beach bars, fingers working hot banku, the sting of kpakpo shito — it is Accra distilled onto one plate.',
    storyImageUrl: PHOTOS.story[3],
    vendorId: 5,
    vendorName: 'Chale Chop Bar',
    rating: 4.7,
    reviewCount: 265,
  }),
  r({
    id: 5,
    title: 'Kelewele',
    description:
      'Ripe plantain cubes tossed in ginger, cayenne and cloves, deep-fried until caramel-crisp — Accra’s favourite night snack.',
    category: 'LOCAL',
    cuisine: 'Ghanaian',
    countryOfOrigin: 'GH',
    mealType: 'SNACK',
    imageUrl: PHOTOS.recipe[6],
    calories: 320,
    servings: 3,
    prepMinutes: 15,
    cookMinutes: 15,
    mealFrequency: '2-3 times per week',
    mealFrequencyReason: 'A fried snack — moderate portions keep it a joy rather than a habit.',
    ingredients: [
      ing('Ripe plantains', '4', 'pcs'),
      ing('Fresh ginger', '3', 'tbsp'),
      ing('Cayenne pepper', '1', 'tsp'),
      ing('Ground cloves & nutmeg', '1/2', 'tsp'),
      ing('Vegetable oil for frying', '2', 'cups'),
    ],
    steps: steps(
      [
        ['Cube plantains; blend ginger, pepper and spices with a splash of water.', 8],
        ['Toss plantain in the spice paste and rest 10 minutes.', 10],
        ['Deep-fry in batches until deep golden with dark caramel edges.', 10],
        ['Drain and serve hot with roasted peanuts.', 2],
      ],
      PHOTOS.recipe[6]
    ),
    story:
      'Kelewele belongs to the night. As dusk falls in Accra, kelewele sellers light their lamps and the ginger-clove perfume pulls in everyone walking home. Recipes are guarded fiercely — every seller’s spice blend is her signature.',
    storyImageUrl: PHOTOS.story[4],
    vendorId: 1,
    vendorName: "Auntie Ama's Kitchen",
    rating: 4.5,
    reviewCount: 178,
  }),
  r({
    id: 6,
    title: 'Red Red',
    description:
      'Black-eyed bean stew simmered in red palm oil with gari and fried plantain — hearty, smoky, and entirely plant-based.',
    category: 'LOCAL',
    cuisine: 'Ghanaian',
    countryOfOrigin: 'GH',
    mealType: 'LUNCH',
    imageUrl: PHOTOS.recipe[7],
    calories: 480,
    servings: 4,
    prepMinutes: 10,
    cookMinutes: 50,
    mealFrequency: 'Up to 4 times per week',
    mealFrequencyReason: 'Legume-forward and fibre-rich; watch the palm oil quantity for a lighter pot.',
    ingredients: [
      ing('Black-eyed beans', '2', 'cups'),
      ing('Red palm oil', '4', 'tbsp'),
      ing('Tomatoes', '4', 'pcs'),
      ing('Onions', '2', 'pcs'),
      ing('Ripe plantains', '3', 'pcs'),
      ing('Gari', '1/2', 'cup'),
    ],
    steps: steps(
      [
        ['Boil beans until tender.', 30],
        ['Bleach palm oil lightly, fry onions, then grated tomatoes.', 10],
        ['Fold in the beans and simmer to marry the flavours.', 10],
        ['Fry plantain until golden.', 8],
        ['Serve beans topped with gari and plantain on the side.', 2],
      ],
      PHOTOS.recipe[7]
    ),
    story:
      'Named twice-red for its palm oil and fried plantain, red red is Ghana’s great equalizer — a chop-bar lunch loved by students and ministers alike, and one of West Africa’s oldest vegan dishes long before the word existed.',
    storyImageUrl: PHOTOS.story[5],
    vendorId: 1,
    vendorName: "Auntie Ama's Kitchen",
    rating: 4.4,
    reviewCount: 96,
  }),
  r({
    id: 7,
    title: 'Groundnut Soup',
    description:
      'Silky peanut soup with chicken and aromatic spices, made for rice balls and slow Sundays.',
    category: 'LOCAL',
    cuisine: 'Ghanaian',
    countryOfOrigin: 'GH',
    mealType: 'DINNER',
    imageUrl: PHOTOS.recipe[9],
    calories: 560,
    servings: 4,
    prepMinutes: 15,
    cookMinutes: 55,
    mealFrequency: '1-2 times per week',
    mealFrequencyReason: 'Peanuts are calorie-dense; a weekly bowl is a rich and satisfying rhythm.',
    ingredients: [
      ing('Chicken', '1', 'kg'),
      ing('Natural peanut butter', '1', 'cup'),
      ing('Tomatoes', '4', 'pcs'),
      ing('Onions', '1', 'pcs'),
      ing('Ginger', '2', 'tbsp'),
      ing('Scotch bonnet pepper', '1', 'pcs'),
    ],
    steps: steps(
      [
        ['Season and steam chicken with onion and ginger.', 15],
        ['Whisk peanut butter with warm water until smooth; add to the pot.', 5],
        ['Add blended tomatoes and pepper; simmer until oil beads on the surface.', 30],
        ['Skim, season, and simmer to your preferred thickness.', 10],
        ['Serve with rice balls or omo tuo.', 2],
      ],
      PHOTOS.recipe[9]
    ),
    story:
      'Nkatenkwan is patience in a pot. Across Ghana it crowns the Sunday table with omo tuo, and in the north it connects to a whole savannah tradition of groundnut cookery that stretches to Senegal’s mafé.',
    storyImageUrl: PHOTOS.story[6],
    vendorId: 1,
    vendorName: "Auntie Ama's Kitchen",
    rating: 4.6,
    reviewCount: 134,
  }),
  r({
    id: 8,
    title: 'Egusi Soup',
    description:
      'Nigeria’s crown jewel — ground melon seeds cooked into a rich, golden soup with spinach and assorted meats.',
    category: 'LOCAL',
    cuisine: 'Nigerian',
    countryOfOrigin: 'NG',
    mealType: 'DINNER',
    imageUrl: PHOTOS.recipe[13],
    calories: 650,
    servings: 6,
    prepMinutes: 25,
    cookMinutes: 60,
    mealFrequency: '1-2 times per week',
    mealFrequencyReason: 'Melon seeds and palm oil make this indulgent — magnificent, but rich.',
    ingredients: [
      ing('Egusi (melon seeds)', '2', 'cups'),
      ing('Assorted meat & tripe', '1', 'kg'),
      ing('Stockfish', '200', 'g'),
      ing('Palm oil', '1/2', 'cup'),
      ing('Spinach or bitterleaf', '4', 'cups'),
      ing('Crayfish', '3', 'tbsp'),
      ing('Scotch bonnet pepper', '2', 'pcs'),
    ],
    steps: steps(
      [
        ['Boil assorted meats and stockfish with seasoning until tender.', 30],
        ['Blend egusi with a little water into a thick paste.', 5],
        ['Fry the paste in palm oil until it curdles into golden lumps.', 10],
        ['Add stock, meats and crayfish; simmer.', 15],
        ['Fold in greens, cook 5 more minutes, and serve with pounded yam.', 5],
      ],
      PHOTOS.recipe[13]
    ),
    story:
      'Every Nigerian family swears by its own egusi doctrine — lumps or smooth, bitterleaf or spinach, fried or boiled. What never changes is its place of honour: no wedding, burial or homecoming is complete without a vat of egusi holding court.',
    storyImageUrl: PHOTOS.story[7],
    vendorId: 2,
    vendorName: 'Mama Ngozi Foods',
    rating: 4.8,
    reviewCount: 356,
    savedByMe: true,
  }),
  r({
    id: 9,
    title: 'Suya',
    description:
      'Thin-sliced beef skewers crusted in yaji — the smoky, nutty pepper spice of northern Nigeria — grilled over open flame.',
    category: 'LOCAL',
    cuisine: 'Nigerian',
    countryOfOrigin: 'NG',
    mealType: 'SNACK',
    imageUrl: PHOTOS.recipe[5],
    calories: 410,
    servings: 4,
    prepMinutes: 30,
    cookMinutes: 15,
    mealFrequency: '2-3 times per week',
    mealFrequencyReason: 'Lean grilled protein — the peanut spice adds richness, so balance with vegetables.',
    ingredients: [
      ing('Beef sirloin', '700', 'g'),
      ing('Yaji suya spice', '5', 'tbsp'),
      ing('Groundnut oil', '3', 'tbsp'),
      ing('Onions', '1', 'pcs'),
      ing('Tomatoes & cucumber to serve', '2', 'pcs'),
    ],
    steps: steps(
      [
        ['Slice beef paper-thin and thread onto soaked skewers.', 15],
        ['Oil lightly and press yaji spice into every surface; rest 15 minutes.', 15],
        ['Grill hot and fast, turning until edges char.', 10],
        ['Dust with more yaji; serve with raw onion rings and tomato.', 3],
      ],
      PHOTOS.recipe[5]
    ),
    story:
      'Suya is Nigeria’s nightfall ritual, born with Hausa cattle herders whose yaji spice — groundnut, ginger, kankan — preserved and perfumed meat on long journeys. Today the mallam’s glowing grill is the after-dark heartbeat of every Nigerian city.',
    storyImageUrl: PHOTOS.story[0],
    vendorId: 6,
    vendorName: 'Naija Bites',
    rating: 4.9,
    reviewCount: 512,
  }),
  r({
    id: 10,
    title: 'Moi Moi',
    description:
      'Steamed bean pudding — black-eyed beans blended with peppers and gently steamed into a silky savoury cake.',
    category: 'LOCAL',
    cuisine: 'Nigerian',
    countryOfOrigin: 'NG',
    mealType: 'BREAKFAST',
    imageUrl: PHOTOS.recipe[8],
    calories: 290,
    servings: 6,
    prepMinutes: 40,
    cookMinutes: 45,
    mealFrequency: 'Daily',
    mealFrequencyReason: 'Steamed, high-protein and low-fat — one of the healthiest staples on the platform.',
    ingredients: [
      ing('Black-eyed beans', '2', 'cups'),
      ing('Red bell peppers', '2', 'pcs'),
      ing('Onions', '1', 'pcs'),
      ing('Eggs (optional)', '3', 'pcs'),
      ing('Vegetable oil', '4', 'tbsp'),
      ing('Seasoning cubes', '2', 'pcs'),
    ],
    steps: steps(
      [
        ['Soak and peel the beans (or use peeled bean flour).', 25],
        ['Blend beans with peppers and onion into a smooth batter.', 10],
        ['Whisk in oil and seasoning until airy.', 5],
        ['Pour into ramekins or leaves; steam until set.', 40],
        ['Rest 5 minutes, unmould, and serve with pap or bread.', 5],
      ],
      PHOTOS.recipe[8]
    ),
    story:
      'Moi moi is celebration food dressed as an everyday dish — the careful peeling of beans was once a communal task for aunties trading gossip. Steamed in uma leaves it takes on a faint forest perfume no ramekin can copy.',
    storyImageUrl: PHOTOS.story[1],
    vendorId: 2,
    vendorName: 'Mama Ngozi Foods',
    rating: 4.5,
    reviewCount: 189,
  }),
  r({
    id: 11,
    title: 'Pepper Soup',
    description:
      'A fiercely aromatic Nigerian broth of catfish and calabash nutmeg — medicine, comfort and heat in one bowl.',
    category: 'LOCAL',
    cuisine: 'Nigerian',
    countryOfOrigin: 'NG',
    mealType: 'DINNER',
    imageUrl: PHOTOS.recipe[2],
    calories: 310,
    servings: 4,
    prepMinutes: 15,
    cookMinutes: 35,
    mealFrequency: 'Up to 4 times per week',
    mealFrequencyReason: 'Light broth with lean fish — very lean, just mind the sodium.',
    ingredients: [
      ing('Catfish', '800', 'g'),
      ing('Pepper soup spice (ehuru, uda)', '2', 'tbsp'),
      ing('Scotch bonnet pepper', '2', 'pcs'),
      ing('Onions', '1', 'pcs'),
      ing('Scent leaves', '1', 'cup'),
    ],
    steps: steps(
      [
        ['Clean catfish with hot water and salt to firm the skin.', 8],
        ['Boil onion, spice mix and pepper in water.', 10],
        ['Lower in the fish; do not stir — swirl the pot instead.', 15],
        ['Add scent leaves in the final 2 minutes and serve blazing hot.', 5],
      ],
      PHOTOS.recipe[2]
    ),
    story:
      'Pepper soup is Nigeria’s all-purpose remedy — prescribed for new mothers, cold evenings and long nights out. Each region guards its spice blend, but the calabash nutmeg’s haunting aroma is the thread that ties every pot together.',
    storyImageUrl: PHOTOS.story[2],
    vendorId: 2,
    vendorName: 'Mama Ngozi Foods',
    rating: 4.6,
    reviewCount: 142,
  }),
  r({
    id: 12,
    title: 'Pounded Yam & Efo Riro',
    description:
      'Smooth, stretchy pounded yam paired with a deeply savoury Yoruba spinach stew.',
    category: 'LOCAL',
    cuisine: 'Nigerian',
    countryOfOrigin: 'NG',
    mealType: 'LUNCH',
    imageUrl: PHOTOS.recipe[3],
    calories: 720,
    servings: 4,
    prepMinutes: 20,
    cookMinutes: 50,
    mealFrequency: '1-2 times per week',
    mealFrequencyReason: 'A dense, festive plate; wonderful weekly rather than daily.',
    ingredients: [
      ing('Yam', '1.5', 'kg'),
      ing('Spinach (efo)', '6', 'cups'),
      ing('Palm oil', '1/3', 'cup'),
      ing('Assorted meat', '600', 'g'),
      ing('Locust beans (iru)', '2', 'tbsp'),
      ing('Tatashe peppers', '3', 'pcs'),
    ],
    steps: steps(
      [
        ['Boil yam chunks until fork-tender.', 25],
        ['Pound (or process) with hot water until elastic and smooth.', 10],
        ['Fry blended tatashe and iru in palm oil; add meats and stock.', 15],
        ['Fold in spinach; cook briefly to keep it vivid green.', 5],
        ['Mound the pounded yam and serve the efo riro alongside.', 3],
      ],
      PHOTOS.recipe[3]
    ),
    story:
      'The thud of the pestle is the sound of a Yoruba compound preparing to feast. Pounded yam is reserved for guests of honour, and efo riro — "stirred greens" — proves that even vegetables can taste of celebration.',
    storyImageUrl: PHOTOS.story[3],
    vendorId: 2,
    vendorName: 'Mama Ngozi Foods',
    rating: 4.7,
    reviewCount: 203,
  }),
  r({
    id: 13,
    title: 'West African Fried Rice',
    description:
      'Party fried rice the Lagos-Accra way: curry-scented rice tossed with liver, shrimp and a rainbow of vegetables.',
    category: 'CONTINENTAL',
    cuisine: 'West African',
    countryOfOrigin: 'GH',
    mealType: 'LUNCH',
    imageUrl: PHOTOS.recipe[4],
    calories: 590,
    servings: 5,
    prepMinutes: 20,
    cookMinutes: 30,
    mealFrequency: '2-3 times per week',
    mealFrequencyReason: 'Vegetable-forward when homemade with modest oil.',
    ingredients: [
      ing('Rice', '3', 'cups'),
      ing('Mixed vegetables', '2', 'cups'),
      ing('Shrimp', '300', 'g'),
      ing('Chicken liver', '200', 'g'),
      ing('Curry powder', '2', 'tbsp'),
      ing('Spring onions', '4', 'stalks'),
    ],
    steps: steps(
      [
        ['Parboil rice with curry and stock until just underdone.', 15],
        ['Stir-fry liver and shrimp; set aside.', 8],
        ['Flash-fry vegetables, return rice and proteins, toss on high heat.', 8],
        ['Finish with spring onions and serve with grilled chicken.', 4],
      ],
      PHOTOS.recipe[4]
    ),
    story:
      'No owambe or Ghanaian wedding buffet is complete without a golden mountain of fried rice beside its rival jollof — the diplomatic dish that lets everyone fill their plate with both.',
    storyImageUrl: PHOTOS.story[4],
    vendorId: 6,
    vendorName: 'Naija Bites',
    rating: 4.3,
    reviewCount: 88,
  }),
  r({
    id: 14,
    title: 'Chicken Shawarma',
    description:
      'The Lagos street classic adopted from the Levant — spiced chicken, creamy garlic sauce and crunchy veg in a toasted wrap.',
    category: 'FOREIGN',
    cuisine: 'Middle Eastern',
    countryOfOrigin: 'Lebanon',
    mealType: 'SNACK',
    imageUrl: PHOTOS.recipe[10],
    calories: 520,
    servings: 2,
    prepMinutes: 25,
    cookMinutes: 20,
    mealFrequency: '1-2 times per week',
    mealFrequencyReason: 'Creamy sauces push the calories up — a delicious occasional indulgence.',
    ingredients: [
      ing('Chicken thighs', '500', 'g'),
      ing('Shawarma spice blend', '2', 'tbsp'),
      ing('Flatbreads', '2', 'pcs'),
      ing('Garlic sauce', '4', 'tbsp'),
      ing('Cabbage, cucumber & tomato', '2', 'cups'),
    ],
    steps: steps(
      [
        ['Marinate chicken in yoghurt and shawarma spices.', 20],
        ['Sear until charred and cooked through; slice thin.', 12],
        ['Warm flatbreads, layer sauce, veg and chicken.', 5],
        ['Roll tight, toast seam-down, slice and serve.', 4],
      ],
      PHOTOS.recipe[10]
    ),
    story:
      'Shawarma arrived in Lagos with Lebanese traders a century ago and never left. Today the late-night shawarma stand — foil-wrapped, extra sausage, extra pepper — is as Nigerian as the suya grill beside it.',
    storyImageUrl: PHOTOS.story[5],
    vendorId: 6,
    vendorName: 'Naija Bites',
    rating: 4.2,
    reviewCount: 77,
  }),
  r({
    id: 15,
    title: 'Sobolo (Zobo)',
    description:
      'Hibiscus petals steeped with ginger and pineapple — the ruby-red drink of West African celebrations, served ice cold.',
    category: 'DRINK',
    cuisine: 'Ghanaian',
    countryOfOrigin: 'GH',
    mealType: 'DRINK',
    imageUrl: PHOTOS.recipe[11],
    calories: 120,
    servings: 6,
    prepMinutes: 10,
    cookMinutes: 25,
    mealFrequency: 'Daily',
    mealFrequencyReason: 'Low-calorie and antioxidant-rich when lightly sweetened.',
    ingredients: [
      ing('Dried hibiscus petals', '2', 'cups'),
      ing('Fresh ginger', '4', 'tbsp'),
      ing('Pineapple peels & chunks', '2', 'cups'),
      ing('Cloves', '1', 'tsp'),
      ing('Sugar or honey', '1/2', 'cup'),
    ],
    steps: steps(
      [
        ['Rinse petals; boil with ginger, cloves and pineapple peels.', 20],
        ['Steep off the heat until deep ruby red.', 15],
        ['Strain, sweeten to taste, and add pineapple chunks.', 5],
        ['Chill thoroughly and serve over ice.', 2],
      ],
      PHOTOS.recipe[11]
    ),
    story:
      'Called sobolo in Ghana and zobo in Nigeria, this hibiscus infusion cools weddings, naming ceremonies and roadside coolers alike — one drink, two names, and a friendly argument about whose ginger hits harder.',
    storyImageUrl: PHOTOS.story[6],
    vendorId: 1,
    vendorName: "Auntie Ama's Kitchen",
    rating: 4.4,
    reviewCount: 65,
  }),
  r({
    id: 16,
    title: 'Chapman',
    description:
      'Nigeria’s beloved mocktail — a fizzy blend of citrus soda, grenadine, cucumber and bitters over mountains of ice.',
    category: 'DRINK',
    cuisine: 'Nigerian',
    countryOfOrigin: 'NG',
    mealType: 'DRINK',
    imageUrl: PHOTOS.recipe[14],
    calories: 180,
    servings: 2,
    prepMinutes: 10,
    cookMinutes: 0,
    mealFrequency: '2-3 times per week',
    mealFrequencyReason: 'A sweet treat — the soda sugars add up, so keep it celebratory.',
    ingredients: [
      ing('Fanta or orange soda', '300', 'ml'),
      ing('Sprite', '200', 'ml'),
      ing('Grenadine syrup', '3', 'tbsp'),
      ing('Angostura bitters', '1', 'tsp'),
      ing('Cucumber, lemon & orange slices', '1', 'cup'),
    ],
    steps: steps(
      [
        ['Fill a large mug (traditionally a beer mug) with ice.', 2],
        ['Add grenadine and bitters, then pour in the sodas.', 3],
        ['Stir gently; crowd the glass with cucumber and citrus.', 3],
        ['Serve with a straw and a paper umbrella if you are feeling fancy.', 1],
      ],
      PHOTOS.recipe[14]
    ),
    story:
      'Invented — legend says — at a Lagos club for a guest named Chapman, this ruby cooler became the default "something classy, no alcohol" order across Nigeria, the drink of first dates and Sunday buffets.',
    storyImageUrl: PHOTOS.story[7],
    vendorId: 2,
    vendorName: 'Mama Ngozi Foods',
    rating: 4.3,
    reviewCount: 54,
  }),

  // ---------------------------------------------------------------------------
  // International dishes (ids 101+). Community recipes with no vendor attached,
  // so the UI falls back to the Dishaspora byline.
  // ---------------------------------------------------------------------------

  r({
    id: 101,
    title: 'Spaghetti Carbonara',
    description:
      'Roman pasta at its most disciplined — hot spaghetti tossed off the heat with egg yolk, pecorino and crackling guanciale until it turns to glossy, peppery silk.',
    category: 'CONTINENTAL',
    cuisine: 'Italian',
    countryOfOrigin: 'ITALY',
    mealType: 'DINNER',
    imageUrl: WM('thumb/3/33/Espaguetis_carbonara.jpg/960px-Espaguetis_carbonara.jpg'),
    calories: 720,
    servings: 4,
    prepMinutes: 10,
    cookMinutes: 20,
    mealFrequency: 'Once per week',
    mealFrequencyReason:
      'Rich in cured pork fat, egg and aged cheese — satisfying but calorie-dense, so keep it occasional and serve with a sharp green salad.',
    ingredients: [
      ing('Spaghetti', '400', 'g'),
      ing('Guanciale', '150', 'g'),
      ing('Egg yolks', '4', 'pcs'),
      ing('Whole egg', '1', 'pcs'),
      ing('Pecorino Romano, grated', '80', 'g'),
      ing('Black pepper, coarsely cracked', '1', 'tsp'),
      ing('Salt for the pasta water', '1', 'tbsp'),
    ],
    steps: steps(
      [
        ['Bring a large pot of well-salted water to a rolling boil and drop in the spaghetti.', 10],
        ['Cut the guanciale into thick batons and render it slowly in a dry pan until the fat runs clear and the edges crisp.', 8],
        ['Whisk the yolks, whole egg, grated pecorino and cracked pepper into a thick paste in a bowl.', 3],
        ['Loosen the egg mixture with a ladle of starchy pasta water, whisking constantly so it stays smooth.', 2],
        ['Drain the pasta and toss it in the pan of guanciale fat, off the heat, to coat every strand.', 2],
        ['Pour in the egg mixture and stir vigorously off the heat until the sauce thickens to a glossy cream — never let it scramble.', 2],
        ['Plate immediately and finish with more pecorino and a final grind of black pepper.', 1],
      ],
      WM('thumb/3/33/Espaguetis_carbonara.jpg/960px-Espaguetis_carbonara.jpg')
    ),
    story:
      'Carbonara is a surprisingly young Roman classic: the first printed recipes appear only in the mid-1940s, and the earliest known mention comes in 1950 in the Italian press. Food historians link its rise to post-war Rome, when American military rations of bacon and powdered egg met local pasta cooking. Romans quickly claimed it and codified it around guanciale, pecorino Romano and egg — no cream, a point defended with real passion.',
    storyImageUrl: PHOTOS.story[0],
    vendorId: null,
    vendorName: null,
    rating: 4.8,
    reviewCount: 214,
  }),
  r({
    id: 102,
    title: 'Margherita Pizza',
    description:
      'Naples in three colours — a blistered, leopard-spotted crust under crushed San Marzano tomato, torn fior di latte and basil that wilts in the last thirty seconds.',
    category: 'CONTINENTAL',
    cuisine: 'Italian',
    countryOfOrigin: 'ITALY',
    mealType: 'DINNER',
    imageUrl: WM(
      'thumb/a/a3/Eq_it-na_pizza-margherita_sep2005_sml.jpg/960px-Eq_it-na_pizza-margherita_sep2005_sml.jpg'
    ),
    calories: 610,
    servings: 4,
    prepMinutes: 30,
    cookMinutes: 12,
    mealFrequency: 'Once per week',
    mealFrequencyReason:
      'Refined flour and melted cheese make it heavy on simple carbs and saturated fat; a weekly treat rather than a weeknight default.',
    ingredients: [
      ing('Type 00 flour', '500', 'g'),
      ing('Water', '325', 'ml'),
      ing('Fresh yeast', '2', 'g'),
      ing('Fine sea salt', '2', 'tsp'),
      ing('San Marzano tomatoes, crushed', '400', 'g'),
      ing('Fior di latte mozzarella', '250', 'g'),
      ing('Fresh basil', '8', 'sprigs'),
      ing('Extra virgin olive oil', '2', 'tbsp'),
    ],
    steps: steps(
      [
        ['Dissolve the yeast in the water, work in the flour, then add the salt and knead to a smooth, elastic dough.', 15],
        ['Rest the dough covered at room temperature, then divide into four balls and prove until puffy and slack.', 120],
        ['Drain the mozzarella and tear it into pieces; season the crushed tomatoes with a pinch of salt only.', 5],
        ['Stretch each ball by hand from the centre outward, leaving a thick untouched rim — never use a rolling pin.', 5],
        ['Spread a thin layer of tomato, scatter the mozzarella and drizzle with olive oil.', 2],
        ['Bake as hot as your oven will go, on a preheated stone or steel, until the rim is puffed and charred in spots.', 8],
        ['Add the fresh basil as it comes out and eat within minutes, while the base is still crisp.', 1],
      ],
      WM(
        'thumb/a/a3/Eq_it-na_pizza-margherita_sep2005_sml.jpg/960px-Eq_it-na_pizza-margherita_sep2005_sml.jpg'
      )
    ),
    story:
      'Flatbreads with tomato were sold on Naples streets long before the name Margherita existed. The popular account credits pizzaiolo Raffaele Esposito with making a tomato-mozzarella-basil pizza for Queen Margherita of Savoy in 1889 and naming it for her — a story historians treat with caution, since the combination was already being sold locally. What is certain is that the pairing became the benchmark of Neapolitan pizza, now protected by strict rules on dough, ingredients and wood-fired baking.',
    storyImageUrl: PHOTOS.story[1],
    vendorId: null,
    vendorName: null,
    rating: 4.9,
    reviewCount: 258,
  }),
  r({
    id: 103,
    title: 'Risotto alla Milanese',
    description:
      'Milan’s golden risotto — carnaroli rice coaxed to a loose, rippling wave with saffron, marrow-rich stock and a hard beating of cold butter and parmesan.',
    category: 'CONTINENTAL',
    cuisine: 'Italian',
    countryOfOrigin: 'ITALY',
    mealType: 'DINNER',
    imageUrl: WM('thumb/6/6b/Risotto_alla_milanese.JPG/960px-Risotto_alla_milanese.JPG'),
    calories: 540,
    servings: 4,
    prepMinutes: 10,
    cookMinutes: 25,
    mealFrequency: '1-2 times per week',
    mealFrequencyReason:
      'Mostly starch finished with butter and cheese — lighter than it tastes if you keep the portion modest and pair it with a vegetable or lean protein.',
    ingredients: [
      ing('Carnaroli rice', '320', 'g'),
      ing('Beef or chicken stock, hot', '1200', 'ml'),
      ing('Saffron threads', '1', 'tsp'),
      ing('Onion, finely diced', '1', 'pcs'),
      ing('Dry white wine', '120', 'ml'),
      ing('Cold butter', '80', 'g'),
      ing('Parmigiano Reggiano, grated', '70', 'g'),
      ing('Beef marrow', '30', 'g'),
    ],
    steps: steps(
      [
        ['Steep the saffron threads in a small ladle of hot stock and set aside to bloom.', 5],
        ['Sweat the onion gently in the marrow and a knob of butter until soft but not coloured.', 6],
        ['Add the dry rice and toast it, stirring, until the grains turn translucent at the edges.', 3],
        ['Pour in the wine and let it evaporate completely.', 2],
        ['Add hot stock a ladle at a time, stirring, waiting for each addition to be absorbed before the next.', 16],
        ['Stir in the saffron infusion for the last few minutes so the colour stays vivid.', 3],
        ['Off the heat, beat in the cold butter and parmesan hard until the risotto ripples loosely on the plate.', 2],
      ],
      WM('thumb/6/6b/Risotto_alla_milanese.JPG/960px-Risotto_alla_milanese.JPG')
    ),
    story:
      'Saffron rice is documented in Milan from at least the early 1800s, and the dish is bound up with the city’s long trade in the spice and with rice growing in the Po Valley. A well-loved local legend attributes it to a glassworker’s apprentice at the Duomo who used saffron as a pigment and tipped it into a wedding risotto — charming, but unverified. In Milanese kitchens it is the classic bed for ossobuco, the two served together as a single plate.',
    storyImageUrl: PHOTOS.story[2],
    vendorId: null,
    vendorName: null,
    rating: 4.6,
    reviewCount: 132,
  }),
  r({
    id: 104,
    title: 'Coq au Vin',
    description:
      'Burgundy in a pot — chicken braised low and slow in red wine with lardons, pearl onions and mushrooms until the sauce turns dark, glossy and deeply savoury.',
    category: 'CONTINENTAL',
    cuisine: 'French',
    countryOfOrigin: 'FRANCE',
    mealType: 'DINNER',
    imageUrl: WM('3/31/Coq_au_vin.jpg'),
    calories: 660,
    servings: 6,
    prepMinutes: 25,
    cookMinutes: 90,
    mealFrequency: 'Once per week',
    mealFrequencyReason:
      'Good protein but generous in bacon fat and butter; a weekend braise best balanced with steamed greens rather than a second starch.',
    ingredients: [
      ing('Chicken, jointed', '1600', 'g'),
      ing('Red Burgundy or pinot noir', '750', 'ml'),
      ing('Smoked bacon lardons', '150', 'g'),
      ing('Pearl onions', '250', 'g'),
      ing('Button mushrooms', '250', 'g'),
      ing('Garlic', '3', 'cloves'),
      ing('Plain flour', '2', 'tbsp'),
      ing('Butter', '40', 'g'),
      ing('Thyme', '4', 'sprigs'),
      ing('Salt', '1', 'tsp'),
    ],
    steps: steps(
      [
        ['Marinate the chicken pieces in the red wine with garlic and thyme, refrigerated, for several hours.', 20],
        ['Lift out and pat the chicken completely dry; reserve the wine.', 5],
        ['Render the lardons in a heavy casserole, remove them, then brown the chicken hard in the fat on all sides.', 15],
        ['Dust with flour, stir to coat, then pour in the reserved wine and scrape up everything stuck to the base.', 5],
        ['Cover and braise gently until the chicken is tender and pulling from the bone.', 60],
        ['Meanwhile glaze the pearl onions and sauté the mushrooms in butter until golden.', 15],
        ['Return the lardons, onions and mushrooms to the pot and reduce the sauce until it coats a spoon.', 15],
      ],
      WM('3/31/Coq_au_vin.jpg')
    ),
    story:
      'Coq au vin belongs to the French tradition of long-braising tough, older birds — a cockerel past its prime needed hours in wine and aromatics to become tender. Though associated above all with Burgundy, regional versions exist across France using local wines, from Riesling in Alsace to the near-black wines of the Jura. Auguste Escoffier and later Julia Child helped carry it from farmhouse economy cooking to the international bistro canon.',
    storyImageUrl: PHOTOS.story[3],
    vendorId: null,
    vendorName: null,
    rating: 4.7,
    reviewCount: 176,
  }),
  r({
    id: 105,
    title: 'Ratatouille',
    description:
      'A Provençal summer stew of aubergine, courgette, peppers and tomato, each cooked apart then folded together so every vegetable still tastes of itself.',
    category: 'CONTINENTAL',
    cuisine: 'French',
    countryOfOrigin: 'FRANCE',
    mealType: 'LUNCH',
    imageUrl: WM('thumb/0/03/Ratatouille-Dish.jpg/960px-Ratatouille-Dish.jpg'),
    calories: 210,
    servings: 4,
    prepMinutes: 25,
    cookMinutes: 45,
    mealFrequency: '3-4 times per week',
    mealFrequencyReason:
      'Almost entirely vegetables cooked in olive oil — high in fibre and micronutrients, so it works as a frequent side or a light main with bread.',
    ingredients: [
      ing('Aubergine', '2', 'pcs'),
      ing('Courgette', '3', 'pcs'),
      ing('Red bell peppers', '2', 'pcs'),
      ing('Ripe tomatoes', '600', 'g'),
      ing('Onion', '1', 'pcs'),
      ing('Garlic', '4', 'cloves'),
      ing('Extra virgin olive oil', '6', 'tbsp'),
      ing('Thyme and bay', '4', 'sprigs'),
      ing('Salt', '1', 'tsp'),
    ],
    steps: steps(
      [
        ['Cut the aubergine into chunks, salt them and leave to drain so they cook without soaking up oil.', 20],
        ['Fry the aubergine in olive oil until browned and creamy inside, then set aside.', 12],
        ['Brown the courgette in the same pan and remove; repeat with the peppers.', 12],
        ['Soften the onion and garlic gently, then add the chopped tomatoes, thyme and bay.', 10],
        ['Simmer the tomato base until it thickens and loses its raw edge.', 15],
        ['Fold all the vegetables back in and cook briefly together so the flavours marry but nothing collapses.', 10],
        ['Rest off the heat and serve warm or at room temperature with a last drizzle of olive oil.', 10],
      ],
      WM('thumb/0/03/Ratatouille-Dish.jpg/960px-Ratatouille-Dish.jpg')
    ),
    story:
      'Ratatouille comes from the region around Nice, where it began as peasant cooking built on whatever the summer garden gave up at once. The name derives from the French verb touiller, to stir or toss together. Cooking the vegetables separately before combining them is the refinement most Provençal cooks insist on, and the reason a good ratatouille tastes layered rather than muddled.',
    storyImageUrl: PHOTOS.story[4],
    vendorId: null,
    vendorName: null,
    rating: 4.5,
    reviewCount: 98,
  }),
  r({
    id: 106,
    title: 'French Onion Soup',
    description:
      'Onions caramelised until they are nearly jam, drowned in beef stock and crowned with a raft of toasted bread and bubbling, blistered Gruyère.',
    category: 'CONTINENTAL',
    cuisine: 'French',
    countryOfOrigin: 'FRANCE',
    mealType: 'DINNER',
    imageUrl: WM('thumb/9/92/French_Onion_Soup..JPG/960px-French_Onion_Soup..JPG'),
    calories: 430,
    servings: 4,
    prepMinutes: 15,
    cookMinutes: 75,
    mealFrequency: '1-2 times per week',
    mealFrequencyReason:
      'Vegetable-led and modest in calories until the cheese and bread go on — keep the gratin layer thin and it sits comfortably in a weekly rotation.',
    ingredients: [
      ing('Yellow onions, thinly sliced', '1000', 'g'),
      ing('Butter', '50', 'g'),
      ing('Beef stock', '1200', 'ml'),
      ing('Dry white wine', '150', 'ml'),
      ing('Baguette', '8', 'slices'),
      ing('Gruyère, grated', '150', 'g'),
      ing('Thyme', '3', 'sprigs'),
      ing('Salt', '1', 'tsp'),
    ],
    steps: steps(
      [
        ['Melt the butter in a wide heavy pot and add the sliced onions with a pinch of salt.', 5],
        ['Cook the onions over low-medium heat, stirring often, until they collapse and turn deep mahogany — this cannot be rushed.', 45],
        ['Deglaze with the white wine and let it reduce almost to nothing.', 5],
        ['Pour in the beef stock, add the thyme and simmer so the flavours settle.', 20],
        ['Toast the baguette slices until dry and crisp right through.', 5],
        ['Ladle the soup into ovenproof bowls, float the toast on top and blanket it with Gruyère.', 3],
        ['Grill until the cheese is molten, browned and creeping over the rim.', 5],
      ],
      WM('thumb/9/92/French_Onion_Soup..JPG/960px-French_Onion_Soup..JPG')
    ),
    story:
      'Onion soup is old and humble — versions were eaten across Europe for centuries as cheap, warming food. The modern gratinée version took shape in Paris in the 1800s and became inseparable from Les Halles, the central market where night workers and late revellers ate it before dawn. The bread-and-cheese crust that defines it today is a nineteenth-century restaurant flourish on a much older peasant broth.',
    storyImageUrl: PHOTOS.story[5],
    vendorId: null,
    vendorName: null,
    rating: 4.6,
    reviewCount: 144,
  }),
  r({
    id: 107,
    title: 'Moussaka',
    description:
      'Layered Greek comfort — silky roasted aubergine, cinnamon-scented lamb ragù and a thick béchamel cap baked until deeply burnished.',
    category: 'CONTINENTAL',
    cuisine: 'Greek',
    countryOfOrigin: 'GREECE',
    mealType: 'DINNER',
    imageUrl: WM('thumb/d/d7/Mousakas.jpg/960px-Mousakas.jpg'),
    calories: 690,
    servings: 6,
    prepMinutes: 40,
    cookMinutes: 60,
    mealFrequency: 'Once per week',
    mealFrequencyReason:
      'Rich on two fronts — fatty minced lamb and a butter-and-milk béchamel — so treat it as a Sunday dish and serve with a horiatiki salad.',
    ingredients: [
      ing('Aubergine', '3', 'pcs'),
      ing('Minced lamb', '700', 'g'),
      ing('Onion, chopped', '1', 'pcs'),
      ing('Chopped tomatoes', '400', 'g'),
      ing('Ground cinnamon', '1', 'tsp'),
      ing('Milk', '750', 'ml'),
      ing('Butter', '70', 'g'),
      ing('Plain flour', '70', 'g'),
      ing('Kefalotyri, grated', '100', 'g'),
      ing('Olive oil', '4', 'tbsp'),
    ],
    steps: steps(
      [
        ['Slice the aubergine, salt it to draw out moisture, then brush with olive oil and roast until soft and golden.', 30],
        ['Brown the minced lamb hard with the onion so it colours rather than steams.', 12],
        ['Add the tomatoes and cinnamon and simmer until the ragù is thick and no longer watery.', 25],
        ['Make the béchamel: cook butter and flour to a pale roux, then whisk in the milk until thick and smooth.', 12],
        ['Beat most of the grated cheese into the warm béchamel and season.', 3],
        ['Layer aubergine, then ragù, then the remaining aubergine in a deep dish and level the top.', 8],
        ['Pour over the béchamel, dust with the last cheese and bake until set and deeply browned.', 45],
        ['Rest before cutting so the layers hold their shape on the plate.', 20],
      ],
      WM('thumb/d/d7/Mousakas.jpg/960px-Mousakas.jpg')
    ),
    story:
      'Layered aubergine and meat dishes are shared across the eastern Mediterranean and the Levant, and the name traces back to the Arabic musaqqaʿa. The specific Greek version — with its thick béchamel top — was standardised in the 1920s by chef Nikolaos Tselementes, who brought French technique into Greek home cooking through his hugely influential cookbook. That French cap is why Greek moussaka looks and eats so differently from its Turkish and Arab relatives.',
    storyImageUrl: PHOTOS.story[6],
    vendorId: null,
    vendorName: null,
    rating: 4.7,
    reviewCount: 189,
  }),
  r({
    id: 108,
    title: 'Greek Souvlaki with Tzatziki',
    description:
      'Char-edged skewers of oregano-and-lemon marinated pork, pulled off the grill straight into warm pita with cool, garlicky tzatziki.',
    category: 'CONTINENTAL',
    cuisine: 'Greek',
    countryOfOrigin: 'GREECE',
    mealType: 'LUNCH',
    imageUrl: WM('6/6e/Souvlaki_457.jpg'),
    calories: 520,
    servings: 4,
    prepMinutes: 25,
    cookMinutes: 15,
    mealFrequency: '2-3 times per week',
    mealFrequencyReason:
      'Grilled lean protein with a yoghurt-based sauce — genuinely balanced; the pita is the main thing to keep in check.',
    ingredients: [
      ing('Pork shoulder, cubed', '800', 'g'),
      ing('Olive oil', '4', 'tbsp'),
      ing('Lemon juice', '3', 'tbsp'),
      ing('Dried oregano', '2', 'tsp'),
      ing('Garlic', '4', 'cloves'),
      ing('Greek yoghurt', '400', 'g'),
      ing('Cucumber, grated', '1', 'pcs'),
      ing('Pita breads', '4', 'pcs'),
      ing('Salt', '1', 'tsp'),
    ],
    steps: steps(
      [
        ['Toss the pork cubes with olive oil, lemon juice, oregano, two crushed garlic cloves and salt.', 10],
        ['Marinate in the fridge so the lemon and oregano work into the meat.', 60],
        ['Squeeze the grated cucumber dry, then fold it into the yoghurt with the remaining garlic and a little olive oil.', 10],
        ['Thread the pork onto skewers, packed snugly but not crushed together.', 5],
        ['Grill over high heat, turning, until charred outside and just cooked through.', 12],
        ['Warm the pitas briefly on the grill until soft and pliable.', 2],
        ['Rest the skewers a moment, then serve in the pita with tzatziki, red onion and tomato.', 3],
      ],
      WM('6/6e/Souvlaki_457.jpg')
    ),
    story:
      'Greeks have grilled small pieces of meat on skewers since antiquity — charred skewer-holding griddles have been excavated from Bronze Age Santorini, and Homer describes meat cooked on spits. The modern souvlaki, sold from street counters and eaten wrapped in pita, took its current form in twentieth-century Greek cities, above all Athens. Tzatziki, built on strained yoghurt, cucumber and garlic, shares a family line with Turkish cacik and Middle Eastern yoghurt sauces.',
    storyImageUrl: PHOTOS.story[7],
    vendorId: null,
    vendorName: null,
    rating: 4.8,
    reviewCount: 203,
  }),
  r({
    id: 109,
    title: 'Paella Valenciana',
    description:
      'The original paella — rabbit, chicken and flat green beans cooked over fire with saffron rice spread thin, prized for the toasted socarrat beneath.',
    category: 'CONTINENTAL',
    cuisine: 'Spanish',
    countryOfOrigin: 'SPAIN',
    mealType: 'LUNCH',
    imageUrl: WM('thumb/a/a7/Paella_Valenciana_tradicional.jpg/960px-Paella_Valenciana_tradicional.jpg'),
    calories: 640,
    servings: 6,
    prepMinutes: 25,
    cookMinutes: 50,
    mealFrequency: '1-2 times per week',
    mealFrequencyReason:
      'A complete one-pan meal of rice, lean meat and vegetables — filling and rice-heavy, so keep portions measured.',
    ingredients: [
      ing('Bomba or Senia rice', '500', 'g'),
      ing('Chicken, jointed small', '500', 'g'),
      ing('Rabbit, jointed small', '400', 'g'),
      ing('Flat green beans', '200', 'g'),
      ing('Garrofó butter beans', '100', 'g'),
      ing('Grated tomato', '200', 'g'),
      ing('Saffron threads', '1', 'tsp'),
      ing('Sweet paprika', '1', 'tbsp'),
      ing('Olive oil', '5', 'tbsp'),
      ing('Water', '1500', 'ml'),
    ],
    steps: steps(
      [
        ['Heat olive oil in a wide paella pan and brown the chicken and rabbit slowly around the outer ring.', 18],
        ['Push the meat aside and fry the green beans and garrofó until they take on colour.', 6],
        ['Add the grated tomato and paprika and cook until the sofrito darkens and thickens.', 6],
        ['Pour in the water, add the saffron and salt, and simmer to build a proper broth.', 20],
        ['Scatter the rice evenly across the whole pan and level it — do not stir again from this point.', 2],
        ['Boil hard, then lower the heat and cook until the liquid is absorbed and the surface is pitted.', 18],
        ['Raise the heat for the last minute to toast the socarrat crust on the base.', 2],
        ['Rest the pan covered with a cloth before serving straight from the pan.', 5],
      ],
      WM('thumb/a/a7/Paella_Valenciana_tradicional.jpg/960px-Paella_Valenciana_tradicional.jpg')
    ),
    story:
      'Paella was born in the rice fields and marshes around the Albufera lagoon near Valencia, cooked outdoors over orange wood by farm workers using what was to hand — rabbit, chicken, snails and field vegetables. The word paella is Valencian for the wide shallow pan itself, not the dish. Valencians are firm that seafood versions, however good, are something else entirely; the traditional recipe is now formally protected.',
    storyImageUrl: PHOTOS.story[1],
    vendorId: null,
    vendorName: null,
    rating: 4.7,
    reviewCount: 231,
  }),
  r({
    id: 110,
    title: 'Spanish Tortilla',
    description:
      'A thick golden cake of potato and onion set in egg — crisp at the edge, deliberately soft and just-runny at the centre.',
    category: 'CONTINENTAL',
    cuisine: 'Spanish',
    countryOfOrigin: 'SPAIN',
    mealType: 'BREAKFAST',
    imageUrl: WM('thumb/f/f5/Tortilla_de_patatas_con_cebolla.jpg/960px-Tortilla_de_patatas_con_cebolla.jpg'),
    calories: 380,
    servings: 4,
    prepMinutes: 15,
    cookMinutes: 30,
    mealFrequency: '3-4 times per week',
    mealFrequencyReason:
      'Cheap, protein-rich and made from three ingredients — the olive oil the potatoes cook in is the only thing to moderate.',
    ingredients: [
      ing('Potatoes, peeled', '700', 'g'),
      ing('Eggs', '6', 'pcs'),
      ing('Onion, thinly sliced', '1', 'pcs'),
      ing('Olive oil', '300', 'ml'),
      ing('Salt', '1', 'tsp'),
    ],
    steps: steps(
      [
        ['Slice the potatoes thin and irregular so some pieces break down and others hold.', 10],
        ['Poach the potatoes and onion gently in plenty of olive oil until tender but uncoloured.', 20],
        ['Drain well, reserving the oil, and season the hot potatoes with salt.', 3],
        ['Beat the eggs, fold the warm potatoes through and let the mixture sit so the potato soaks up the egg.', 10],
        ['Cook in a small pan in a little of the reserved oil, drawing the edges in, until the base is set.', 6],
        ['Invert onto a plate, slide back in and cook the second side briefly, keeping the centre soft.', 4],
        ['Slide out and rest a few minutes; serve warm or at room temperature in wedges.', 5],
      ],
      WM('thumb/f/f5/Tortilla_de_patatas_con_cebolla.jpg/960px-Tortilla_de_patatas_con_cebolla.jpg')
    ),
    story:
      'The tortilla de patatas appears in Spanish records in the early nineteenth century, the earliest well-known reference being an 1817 Navarrese document describing it as cheap, filling food for the poor. Potatoes, brought from the Americas centuries earlier, had by then become a staple across rural Spain. Today it is everywhere — cut into cubes as a tapa, stuffed into a bocadillo, or eaten cold from the fridge — and Spaniards argue endlessly over whether onion belongs in it.',
    storyImageUrl: PHOTOS.story[3],
    vendorId: null,
    vendorName: null,
    rating: 4.6,
    reviewCount: 117,
  }),
  r({
    id: 111,
    title: 'Kung Pao Chicken',
    description:
      'Diced chicken flash-fried with dried chillies and numbing Sichuan peppercorn, glossed in a sweet-sour sauce and scattered with blistered peanuts.',
    category: 'FOREIGN',
    cuisine: 'Chinese',
    countryOfOrigin: 'CHINA',
    mealType: 'DINNER',
    imageUrl: WM('thumb/0/04/Kung_Pao_Chicken_1.jpg/960px-Kung_Pao_Chicken_1.jpg'),
    calories: 480,
    servings: 4,
    prepMinutes: 20,
    cookMinutes: 12,
    mealFrequency: '1-2 times per week',
    mealFrequencyReason:
      'Lean protein and peanuts make it satisfying, but the sauce carries sugar and sodium — serve with plain rice and greens.',
    ingredients: [
      ing('Chicken thigh, diced', '500', 'g'),
      ing('Roasted peanuts', '80', 'g'),
      ing('Dried red chillies', '10', 'pcs'),
      ing('Sichuan peppercorns', '1', 'tsp'),
      ing('Light soy sauce', '2', 'tbsp'),
      ing('Chinkiang black vinegar', '2', 'tbsp'),
      ing('Sugar', '1', 'tbsp'),
      ing('Garlic', '3', 'cloves'),
      ing('Spring onions', '4', 'pcs'),
      ing('Cornflour', '1', 'tbsp'),
    ],
    steps: steps(
      [
        ['Toss the diced chicken with soy sauce and cornflour and let it velvet in the fridge.', 15],
        ['Whisk soy, vinegar, sugar and a splash of water into a sauce and set it beside the wok.', 3],
        ['Heat the wok until smoking, then fry dried chillies and Sichuan peppercorns for seconds until fragrant.', 1],
        ['Add the chicken in one layer and sear undisturbed before tossing to colour all sides.', 5],
        ['Throw in garlic and the white parts of the spring onion and stir-fry hard.', 1],
        ['Pour the sauce down the side of the wok and toss until it clings and glosses.', 2],
        ['Fold in peanuts and green onion tops off the heat so the nuts stay crisp.', 1],
      ],
      WM('thumb/0/04/Kung_Pao_Chicken_1.jpg/960px-Kung_Pao_Chicken_1.jpg')
    ),
    story:
      'Gong Bao ji ding is named for Ding Baozhen, a 19th-century Qing governor of Sichuan whose honorary title was gongbao, or "palace guardian". During the Cultural Revolution the name was politically suspect and the dish was briefly rebranded, only to return under its original title afterwards. The authentic Sichuan version leans sour and mala rather than sweet — the ketchup-heavy takeaway version is a later overseas adaptation.',
    storyImageUrl: PHOTOS.story[2],
    vendorId: null,
    vendorName: null,
    rating: 4.7,
    reviewCount: 188,
  }),
  r({
    id: 112,
    title: 'Char Siu Pork',
    description:
      'Cantonese barbecue pork lacquered in honey, maltose and five-spice until the edges char mahogany-red and the centre stays juicy.',
    category: 'FOREIGN',
    cuisine: 'Chinese',
    countryOfOrigin: 'CHINA',
    mealType: 'DINNER',
    imageUrl: WM('thumb/f/fa/Char_siu_pieces.jpg/960px-Char_siu_pieces.jpg'),
    calories: 520,
    servings: 4,
    prepMinutes: 25,
    cookMinutes: 45,
    mealFrequency: 'Once per week',
    mealFrequencyReason:
      'Rich, fatty and sugar-glazed — best treated as a weekend centrepiece alongside rice and steamed greens.',
    ingredients: [
      ing('Pork shoulder', '900', 'g'),
      ing('Hoisin sauce', '3', 'tbsp'),
      ing('Honey', '3', 'tbsp'),
      ing('Light soy sauce', '2', 'tbsp'),
      ing('Shaoxing wine', '2', 'tbsp'),
      ing('Chinese five-spice', '1', 'tsp'),
      ing('Garlic', '4', 'cloves'),
      ing('Fermented red bean curd', '1', 'tbsp'),
    ],
    steps: steps(
      [
        ['Cut the pork shoulder into long strips about three fingers thick so every piece gets crust.', 10],
        ['Blend hoisin, soy, Shaoxing, five-spice, garlic and red bean curd into a marinade.', 5],
        ['Reserve a third of the marinade for glazing, then coat the pork in the rest and chill overnight.', 10],
        ['Roast on a rack over a water-filled tray at high heat, turning once.', 25],
        ['Stir honey into the reserved marinade and brush the pork generously.', 3],
        ['Return to the oven and glaze twice more until the edges blacken and blister.', 15],
        ['Rest ten minutes, then slice across the grain and spoon over the pan juices.', 10],
      ],
      WM('thumb/f/fa/Char_siu_pieces.jpg/960px-Char_siu_pieces.jpg')
    ),
    story:
      'Char siu literally means "fork burn" or "fork roast" in Cantonese, describing the long forks that once held seasoned pork over an open fire. It is a pillar of siu mei, the roast-meat trade whose lacquered windows still define Hong Kong and Guangzhou streets. The dish travelled with Cantonese migrants worldwide, reappearing as the pork in ramen, the filling in char siu bao, and the base of Hawaii’s manapua.',
    storyImageUrl: PHOTOS.story[5],
    vendorId: null,
    vendorName: null,
    rating: 4.8,
    reviewCount: 143,
  }),
  r({
    id: 113,
    title: 'Xiaolongbao Soup Dumplings',
    description:
      'Pleated parcels of pork holding a mouthful of hot broth, steamed in bamboo and eaten in one careful, scalding bite.',
    category: 'FOREIGN',
    cuisine: 'Chinese',
    countryOfOrigin: 'CHINA',
    mealType: 'LUNCH',
    imageUrl: WM('thumb/5/5e/Xiaolongbao_Shanghai.jpg/960px-Xiaolongbao_Shanghai.jpg'),
    calories: 390,
    servings: 4,
    prepMinutes: 60,
    cookMinutes: 10,
    mealFrequency: '2-3 times per month',
    mealFrequencyReason:
      'Modest in calories but labour-intensive and salty from the aspic — a project dish rather than a weeknight staple.',
    ingredients: [
      ing('Plain flour', '300', 'g'),
      ing('Warm water', '150', 'ml'),
      ing('Ground pork', '400', 'g'),
      ing('Pork skin aspic, chilled and diced', '200', 'g'),
      ing('Ginger, grated', '1', 'tbsp'),
      ing('Light soy sauce', '2', 'tbsp'),
      ing('Shaoxing wine', '1', 'tbsp'),
      ing('Sesame oil', '1', 'tsp'),
      ing('Spring onions', '3', 'pcs'),
    ],
    steps: steps(
      [
        ['Work flour and warm water into a smooth dough, then rest it under a cloth.', 30],
        ['Mix pork with ginger, soy, Shaoxing, sesame oil and spring onion, stirring one direction until sticky.', 8],
        ['Fold the diced aspic through the filling and chill it firm.', 20],
        ['Roll the dough into small balls and press each into a thin round with a thicker centre.', 25],
        ['Spoon in filling and pleat the edge upward, twisting the top closed.', 20],
        ['Steam in a lined bamboo basket over rolling water until the skins turn translucent.', 8],
        ['Serve with slivered ginger in black vinegar; nip the skin, sip the soup, then eat.', 2],
      ],
      WM('thumb/5/5e/Xiaolongbao_Shanghai.jpg/960px-Xiaolongbao_Shanghai.jpg')
    ),
    story:
      'Xiaolongbao emerged in Nanxiang, a town on the outskirts of Shanghai, in the 1870s, and the Nanxiang Mantou Dian still trades on that lineage. The famous soup is no trick: cooled pork-skin aspic is folded into the filling and melts back into broth in the steamer. The name refers to the xiaolong, the small bamboo basket the dumplings are steamed and served in.',
    storyImageUrl: PHOTOS.story[1],
    vendorId: null,
    vendorName: null,
    rating: 4.9,
    reviewCount: 207,
  }),
  r({
    id: 114,
    title: 'Chicken Katsu Curry',
    description:
      'A panko-crusted chicken cutlet sliced over rice and flooded with thick, gently sweet Japanese curry sauce.',
    category: 'FOREIGN',
    cuisine: 'Japanese',
    countryOfOrigin: 'JAPAN',
    mealType: 'DINNER',
    imageUrl: WM('thumb/2/27/Japanese_Katsu_Curry_01.jpg/960px-Japanese_Katsu_Curry_01.jpg'),
    calories: 780,
    servings: 4,
    prepMinutes: 20,
    cookMinutes: 35,
    mealFrequency: 'Once per week',
    mealFrequencyReason:
      'Deep-fried and served over a generous bed of rice — filling comfort food that sits best as a weekly treat.',
    ingredients: [
      ing('Chicken breasts', '4', 'pcs'),
      ing('Panko breadcrumbs', '150', 'g'),
      ing('Eggs', '2', 'pcs'),
      ing('Plain flour', '60', 'g'),
      ing('Onions', '2', 'pcs'),
      ing('Carrots', '2', 'pcs'),
      ing('Japanese curry roux blocks', '4', 'pcs'),
      ing('Chicken stock', '3', 'cups'),
      ing('Vegetable oil', '2', 'cups'),
      ing('Short-grain rice', '2', 'cups'),
    ],
    steps: steps(
      [
        ['Soften sliced onion and carrot in a pot until the onion turns golden and sweet.', 10],
        ['Add stock, simmer until the carrot is tender, then melt in the curry roux off the boil.', 15],
        ['Butterfly the chicken breasts and pound them to an even thickness.', 8],
        ['Dredge each cutlet in flour, then egg, then press firmly into panko.', 8],
        ['Shallow-fry at medium-high heat until deep golden on both sides.', 8],
        ['Drain on a rack so the crust stays crisp, then slice into thick fingers.', 3],
        ['Bed rice on one side of the plate, lay the katsu across it and ladle curry over the rice.', 3],
      ],
      WM('thumb/2/27/Japanese_Katsu_Curry_01.jpg/960px-Japanese_Katsu_Curry_01.jpg')
    ),
    story:
      'Curry reached Japan in the Meiji era via the British Royal Navy, which is why kare raisu is thick and stew-like rather than loose like its Indian ancestor. The Imperial Japanese Navy adopted it as standard rations, and it spread from there into schools and homes as a national comfort food. Pairing it with tonkatsu-style breaded cutlets came later, in post-war restaurants, and katsu curry is now a fixture of Japanese diners worldwide.',
    storyImageUrl: PHOTOS.story[3],
    vendorId: null,
    vendorName: null,
    rating: 4.7,
    reviewCount: 226,
  }),
  r({
    id: 115,
    title: 'Miso Ramen',
    description:
      'Springy noodles in a rich, fermented-soybean broth crowned with sweetcorn, butter, bamboo shoots and a jammy egg.',
    category: 'FOREIGN',
    cuisine: 'Japanese',
    countryOfOrigin: 'JAPAN',
    mealType: 'DINNER',
    imageUrl: WM('thumb/c/cc/Miso_ramen_in_Kochi.jpg/960px-Miso_ramen_in_Kochi.jpg'),
    calories: 650,
    servings: 4,
    prepMinutes: 25,
    cookMinutes: 40,
    mealFrequency: '1-2 times per week',
    mealFrequencyReason:
      'Warming and protein-rich, but miso and soy push the sodium high — go easy on the broth if you are watching salt.',
    ingredients: [
      ing('Fresh ramen noodles', '4', 'pcs'),
      ing('Red miso paste', '4', 'tbsp'),
      ing('Chicken or pork stock', '6', 'cups'),
      ing('Ground pork', '250', 'g'),
      ing('Garlic', '4', 'cloves'),
      ing('Ginger, grated', '1', 'tbsp'),
      ing('Toasted sesame oil', '1', 'tbsp'),
      ing('Eggs', '4', 'pcs'),
      ing('Sweetcorn', '1', 'cups'),
      ing('Spring onions', '4', 'pcs'),
    ],
    steps: steps(
      [
        ['Soft-boil the eggs for six and a half minutes, then chill and peel them.', 10],
        ['Fry ground pork in sesame oil with garlic and ginger until browned and crumbly.', 8],
        ['Stir the miso paste directly into the pork and let it toast until nutty.', 3],
        ['Pour in the stock and simmer gently — never boil, or the miso turns grainy.', 15],
        ['Cook the noodles separately in plenty of water so the broth stays clear of starch.', 3],
        ['Drain the noodles hard and nest them into warmed bowls.', 2],
        ['Ladle over broth and pork, then top with corn, halved egg and spring onion.', 3],
      ],
      WM('thumb/c/cc/Miso_ramen_in_Kochi.jpg/960px-Miso_ramen_in_Kochi.jpg')
    ),
    story:
      'Miso ramen is the youngest of the great ramen styles, created in Sapporo in the 1950s at a shop called Aji no Sanpei, where the owner worked miso into a pork-and-vegetable soup. Hokkaido’s brutal winters made the thick, fatty broth an obvious hit, and butter and sweetcorn became local signatures. It spread nationwide in the 1960s and remains the definitive taste of Sapporo.',
    storyImageUrl: PHOTOS.story[6],
    vendorId: null,
    vendorName: null,
    rating: 4.8,
    reviewCount: 174,
  }),
  r({
    id: 116,
    title: 'Chirashi Sushi Bowl',
    description:
      'Seasoned sushi rice scattered with glistening sashimi, ribbons of egg and pickles — sushi without the folding.',
    category: 'FOREIGN',
    cuisine: 'Japanese',
    countryOfOrigin: 'JAPAN',
    mealType: 'LUNCH',
    imageUrl: WM('thumb/9/90/Chirashi-zushi.jpg/960px-Chirashi-zushi.jpg'),
    calories: 520,
    servings: 4,
    prepMinutes: 35,
    cookMinutes: 20,
    mealFrequency: '2-3 times per week',
    mealFrequencyReason:
      'Lean fish, vegetables and modest fat make this one of the lighter celebration dishes — just keep the soy sauce restrained.',
    ingredients: [
      ing('Short-grain sushi rice', '3', 'cups'),
      ing('Rice vinegar', '4', 'tbsp'),
      ing('Sugar', '2', 'tbsp'),
      ing('Sashimi-grade salmon and tuna', '400', 'g'),
      ing('Eggs', '3', 'pcs'),
      ing('Cucumber', '1', 'pcs'),
      ing('Nori', '2', 'sheets'),
      ing('Pickled ginger', '3', 'tbsp'),
      ing('Salmon roe', '4', 'tbsp'),
    ],
    steps: steps(
      [
        ['Rinse the rice until the water runs clear, then cook it and let it steam covered.', 25],
        ['Warm vinegar, sugar and salt until dissolved to make the sushi-zu.', 3],
        ['Fold the dressing through the hot rice with a cutting motion while fanning it cool.', 8],
        ['Beat the eggs thin, cook them into flat omelettes and shred into fine ribbons.', 8],
        ['Slice the fish across the grain into clean, even sashimi pieces.', 10],
        ['Spread the cooled rice into a wide bowl or lacquer tray.', 3],
        ['Scatter over egg, fish, cucumber, roe, shredded nori and pickled ginger.', 5],
      ],
      WM('thumb/9/90/Chirashi-zushi.jpg/960px-Chirashi-zushi.jpg')
    ),
    story:
      'Chirashizushi means "scattered sushi", and it belongs to a home-cooking tradition far older than the polished nigiri counters of Tokyo. It is the sushi of celebration: families across Japan make it for Hinamatsuri, the Doll Festival on 3 March, where its colours stand in for spring. Regional versions vary enormously, from Osaka’s cooked-and-simmered toppings to the raw seafood style now common in restaurants.',
    storyImageUrl: PHOTOS.story[4],
    vendorId: null,
    vendorName: null,
    rating: 4.6,
    reviewCount: 96,
  }),
  r({
    id: 117,
    title: 'Pad Thai',
    description:
      'Rice noodles tossed hard in a wok with tamarind, palm sugar and fish sauce, finished with crushed peanuts and a squeeze of lime.',
    category: 'FOREIGN',
    cuisine: 'Thai',
    countryOfOrigin: 'THAILAND',
    mealType: 'LUNCH',
    imageUrl: WM('thumb/a/ac/Pad_thai_mound.jpg/960px-Pad_thai_mound.jpg'),
    calories: 590,
    servings: 4,
    prepMinutes: 25,
    cookMinutes: 15,
    mealFrequency: '1-2 times per week',
    mealFrequencyReason:
      'Balanced with egg, tofu and bean sprouts, though palm sugar and fish sauce make it sweet and salty — bulk it up with extra vegetables.',
    ingredients: [
      ing('Flat rice noodles', '300', 'g'),
      ing('Prawns', '300', 'g'),
      ing('Firm tofu, cubed', '150', 'g'),
      ing('Eggs', '2', 'pcs'),
      ing('Tamarind paste', '3', 'tbsp'),
      ing('Palm sugar', '3', 'tbsp'),
      ing('Fish sauce', '3', 'tbsp'),
      ing('Bean sprouts', '2', 'cups'),
      ing('Roasted peanuts, crushed', '60', 'g'),
      ing('Garlic chives', '1', 'cups'),
    ],
    steps: steps(
      [
        ['Soak the rice noodles in warm water until pliable but still firm.', 20],
        ['Melt palm sugar with tamarind and fish sauce into a glossy pad thai sauce.', 5],
        ['Sear the tofu in a screaming-hot wok until the edges brown, then push it aside.', 4],
        ['Add prawns and cook just until they curl and turn opaque.', 2],
        ['Crack in the eggs, scramble them roughly, then add the drained noodles and sauce.', 3],
        ['Toss constantly over high heat until the noodles absorb the sauce and gloss.', 3],
        ['Fold in bean sprouts and chives off the heat, then serve with peanuts and lime.', 2],
      ],
      WM('thumb/a/ac/Pad_thai_mound.jpg/960px-Pad_thai_mound.jpg')
    ),
    story:
      'Pad thai was actively promoted as a national dish in the late 1930s and 40s under Prime Minister Plaek Phibunsongkhram, whose government pushed rice noodles to cut domestic rice consumption and to forge a modern Thai identity. The stir-fried-noodle technique itself is Chinese in origin, reworked with Thai tamarind, palm sugar and fish sauce. What began as state campaign became genuine street food, and it is now the dish most of the world associates with Thailand.',
    storyImageUrl: PHOTOS.story[0],
    vendorId: null,
    vendorName: null,
    rating: 4.8,
    reviewCount: 241,
  }),
  r({
    id: 118,
    title: 'Green Curry with Chicken',
    description:
      'Coconut milk split with fiery green paste, simmered with chicken, pea aubergines and torn kaffir lime leaves.',
    category: 'FOREIGN',
    cuisine: 'Thai',
    countryOfOrigin: 'THAILAND',
    mealType: 'DINNER',
    imageUrl: WM(
      'thumb/e/e5/Thai_green_chicken_curry_and_roti.jpg/960px-Thai_green_chicken_curry_and_roti.jpg'
    ),
    calories: 540,
    servings: 4,
    prepMinutes: 20,
    cookMinutes: 25,
    mealFrequency: '1-2 times per week',
    mealFrequencyReason:
      'Vegetable-heavy and aromatic, but full-fat coconut milk brings serious saturated fat — a smaller bowl with more rice balances it.',
    ingredients: [
      ing('Chicken thigh, sliced', '600', 'g'),
      ing('Green curry paste', '4', 'tbsp'),
      ing('Coconut milk', '600', 'ml'),
      ing('Thai aubergines', '6', 'pcs'),
      ing('Bamboo shoots', '1', 'cups'),
      ing('Fish sauce', '2', 'tbsp'),
      ing('Palm sugar', '1', 'tbsp'),
      ing('Kaffir lime leaves', '5', 'pcs'),
      ing('Thai basil', '1', 'cups'),
    ],
    steps: steps(
      [
        ['Simmer the thick cream from the top of the coconut milk until the oil separates.', 6],
        ['Fry the green curry paste in that oil until deeply fragrant and darkened.', 4],
        ['Add the chicken and turn it through the paste until sealed on all sides.', 4],
        ['Pour in the remaining coconut milk and bring to a bare simmer.', 3],
        ['Add aubergines and bamboo shoots and cook until just tender.', 8],
        ['Season with fish sauce and palm sugar, tasting for the salty-sweet-hot balance.', 2],
        ['Tear in lime leaves and Thai basil off the heat and serve with jasmine rice.', 2],
      ],
      WM(
        'thumb/e/e5/Thai_green_chicken_curry_and_roti.jpg/960px-Thai_green_chicken_curry_and_roti.jpg'
      )
    ),
    story:
      'Kaeng khiao wan means "sweet green curry" — the sweet refers to the colour, not the taste, which is properly hot and salty. It is a central Thai curry documented from the early 20th century, its green coming from fresh bird’s eye chillies pounded with lemongrass, galangal, coriander root and shrimp paste. Coconut cream was traditionally cracked to release its oil before the paste went in, a step that separates a good curry from a flat one.',
    storyImageUrl: PHOTOS.story[7],
    videoSearchUrl: youtubeSearch('Thai Green Curry with Chicken'),
    vendorId: null,
    vendorName: null,
    rating: 4.7,
    reviewCount: 158,
  }),
  r({
    id: 119,
    title: 'Bibimbap',
    description:
      'A bowl of rice ringed with seasoned vegetables, beef and a runny egg, all mixed hard with gochujang before the first bite.',
    category: 'FOREIGN',
    cuisine: 'Korean',
    countryOfOrigin: 'SOUTH KOREA',
    mealType: 'LUNCH',
    imageUrl: WM('thumb/f/f5/Korean.food-Bibimbap-02.jpg/960px-Korean.food-Bibimbap-02.jpg'),
    calories: 610,
    servings: 4,
    prepMinutes: 35,
    cookMinutes: 25,
    mealFrequency: '3-4 times per week',
    mealFrequencyReason:
      'One of the best-balanced bowls there is — vegetables, protein and rice in one dish, with the gochujang the only real sodium concern.',
    ingredients: [
      ing('Short-grain rice', '3', 'cups'),
      ing('Beef sirloin, sliced thin', '300', 'g'),
      ing('Spinach', '200', 'g'),
      ing('Carrots, julienned', '2', 'pcs'),
      ing('Shiitake mushrooms', '150', 'g'),
      ing('Bean sprouts', '2', 'cups'),
      ing('Eggs', '4', 'pcs'),
      ing('Gochujang', '4', 'tbsp'),
      ing('Toasted sesame oil', '2', 'tbsp'),
      ing('Garlic', '3', 'cloves'),
    ],
    steps: steps(
      [
        ['Cook the rice and keep it hot and covered.', 25],
        ['Marinate the beef in soy, garlic and sesame oil while you prepare the namul.', 15],
        ['Blanch spinach and bean sprouts separately, squeeze dry and dress each with sesame oil and garlic.', 12],
        ['Stir-fry the carrot and the mushrooms separately so each keeps its own colour and flavour.', 8],
        ['Sear the marinated beef quickly over high heat until caramelised at the edges.', 4],
        ['Fry the eggs sunny side up, keeping the yolks soft.', 4],
        ['Arrange rice in bowls, fan the toppings over it in sections, crown with egg and gochujang.', 5],
      ],
      WM('thumb/f/f5/Korean.food-Bibimbap-02.jpg/960px-Korean.food-Bibimbap-02.jpg')
    ),
    story:
      'Bibimbap simply means "mixed rice", and the earliest written reference appears as goldongban in the 19th-century Korean cookbook Siuijeonseo. Jeonju in North Jeolla Province is its most famous home, where the rice is cooked in beef broth and the vegetable namul are counted as a point of local pride. Beyond restaurants, it has long been practical food — a way to gather leftover banchan into one bowl, and the dish served at ancestral rites once the offerings came down from the table.',
    storyImageUrl: PHOTOS.story[1],
    vendorId: null,
    vendorName: null,
    rating: 4.9,
    reviewCount: 219,
  }),
  r({
    id: 120,
    title: 'Korean Fried Chicken',
    description:
      'Double-fried wings shattering under a sticky gochujang glaze, sesame-flecked and impossible to eat quietly.',
    category: 'FOREIGN',
    cuisine: 'Korean',
    countryOfOrigin: 'SOUTH KOREA',
    mealType: 'SNACK',
    imageUrl: WM(
      'thumb/6/6a/Yangnyeom_Chicken_Korean_fried_chicken.jpg/960px-Yangnyeom_Chicken_Korean_fried_chicken.jpg'
    ),
    calories: 700,
    servings: 4,
    prepMinutes: 25,
    cookMinutes: 30,
    mealFrequency: '2-3 times per month',
    mealFrequencyReason:
      'Twice-fried and sugar-glazed — a genuine indulgence best kept to occasions, with pickled radish to cut the richness.',
    ingredients: [
      ing('Chicken wings', '1000', 'g'),
      ing('Potato starch', '150', 'g'),
      ing('Gochujang', '3', 'tbsp'),
      ing('Soy sauce', '2', 'tbsp'),
      ing('Rice syrup or honey', '3', 'tbsp'),
      ing('Garlic, minced', '4', 'cloves'),
      ing('Rice vinegar', '1', 'tbsp'),
      ing('Vegetable oil', '4', 'cups'),
      ing('Toasted sesame seeds', '1', 'tbsp'),
    ],
    steps: steps(
      [
        ['Pat the wings bone dry and toss them thoroughly in potato starch.', 10],
        ['Fry at moderate heat until pale gold and just cooked through, then drain.', 10],
        ['Rest the wings on a rack so steam escapes and the crust sets.', 10],
        ['Raise the oil temperature and fry a second time until deeply crisp and blistered.', 5],
        ['Simmer gochujang, soy, rice syrup, garlic and vinegar into a glossy glaze.', 5],
        ['Toss the hot wings through the glaze in a wide bowl until fully coated.', 2],
        ['Scatter sesame seeds and serve at once with pickled radish cubes.', 2],
      ],
      WM(
        'thumb/6/6a/Yangnyeom_Chicken_Korean_fried_chicken.jpg/960px-Yangnyeom_Chicken_Korean_fried_chicken.jpg'
      )
    ),
    story:
      'Fried chicken arrived in Korea with American troops around the Korean War, but the modern style took shape in the 1970s and 80s as cooking oil became affordable and chains like Lims Chicken spread. The double-fry technique and thin starch coating produce a crust that survives saucing — the key innovation over its American ancestor. Yangnyeom, the sweet-spicy glazed version, dates to the mid-1980s, and chimaek, chicken with beer, is now a national pastime.',
    storyImageUrl: PHOTOS.story[3],
    vendorId: null,
    vendorName: null,
    rating: 4.8,
    reviewCount: 253,
  }),
  r({
    id: 121,
    title: 'Butter Chicken',
    description:
      'Charred tandoori chicken swimming in a velvet tomato-cream gravy, finished with a knob of butter and a crush of dried fenugreek.',
    category: 'FOREIGN',
    cuisine: 'Indian',
    countryOfOrigin: 'INDIA',
    mealType: 'DINNER',
    imageUrl: WM('thumb/5/56/Butter_Chicken.jpg/960px-Butter_Chicken.jpg'),
    calories: 590,
    servings: 4,
    prepMinutes: 30,
    cookMinutes: 40,
    mealFrequency: 'Once a week',
    mealFrequencyReason:
      'Cream and butter make this rich; keep the portion modest, skip the second naan, and lean on a cucumber salad alongside.',
    ingredients: [
      ing('Chicken thighs, boneless', '800', 'g'),
      ing('Thick yoghurt', '200', 'g'),
      ing('Ginger-garlic paste', '2', 'tbsp'),
      ing('Tomato puree', '500', 'ml'),
      ing('Butter', '80', 'g'),
      ing('Double cream', '150', 'ml'),
      ing('Kashmiri chilli powder', '2', 'tsp'),
      ing('Garam masala', '1', 'tsp'),
      ing('Dried fenugreek leaves', '1', 'tbsp'),
    ],
    steps: steps(
      [
        ['Marinate the chicken in yoghurt, ginger-garlic paste, chilli powder and salt.', 30],
        ['Grill or pan-sear the chicken hard until edges blacken; set aside with its juices.', 12],
        ['Melt butter, bloom the remaining spices, then pour in the tomato puree.', 5],
        ['Simmer the gravy until it thickens and the butter separates at the edges.', 15],
        ['Blend the sauce smooth if you want the restaurant texture, then return it to the pan.', 5],
        ['Slide in the chicken, stir through cream and crushed fenugreek, and simmer gently.', 8],
        ['Finish with an extra knob of butter and serve with naan or basmati.', null],
      ],
      WM('thumb/5/56/Butter_Chicken.jpg/960px-Butter_Chicken.jpg')
    ),
    story:
      'Butter chicken — murgh makhani — was invented in the 1950s at Moti Mahal in Delhi, where cooks who had fled Peshawar during Partition rescued unsold tandoori chicken by simmering it in a tomato, butter and cream gravy. What began as thrift became one of the most recognised Indian dishes on earth. Its Punjabi refugee origins are why it tastes of the tandoor first and the sauce second.',
    storyImageUrl: PHOTOS.story[0],
    vendorId: null,
    vendorName: null,
    rating: 4.8,
    reviewCount: 214,
  }),
  r({
    id: 122,
    title: 'Chana Masala',
    description:
      'Chickpeas stewed down in a dark, tangy onion-tomato masala until the gravy clings to every pea and the amchur cuts clean through it.',
    category: 'FOREIGN',
    cuisine: 'Indian',
    countryOfOrigin: 'INDIA',
    mealType: 'LUNCH',
    imageUrl: WM('thumb/7/7f/Chana_masala_gravy.JPG/960px-Chana_masala_gravy.JPG'),
    calories: 340,
    servings: 4,
    prepMinutes: 15,
    cookMinutes: 40,
    mealFrequency: '3-4 times per week',
    mealFrequencyReason:
      'High in plant protein and fibre with very little added fat — one of the easiest weeknight dishes to eat often.',
    ingredients: [
      ing('Chickpeas, cooked', '500', 'g'),
      ing('Onions', '2', 'pcs'),
      ing('Tomatoes', '4', 'pcs'),
      ing('Ginger-garlic paste', '1', 'tbsp'),
      ing('Ground cumin', '2', 'tsp'),
      ing('Ground coriander', '2', 'tsp'),
      ing('Amchur (dried mango powder)', '1', 'tsp'),
      ing('Garam masala', '1', 'tsp'),
      ing('Vegetable oil', '3', 'tbsp'),
    ],
    steps: steps(
      [
        ['Fry finely chopped onion in oil until deeply browned, not just soft.', 12],
        ['Add ginger-garlic paste and cook off the raw smell.', 2],
        ['Stir in cumin, coriander and chilli, then the chopped tomatoes.', 3],
        ['Cook the masala down until it darkens and oil pools at the sides.', 12],
        ['Add the chickpeas with a splash of their cooking water; mash a few against the pan to thicken.', 10],
        ['Finish with amchur and garam masala, then rest off the heat before serving.', 5],
      ],
      WM('thumb/7/7f/Chana_masala_gravy.JPG/960px-Chana_masala_gravy.JPG')
    ),
    story:
      'Chana masala belongs to the Punjabi and Delhi street kitchens of north India, where it is paired with fried bhatura bread for the classic chole bhature. The signature sourness comes from amchur or pomegranate seed powder rather than the tamarind used further south. Chickpeas have grown across the subcontinent for millennia, which is part of why the dish reads as ordinary and beloved rather than special-occasion.',
    storyImageUrl: PHOTOS.story[3],
    vendorId: null,
    vendorName: null,
    rating: 4.6,
    reviewCount: 178,
  }),
  r({
    id: 123,
    title: 'Lamb Biryani',
    description:
      'Spiced lamb and half-cooked basmati layered in a sealed pot and steamed until the rice runs from saffron gold to white in a single spoonful.',
    category: 'FOREIGN',
    cuisine: 'Indian',
    countryOfOrigin: 'INDIA',
    mealType: 'DINNER',
    imageUrl: WM(
      'thumb/e/ed/Lamb_Biryani_-_Biryani_House_AUD8.50_%283643374430%29.jpg/960px-Lamb_Biryani_-_Biryani_House_AUD8.50_%283643374430%29.jpg'
    ),
    calories: 720,
    servings: 6,
    prepMinutes: 45,
    cookMinutes: 75,
    mealFrequency: 'Once a week',
    mealFrequencyReason:
      'Rich in fatty lamb, ghee and rice — treat it as the centrepiece of one meal rather than a regular weekday plate.',
    ingredients: [
      ing('Lamb shoulder, bone-in', '1000', 'g'),
      ing('Basmati rice', '4', 'cups'),
      ing('Thick yoghurt', '300', 'g'),
      ing('Onions', '4', 'pcs'),
      ing('Ghee', '6', 'tbsp'),
      ing('Biryani masala', '3', 'tbsp'),
      ing('Saffron strands', '1', 'tsp'),
      ing('Mint and coriander', '2', 'cups'),
      ing('Milk, warm', '100', 'ml'),
    ],
    steps: steps(
      [
        ['Fry sliced onions in ghee until crisp and dark; drain and reserve the birista.', 20],
        ['Marinate lamb in yoghurt, biryani masala, half the fried onions and salt.', 40],
        ['Cook the marinated lamb until tender and the gravy is thick, not watery.', 45],
        ['Boil soaked basmati in heavily salted water to 70 percent done, then drain.', 8],
        ['Layer lamb, rice, herbs and fried onions; pour over saffron steeped in warm milk.', 5],
        ['Seal the pot with dough or foil and steam on the lowest heat — this is the dum.', 25],
        ['Rest sealed for ten minutes, then lift from the bottom so each plate gets both layers.', 10],
      ],
      WM(
        'thumb/e/ed/Lamb_Biryani_-_Biryani_House_AUD8.50_%283643374430%29.jpg/960px-Lamb_Biryani_-_Biryani_House_AUD8.50_%283643374430%29.jpg'
      )
    ),
    story:
      'Biryani arrived with Persian-influenced Mughal court cooking and then splintered into fiercely defended regional styles — Hyderabadi, Lucknawi, Kolkata, Malabar — each arguing over spice level, whether the meat is raw-cooked in the pot, and what belongs under the lid. The dum method of sealing the vessel with dough traps steam and aroma so the rice cooks in the lamb’s own perfume. Kolkata’s version famously carries a potato, a legacy of Awadhi cooks stretching expensive meat further.',
    storyImageUrl: PHOTOS.story[5],
    vendorId: null,
    vendorName: null,
    rating: 4.9,
    reviewCount: 246,
  }),
  r({
    id: 124,
    title: 'Masala Dosa',
    description:
      'A fermented rice-and-lentil crepe spread paper-thin on a screaming griddle, wrapped around soft turmeric potatoes and served with sambar and coconut chutney.',
    category: 'FOREIGN',
    cuisine: 'Indian',
    countryOfOrigin: 'INDIA',
    mealType: 'BREAKFAST',
    imageUrl: WM('thumb/f/f4/Masala_Dosa.jpg/960px-Masala_Dosa.jpg'),
    calories: 430,
    servings: 4,
    prepMinutes: 30,
    cookMinutes: 30,
    mealFrequency: '2-3 times per week',
    mealFrequencyReason:
      'Fermentation makes the batter easy to digest and the filling is vegetable-led; just go light on the ghee at the griddle.',
    ingredients: [
      ing('Rice', '3', 'cups'),
      ing('Urad dal', '1', 'cups'),
      ing('Fenugreek seeds', '1', 'tsp'),
      ing('Potatoes', '5', 'pcs'),
      ing('Onions', '2', 'pcs'),
      ing('Mustard seeds', '1', 'tsp'),
      ing('Curry leaves', '2', 'sprigs'),
      ing('Turmeric', '1', 'tsp'),
      ing('Ghee', '4', 'tbsp'),
    ],
    steps: steps(
      [
        ['Soak rice, urad dal and fenugreek separately for at least four hours.', 30],
        ['Grind to a smooth batter, salt it, and leave overnight to ferment until risen and sour.', 20],
        ['Temper mustard seeds and curry leaves, add onion, turmeric and boiled crushed potatoes.', 15],
        ['Heat a flat griddle until a water drop dances, then wipe it with a halved onion.', 3],
        ['Pour a ladle of batter and spiral it outward with the ladle base into a thin disc.', 2],
        ['Drizzle ghee around the rim and cook until the underside is lacquered and crisp.', 3],
        ['Spoon potato masala down the centre, fold, and serve with sambar and coconut chutney.', 2],
      ],
      WM('thumb/f/f4/Masala_Dosa.jpg/960px-Masala_Dosa.jpg')
    ),
    story:
      'The dosa is a South Indian staple with a long documented history in Tamil literature, but the potato-stuffed masala dosa is widely traced to Karnataka, and Bengaluru institutions such as Vidyarthi Bhavan and MTR are credited with popularising the form it takes today. The batter’s overnight fermentation is the whole trick — wild yeasts and lactic bacteria give it both lift and that faint sourness. It travelled north with Udupi restaurants until it became India’s most portable breakfast.',
    storyImageUrl: PHOTOS.story[1],
    vendorId: null,
    vendorName: null,
    rating: 4.7,
    reviewCount: 163,
  }),
  r({
    id: 125,
    title: 'Chicken Tacos al Pastor',
    description:
      'Achiote-and-chilli marinated chicken seared hard, piled into warm corn tortillas with charred pineapple, onion and coriander.',
    category: 'FOREIGN',
    cuisine: 'Mexican',
    countryOfOrigin: 'MEXICO',
    mealType: 'DINNER',
    imageUrl: WM('thumb/e/e7/Al_pastor_tacos.jpg/960px-Al_pastor_tacos.jpg'),
    calories: 480,
    servings: 4,
    prepMinutes: 25,
    cookMinutes: 25,
    mealFrequency: '2-3 times per week',
    mealFrequencyReason:
      'Lean chicken, corn tortillas and fresh salsa keep it light — the pineapple sugar is the only thing to watch.',
    ingredients: [
      ing('Chicken thighs, boneless', '800', 'g'),
      ing('Guajillo chillies, dried', '4', 'pcs'),
      ing('Achiote paste', '3', 'tbsp'),
      ing('Pineapple', '1', 'pcs'),
      ing('White vinegar', '3', 'tbsp'),
      ing('Garlic', '4', 'cloves'),
      ing('Corn tortillas', '12', 'pcs'),
      ing('White onion', '1', 'pcs'),
      ing('Coriander', '1', 'cups'),
    ],
    steps: steps(
      [
        ['Toast the dried guajillos briefly, then soak them in hot water until pliable.', 15],
        ['Blend chillies with achiote, garlic, vinegar and a little pineapple into a thick marinade.', 5],
        ['Coat the chicken thighs and marinate, ideally several hours.', 60],
        ['Sear the chicken in a very hot pan or on a grill until the edges char.', 12],
        ['Grill thick pineapple slices alongside until caramelised, then dice both.', 6],
        ['Warm the tortillas directly on the flame until they puff and smell toasted.', 3],
        ['Fill with chicken and pineapple, top with raw onion, coriander and lime.', null],
      ],
      WM('thumb/e/e7/Al_pastor_tacos.jpg/960px-Al_pastor_tacos.jpg')
    ),
    story:
      'Tacos al pastor descend from the shawarma brought to Mexico by Lebanese immigrants in the early twentieth century, whose vertical spit was adopted in Puebla and Mexico City and reworked with pork, dried chillies and achiote. The name means "shepherd style", and the trompo — the spinning cone crowned with a pineapple — is the direct descendant of that Levantine grill. Chicken versions are a modern home-kitchen adaptation of a technique built for the spit.',
    storyImageUrl: PHOTOS.story[6],
    vendorId: null,
    vendorName: null,
    rating: 4.7,
    reviewCount: 201,
  }),
  r({
    id: 126,
    title: 'Chiles en Nogada',
    description:
      'Roasted poblanos stuffed with sweet-savoury picadillo, blanketed in cold walnut cream and scattered with pomegranate seeds and parsley.',
    category: 'FOREIGN',
    cuisine: 'Mexican',
    countryOfOrigin: 'MEXICO',
    mealType: 'DINNER',
    imageUrl: WM('thumb/f/f5/Chiles_en_nogada_cl%C3%A1sicos.jpg/960px-Chiles_en_nogada_cl%C3%A1sicos.jpg'),
    calories: 640,
    servings: 4,
    prepMinutes: 50,
    cookMinutes: 45,
    mealFrequency: 'Once or twice a month',
    mealFrequencyReason:
      'Walnut cream and fried picadillo make this dense and seasonal — it was always meant as a celebration plate.',
    ingredients: [
      ing('Poblano chillies', '4', 'pcs'),
      ing('Minced pork and beef', '500', 'g'),
      ing('Walnuts, shelled', '200', 'g'),
      ing('Cream cheese', '150', 'g'),
      ing('Milk', '150', 'ml'),
      ing('Apple and pear, diced', '2', 'pcs'),
      ing('Raisins', '60', 'g'),
      ing('Pomegranate seeds', '1', 'cups'),
      ing('Flat-leaf parsley', '3', 'sprigs'),
    ],
    steps: steps(
      [
        ['Char the poblanos over an open flame until blackened, then sweat them in a covered bowl.', 15],
        ['Peel and slit each chilli carefully, removing seeds but leaving the stem on.', 10],
        ['Fry the minced meat with onion and garlic, then add fruit, raisins and warm spices.', 20],
        ['Cook the picadillo down until glossy and barely wet, then cool slightly.', 10],
        ['Blend walnuts with cream cheese and milk into a smooth, pourable nogada and chill it.', 10],
        ['Stuff each chilli generously and set it seam-down on the plate.', 5],
        ['Pour the cold nogada over the warm chillies and finish with pomegranate and parsley.', null],
      ],
      WM('thumb/f/f5/Chiles_en_nogada_cl%C3%A1sicos.jpg/960px-Chiles_en_nogada_cl%C3%A1sicos.jpg')
    ),
    story:
      'Chiles en nogada is Puebla’s most patriotic dish, its green chilli, white walnut sauce and red pomegranate matching the Mexican flag. It is eaten in a short late-summer window when fresh walnuts, pomegranates and the criollo fruit for the picadillo are all in season at once. Popular accounts link it to Agustín de Iturbide’s visit to Puebla in 1821, though the convent-kitchen attribution is tradition rather than settled history.',
    storyImageUrl: PHOTOS.story[2],
    vendorId: null,
    vendorName: null,
    rating: 4.6,
    reviewCount: 88,
  }),
  r({
    id: 127,
    title: 'Pozole Rojo',
    description:
      'A deep red hominy and pork broth built on toasted guajillo chillies, served with a whole table of shredded cabbage, radish, oregano and lime.',
    category: 'FOREIGN',
    cuisine: 'Mexican',
    countryOfOrigin: 'MEXICO',
    mealType: 'DINNER',
    imageUrl: WM('thumb/d/d4/Pozole_rojo_%282017%29.jpg/960px-Pozole_rojo_%282017%29.jpg'),
    calories: 520,
    servings: 6,
    prepMinutes: 30,
    cookMinutes: 150,
    mealFrequency: 'Once a week',
    mealFrequencyReason:
      'Long-simmered pork makes the broth fatty, but the hominy and mountain of raw garnishes balance the bowl well.',
    ingredients: [
      ing('Pork shoulder', '1000', 'g'),
      ing('Hominy (cacahuazintle), cooked', '800', 'g'),
      ing('Guajillo chillies, dried', '6', 'pcs'),
      ing('Ancho chillies, dried', '2', 'pcs'),
      ing('White onion', '1', 'pcs'),
      ing('Garlic', '6', 'cloves'),
      ing('Dried oregano', '1', 'tbsp'),
      ing('Radishes', '6', 'pcs'),
      ing('Cabbage, shredded', '2', 'cups'),
    ],
    steps: steps(
      [
        ['Simmer the pork with onion, garlic and salt until it shreds easily; skim the broth.', 120],
        ['Toast the dried chillies until fragrant, then soak them in hot broth.', 15],
        ['Blend the soaked chillies smooth and strain the paste into the pot.', 10],
        ['Add the hominy and let everything simmer together so the broth turns properly red.', 30],
        ['Shred the pork and return it to the pot; adjust salt and oregano.', 10],
        ['Set out radish, cabbage, onion, lime and tostadas so each bowl is finished at the table.', null],
      ],
      WM('thumb/d/d4/Pozole_rojo_%282017%29.jpg/960px-Pozole_rojo_%282017%29.jpg')
    ),
    story:
      'Pozole is a pre-Hispanic dish — Spanish chroniclers recorded Mexica versions made with nixtamalized maize, and it carried ceremonial weight long before pork arrived with the Spanish. The hominy at its centre is corn treated with lime, the same nixtamal process that makes tortillas possible. Today the rojo, blanco and verde styles map roughly onto Jalisco, Guerrero and Guerrero-adjacent traditions, and a pot of it is standard for Mexican Independence Day.',
    storyImageUrl: PHOTOS.story[4],
    vendorId: null,
    vendorName: null,
    rating: 4.7,
    reviewCount: 134,
  }),
  r({
    id: 128,
    title: 'Enchiladas Verdes',
    description:
      'Corn tortillas rolled around shredded chicken, drowned in a bright tomatillo salsa and blistered under crema and crumbled cheese.',
    category: 'FOREIGN',
    cuisine: 'Mexican',
    countryOfOrigin: 'MEXICO',
    mealType: 'LUNCH',
    imageUrl: WM('thumb/5/5f/Enchiladas_verdes_con_pollo.jpg/960px-Enchiladas_verdes_con_pollo.jpg'),
    calories: 550,
    servings: 4,
    prepMinutes: 25,
    cookMinutes: 35,
    mealFrequency: '1-2 times per week',
    mealFrequencyReason:
      'The tomatillo sauce is genuinely light; the cheese and crema are what push the calories, so serve them with a hand rather than a ladle.',
    ingredients: [
      ing('Tomatillos', '600', 'g'),
      ing('Serrano chillies', '2', 'pcs'),
      ing('Chicken breast, poached', '500', 'g'),
      ing('Corn tortillas', '12', 'pcs'),
      ing('White onion', '1', 'pcs'),
      ing('Coriander', '1', 'cups'),
      ing('Mexican crema', '150', 'ml'),
      ing('Queso fresco', '150', 'g'),
    ],
    steps: steps(
      [
        ['Boil or roast the tomatillos with serranos, onion and garlic until they slump and dull.', 12],
        ['Blend with coriander and salt into a loose, vivid green salsa.', 5],
        ['Fry the salsa briefly in hot oil so it deepens and loses its raw edge.', 8],
        ['Shred the poached chicken and season it with a spoonful of the sauce.', 5],
        ['Soften each tortilla in warm oil or sauce so it rolls without cracking.', 8],
        ['Fill and roll the tortillas, pack them seam-down in a dish, and flood with the rest of the salsa.', 8],
        ['Top with crema and queso fresco and bake or grill just until bubbling.', 12],
      ],
      WM('thumb/5/5f/Enchiladas_verdes_con_pollo.jpg/960px-Enchiladas_verdes_con_pollo.jpg')
    ),
    story:
      'Enchiladas are simply tortillas bathed in chilli sauce, a practice as old as the tortilla itself and recorded in Mexico’s earliest cookbooks under names like "tortillas enchiladas". The verde version leans on the tomatillo, a husked fruit native to Mexico and used since pre-Hispanic times, which gives the sauce its sharpness. Frying the salsa before saucing is the step home cooks skip and Mexican kitchens never do.',
    storyImageUrl: PHOTOS.story[7],
    vendorId: null,
    vendorName: null,
    rating: 4.5,
    reviewCount: 112,
  }),
  r({
    id: 129,
    title: 'Falafel with Hummus',
    description:
      'Craggy, herb-green chickpea fritters fried until they crack open, spooned onto a swirl of hummus with tahini and pickles.',
    category: 'FOREIGN',
    cuisine: 'Middle Eastern',
    countryOfOrigin: 'LEBANON',
    mealType: 'LUNCH',
    imageUrl: WM(
      'thumb/4/4d/Falafel_and_Homemade_Hummus_-_Lavash_2024-09-11.jpg/960px-Falafel_and_Homemade_Hummus_-_Lavash_2024-09-11.jpg'
    ),
    calories: 510,
    servings: 4,
    prepMinutes: 25,
    cookMinutes: 20,
    mealFrequency: '1-2 times per week',
    mealFrequencyReason:
      'Chickpeas and tahini bring protein and good fats, but the falafel are deep-fried — bake them if you want this more often.',
    ingredients: [
      ing('Dried chickpeas, soaked overnight', '400', 'g'),
      ing('Flat-leaf parsley', '4', 'sprigs'),
      ing('Coriander', '1', 'cups'),
      ing('Garlic', '5', 'cloves'),
      ing('Ground cumin', '2', 'tsp'),
      ing('Baking powder', '1', 'tsp'),
      ing('Tahini', '5', 'tbsp'),
      ing('Lemon juice', '4', 'tbsp'),
      ing('Sunflower oil for frying', '750', 'ml'),
    ],
    steps: steps(
      [
        ['Drain the soaked chickpeas thoroughly — never use tinned, and never boil them first.', 10],
        ['Grind raw chickpeas with herbs, garlic, cumin and salt to a coarse, damp crumb.', 8],
        ['Chill the mixture, then stir in baking powder just before shaping.', 30],
        ['Shape into small patties or quenelles and let them sit briefly to firm up.', 10],
        ['Reserve a third of the chickpeas, boil them soft, and blend with tahini, lemon and garlic for the hummus.', 25],
        ['Fry the falafel in hot oil until deep brown and hollow-sounding, then drain.', 10],
        ['Spread the hummus wide, pile the falafel on, and finish with tahini sauce and pickles.', null],
      ],
      WM(
        'thumb/4/4d/Falafel_and_Homemade_Hummus_-_Lavash_2024-09-11.jpg/960px-Falafel_and_Homemade_Hummus_-_Lavash_2024-09-11.jpg'
      )
    ),
    story:
      'Falafel’s origins are genuinely contested across the eastern Mediterranean: Egypt fries a fava-bean version called ta’amiya, while Levantine kitchens in Lebanon, Syria and Palestine use chickpeas, and both claim considerable antiquity. What is not contested is the technique — the chickpeas must be soaked raw, never cooked, or the fritters collapse in the oil. Hummus bi tahina has an equally long Levantine record and the pairing has become the default plate of the region’s street corners.',
    storyImageUrl: PHOTOS.story[3],
    vendorId: null,
    vendorName: null,
    rating: 4.6,
    reviewCount: 189,
  }),
  r({
    id: 130,
    title: 'Lamb Kofta Kebabs',
    description:
      'Hand-moulded minced lamb, heavy with parsley, onion and warm spice, pressed onto skewers and grilled until the fat drips and flares.',
    category: 'FOREIGN',
    cuisine: 'Middle Eastern',
    countryOfOrigin: 'LEBANON',
    mealType: 'DINNER',
    imageUrl: WM('thumb/1/19/Grilled_Kefta_Skewers.jpg/960px-Grilled_Kefta_Skewers.jpg'),
    calories: 470,
    servings: 4,
    prepMinutes: 25,
    cookMinutes: 15,
    mealFrequency: '1-2 times per week',
    mealFrequencyReason:
      'Red meat and lamb fat mean moderation, but grilling lets a good deal of that fat render away — serve with tabbouleh rather than chips.',
    ingredients: [
      ing('Minced lamb', '700', 'g'),
      ing('Onion, grated', '1', 'pcs'),
      ing('Flat-leaf parsley', '5', 'sprigs'),
      ing('Garlic', '3', 'cloves'),
      ing('Ground allspice', '1', 'tsp'),
      ing('Ground cinnamon', '1', 'tsp'),
      ing('Sumac', '1', 'tsp'),
      ing('Flatbreads', '4', 'pcs'),
    ],
    steps: steps(
      [
        ['Squeeze the grated onion dry — wet onion is what makes kofta slide off the skewer.', 5],
        ['Mix lamb with onion, finely chopped parsley, garlic, allspice, cinnamon and salt.', 8],
        ['Knead the mixture firmly until it turns slightly sticky and holds together.', 5],
        ['Chill the mince so the fat firms up before shaping.', 30],
        ['Press portions around flat skewers into long, even sausages with ridged edges.', 10],
        ['Grill over high direct heat, turning once, until charred outside and just pink within.', 12],
        ['Rest on warm flatbread so the bread catches the juices, then dust with sumac.', 5],
      ],
      WM('thumb/1/19/Grilled_Kefta_Skewers.jpg/960px-Grilled_Kefta_Skewers.jpg')
    ),
    story:
      'Kofta belongs to a vast family of spiced minced-meat dishes stretching from the Balkans through Turkey and the Levant to South Asia, with the word itself coming from the Persian kuftan, "to pound". The Lebanese kafta leans on parsley, onion and allspice rather than the chilli-forward Turkish adana. Grilling it on a flat skewer over charcoal is the version that anchors the mezze table and the summer garden alike.',
    storyImageUrl: PHOTOS.story[6],
    vendorId: null,
    vendorName: null,
    rating: 4.8,
    reviewCount: 157,
  }),
];

const li = (
  id: number,
  type: Listing['type'],
  title: string,
  amountMinor: number,
  vendorId: number,
  img: string,
  extra: Partial<Listing> = {}
): Listing => {
  const vendor = demoVendors.find((v) => v.id === vendorId)!;
  return {
    id,
    type,
    title,
    description: extra.description ?? '',
    imageUrl: img,
    amountMinor,
    currency: vendor.country === 'GH' ? 'GHS' : 'NGN',
    compareAtMinor: null,
    country: vendor.country,
    available: true,
    stockQty: 25,
    quantity: '1',
    unit: 'pack',
    prepMinutes: null,
    vendorId,
    vendorName: vendor.name,
    vendorLogoUrl: vendor.logoUrl,
    status: 'APPROVED',
    linkedRecipeId: null,
    ...extra,
  };
};

export const demoListings: Listing[] = [
  // GH food (Auntie Ama's Kitchen #1, Chale Chop Bar #5)
  li(1, 'FOOD', 'Jollof Rice with Grilled Chicken', 4500, 1, PHOTOS.listing[14], {
    description: 'Smoky party jollof, half chicken, shito on the side.',
    compareAtMinor: 6000, prepMinutes: 31, linkedRecipeId: 1,
  }),
  li(2, 'FOOD', 'Waakye Special (Full Works)', 3800, 5, PHOTOS.listing[16], {
    description: 'Waakye, gari, spaghetti, egg, wele and shito.',
    prepMinutes: 20, linkedRecipeId: 2,
  }),
  li(3, 'FOOD', 'Banku & Grilled Tilapia', 6500, 5, PHOTOS.listing[1], {
    description: 'Whole tilapia, two banku, fresh kpakpo shito.',
    compareAtMinor: 7500, prepMinutes: 35, linkedRecipeId: 4,
  }),
  li(4, 'FOOD', 'Kelewele Night Pack', 1800, 1, PHOTOS.listing[19], {
    description: 'Spicy ginger plantain with roasted groundnuts.',
    prepMinutes: 15, linkedRecipeId: 5,
  }),
  li(5, 'FOOD', 'Groundnut Soup + Omo Tuo (2)', 5200, 1, PHOTOS.listing[8], {
    description: 'Silky nkatenkwan with two rice balls.', prepMinutes: 25, linkedRecipeId: 7,
  }),
  // NG food (Mama Ngozi #2, Naija Bites #6)
  li(6, 'FOOD', 'Egusi Soup + Pounded Yam', 350000, 2, PHOTOS.listing[10], {
    description: 'Rich egusi with assorted meat, fresh pounded yam.',
    compareAtMinor: 420000, prepMinutes: 30, linkedRecipeId: 8,
  }),
  li(7, 'FOOD', 'Suya Platter (Beef, 6 sticks)', 250000, 6, PHOTOS.listing[5], {
    description: 'Char-grilled, extra yaji, onions and tomato.',
    prepMinutes: 18, linkedRecipeId: 9,
  }),
  li(8, 'FOOD', 'Moi Moi (4 wraps)', 120000, 2, PHOTOS.listing[9], {
    description: 'Leaf-steamed with egg and titus fish.', prepMinutes: 20, linkedRecipeId: 10,
  }),
  li(9, 'FOOD', 'Catfish Pepper Soup', 280000, 2, PHOTOS.listing[2], {
    description: 'Fresh catfish, scent leaves, proper heat.', prepMinutes: 25, linkedRecipeId: 11,
  }),
  // GH ingredients (Makola Fresh Market #3)
  li(10, 'INGREDIENT', 'Long-grain Rice', 2200, 3, PHOTOS.listing[3], { quantity: '5', unit: 'kg' }),
  li(11, 'INGREDIENT', 'Fresh Tomatoes', 900, 3, PHOTOS.listing[4], { quantity: '1', unit: 'kg', compareAtMinor: 1200 }),
  li(12, 'INGREDIENT', 'Onions', 700, 3, PHOTOS.listing[6], { quantity: '1', unit: 'kg' }),
  li(13, 'INGREDIENT', 'Scotch Bonnet Pepper', 500, 3, PHOTOS.listing[7], { quantity: '250', unit: 'g' }),
  li(14, 'INGREDIENT', 'Whole Chicken', 4800, 3, PHOTOS.listing[11], { quantity: '1.5', unit: 'kg' }),
  li(15, 'INGREDIENT', 'Red Palm Oil', 1600, 3, PHOTOS.listing[12], { quantity: '750', unit: 'ml' }),
  li(16, 'INGREDIENT', 'Black-eyed Beans', 1400, 3, PHOTOS.listing[13], { quantity: '1', unit: 'kg' }),
  li(17, 'INGREDIENT', 'Ripe Plantains', 1000, 3, PHOTOS.listing[0], { quantity: '4', unit: 'pcs' }),
  li(18, 'INGREDIENT', 'Fresh Ginger', 450, 3, PHOTOS.listing[15], { quantity: '250', unit: 'g' }),
  // NG ingredients (Lagos Spice Hub #4)
  li(19, 'INGREDIENT', 'Egusi (Melon Seeds)', 180000, 4, PHOTOS.listing[17], { quantity: '500', unit: 'g' }),
  li(20, 'INGREDIENT', 'Yaji Suya Spice', 95000, 4, PHOTOS.listing[18], { quantity: '200', unit: 'g', compareAtMinor: 120000 }),
  li(21, 'INGREDIENT', 'Yam Tubers', 220000, 4, PHOTOS.listing[20], { quantity: '2', unit: 'tubers' }),
  li(22, 'INGREDIENT', 'Dried Crayfish', 130000, 4, PHOTOS.listing[21], { quantity: '250', unit: 'g' }),
  li(23, 'INGREDIENT', 'Palm Oil', 160000, 4, PHOTOS.listing[12], { quantity: '1', unit: 'L' }),
  li(24, 'INGREDIENT', 'Stockfish', 250000, 4, PHOTOS.listing[22], { quantity: '300', unit: 'g' }),
];

export const demoStories: Story[] = demoRecipes
  .filter((rec) => rec.story)
  .slice(0, 8)
  .map((rec, i) => ({
    id: i + 1,
    recipeId: rec.id,
    title:
      rec.id === 1
        ? 'The story of Jollof'
        : rec.id === 2
          ? 'Waakye at dawn'
          : `The story of ${rec.title}`,
    body: rec.story ?? '',
    imageUrl: rec.storyImageUrl ?? PHOTOS.story[i % PHOTOS.story.length],
    cuisine: rec.cuisine,
    countryName: rec.countryOfOrigin === 'GH' ? 'Ghana' : rec.countryOfOrigin === 'NG' ? 'Nigeria' : rec.countryOfOrigin,
    vendorName: rec.vendorName,
  }));

export const demoReviews: Review[] = [
  { id: 1, rating: 5, comment: 'Tastes exactly like my grandmother’s pot. The step timings are spot on.', userName: 'Kwame A.', userAvatarUrl: PHOTOS.avatar[2], createdAt: '2026-06-28T10:12:00Z' },
  { id: 2, rating: 4, comment: 'Lovely depth of flavour. I added extra ginger and it was perfect.', userName: 'Chiamaka O.', userAvatarUrl: PHOTOS.avatar[3], createdAt: '2026-06-25T18:40:00Z' },
  { id: 3, rating: 5, comment: 'The food story made me call my mum. Beautiful recipe.', userName: 'Yaw B.', userAvatarUrl: PHOTOS.avatar[4], createdAt: '2026-06-20T08:05:00Z' },
  { id: 4, rating: 4, comment: 'Great with the one-click basket — everything arrived fresh.', userName: 'Adaeze N.', userAvatarUrl: PHOTOS.avatar[5], createdAt: '2026-06-15T14:22:00Z' },
];

export const demoPlans: Plan[] = [
  {
    code: 'FREE',
    name: 'Free',
    amountMinorGHS: 0,
    amountMinorNGN: 0,
    interval: 'forever',
    features: ['Browse all recipes', 'Order meals & ingredients', 'Food passport stamps'],
  },
  {
    code: 'PREMIUM_MONTHLY',
    name: 'Premium Monthly',
    amountMinorGHS: 3000,
    amountMinorNGN: 150000,
    interval: 'monthly',
    features: [
      'Ask Dishaspora AI assistant',
      'Video & audio cook-along guides',
      'Chat directly with vendors',
      'Early access to new recipes',
    ],
  },
];

export const demoPassport: { stamps: PassportStamp[]; countriesStamped: number; totalCooked: number } = {
  countriesStamped: 2,
  totalCooked: 8,
  stamps: [
    { country: 'GH', countryName: 'Ghana', cuisine: 'Ghanaian', flagEmoji: 'GH', recipesCooked: 5, totalRecipes: 12, stamped: true, firstCookedAt: '2026-05-02T09:00:00Z' },
    { country: 'NG', countryName: 'Nigeria', cuisine: 'Nigerian', flagEmoji: 'NG', recipesCooked: 3, totalRecipes: 12, stamped: true, firstCookedAt: '2026-05-20T19:30:00Z' },
    { country: 'SN', countryName: 'Senegal', cuisine: 'Senegalese', flagEmoji: 'SN', recipesCooked: 0, totalRecipes: 6, stamped: false, firstCookedAt: null },
    { country: 'ET', countryName: 'Ethiopia', cuisine: 'Ethiopian', flagEmoji: 'ET', recipesCooked: 0, totalRecipes: 5, stamped: false, firstCookedAt: null },
    { country: 'MA', countryName: 'Morocco', cuisine: 'Moroccan', flagEmoji: 'MA', recipesCooked: 0, totalRecipes: 4, stamped: false, firstCookedAt: null },
    { country: 'KE', countryName: 'Kenya', cuisine: 'Kenyan', flagEmoji: 'KE', recipesCooked: 0, totalRecipes: 4, stamped: false, firstCookedAt: null },
  ],
};

export const demoOrders: Order[] = [
  {
    id: 101,
    reference: 'DSP-8F2K1',
    status: 'PREPARING',
    items: [
      { listingId: 1, title: 'Jollof Rice with Grilled Chicken', imageUrl: PHOTOS.listing[14], qty: 2, amountMinor: 4500 },
      { listingId: 4, title: 'Kelewele Night Pack', imageUrl: PHOTOS.listing[19], qty: 1, amountMinor: 1800 },
    ],
    subtotalMinor: 10800,
    feeMinor: 756,
    deliveryMinor: 300,
    totalMinor: 11856,
    currency: 'GHS',
    vendorId: 1,
    vendorName: "Auntie Ama's Kitchen",
    createdAt: '2026-07-03T09:14:00Z',
  },
  {
    id: 102,
    reference: 'DSP-3B7Q9',
    status: 'COMPLETED',
    items: [
      { listingId: 2, title: 'Waakye Special (Full Works)', imageUrl: PHOTOS.listing[16], qty: 1, amountMinor: 3800 },
    ],
    subtotalMinor: 3800,
    feeMinor: 266,
    deliveryMinor: 300,
    totalMinor: 4366,
    currency: 'GHS',
    vendorId: 5,
    vendorName: 'Chale Chop Bar',
    createdAt: '2026-07-01T07:45:00Z',
  },
  {
    id: 103,
    reference: 'DSP-9D4X2',
    status: 'COMPLETED',
    items: [
      { listingId: 11, title: 'Fresh Tomatoes', imageUrl: PHOTOS.listing[4], qty: 2, amountMinor: 900 },
      { listingId: 12, title: 'Onions', imageUrl: PHOTOS.listing[6], qty: 1, amountMinor: 700 },
      { listingId: 15, title: 'Red Palm Oil', imageUrl: PHOTOS.listing[12], qty: 1, amountMinor: 1600 },
    ],
    subtotalMinor: 4100,
    feeMinor: 287,
    deliveryMinor: 300,
    totalMinor: 4687,
    currency: 'GHS',
    vendorId: 3,
    vendorName: 'Makola Fresh Market',
    createdAt: '2026-06-27T16:20:00Z',
  },
];

export const demoThreads: ChatThread[] = [
  {
    id: 1,
    vendorId: 1,
    vendorName: "Auntie Ama's Kitchen",
    vendorLogoUrl: PHOTOS.vendor[0],
    lastMessage: 'Your jollof order is on the grill now! 20 minutes.',
    lastAt: '2026-07-03T09:40:00Z',
    unread: 1,
  },
  {
    id: 2,
    vendorId: 3,
    vendorName: 'Makola Fresh Market',
    vendorLogoUrl: PHOTOS.vendor[2],
    lastMessage: 'Fresh kontomire came in this morning if you want to add some.',
    lastAt: '2026-07-02T11:05:00Z',
    unread: 0,
  },
];

export const demoMessages: Record<number, ChatMessage[]> = {
  1: [
    { id: 1, threadId: 1, senderId: 1, senderName: 'Ama Mensah', mine: true, body: 'Hi! Is the party jollof available today?', createdAt: '2026-07-03T09:30:00Z' },
    { id: 2, threadId: 1, senderId: 90, senderName: "Auntie Ama's Kitchen", mine: false, body: 'Chale, always! Smoky as ever. How many packs?', createdAt: '2026-07-03T09:32:00Z' },
    { id: 3, threadId: 1, senderId: 1, senderName: 'Ama Mensah', mine: true, body: 'Two packs with extra shito please', createdAt: '2026-07-03T09:35:00Z' },
    { id: 4, threadId: 1, senderId: 90, senderName: "Auntie Ama's Kitchen", mine: false, body: 'Your jollof order is on the grill now! 20 minutes.', createdAt: '2026-07-03T09:40:00Z' },
  ],
  2: [
    { id: 5, threadId: 2, senderId: 1, senderName: 'Ama Mensah', mine: true, body: 'Do you have fresh garden eggs this week?', createdAt: '2026-07-02T10:58:00Z' },
    { id: 6, threadId: 2, senderId: 91, senderName: 'Makola Fresh Market', mine: false, body: 'Fresh kontomire came in this morning if you want to add some.', createdAt: '2026-07-02T11:05:00Z' },
  ],
};
