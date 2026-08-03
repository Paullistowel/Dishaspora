// Light + dark palettes share the SAME keys so any screen can switch just by
// reading `colors` from `useTheme()` instead of the static import below. Brand /
// accent / semantic hues stay constant across themes; only surfaces + ink flip.
export const lightColors = {
  background: '#FFFFFF',
  surface: '#F6F8F9',
  surfaceAlt: '#EFF3F5',
  brand: '#27EBF5',
  brandDark: '#0FB8C4',
  brandLight: '#D9FCFE',
  blue: '#33CFFF',
  blueDark: '#0E9FD8',
  blueLight: '#E3F7FF',
  accent: '#FF9F43',
  accentDark: '#F27F0C',
  accentLight: '#FFF1E0',
  ink: '#17252A',
  inkSoft: '#5C6B73',
  inkFaint: '#9AA7AE',
  danger: '#E5484D',
  success: '#2FBF71',
  star: '#FFC120',
  /** Card background — white in light, an elevated surface in dark. */
  card: '#FFFFFF',
};

export const darkColors: typeof lightColors = {
  background: '#0F1720',
  surface: '#1B2733',
  surfaceAlt: '#243140',
  brand: '#27EBF5',
  brandDark: '#5BF2FA',
  brandLight: '#123038',
  blue: '#33CFFF',
  blueDark: '#7FDcFF',
  blueLight: '#12303C',
  accent: '#FF9F43',
  accentDark: '#FFB871',
  accentLight: '#3A2A15',
  ink: '#E8EEF2',
  inkSoft: '#9FB0BC',
  inkFaint: '#6B7B87',
  danger: '#FF6369',
  success: '#4ECB84',
  star: '#FFC120',
  card: '#1B2733',
};

export type ThemeColors = typeof lightColors;

/**
 * Static light palette. Kept as the default export for screens not yet migrated
 * to the dynamic theme (they render light). Migrated screens read the active
 * palette from {@link useTheme}. New/edited screens should prefer useTheme().
 */
export const colors = lightColors;

export const radius = { sm: 12, md: 16, lg: 20, xl: 28, pill: 999 };

/**
 * Spacing scale (4-pt grid). Prefer these over magic numbers so vertical rhythm
 * stays consistent across screens. e.g. `padding: spacing.lg`.
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

/**
 * Typography scale. `size` = font size, `line` = recommended lineHeight.
 * Weights are the string literals React Native expects.
 */
export const type = {
  weight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    heavy: '800',
  },
  size: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    display: 30,
  },
  line: {
    xs: 16,
    sm: 18,
    md: 22,
    lg: 24,
    xl: 28,
    xxl: 32,
    display: 38,
  },
} as const;

export const shadow = {
  shadowColor: '#17252A',
  shadowOpacity: 0.06,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
} as const;

export const shadowStrong = {
  shadowColor: '#17252A',
  shadowOpacity: 0.12,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 6 },
  elevation: 6,
} as const;
