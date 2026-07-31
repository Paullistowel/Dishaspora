export const colors = {
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
};

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
