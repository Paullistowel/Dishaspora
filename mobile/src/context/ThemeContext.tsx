import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, type ColorSchemeName } from 'react-native';
import { darkColors, lightColors, type ThemeColors } from '../theme';

export type ThemeMode = 'system' | 'light' | 'dark';
const STORAGE_KEY = 'dishaspora.themeMode';

interface ThemeContextValue {
  /** The user's choice: follow system, or force light/dark. */
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  /** The resolved palette to render with. */
  colors: ThemeColors;
  /** True when the resolved scheme is dark (for StatusBar, images, etc.). */
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [systemScheme, setSystemScheme] = useState<ColorSchemeName>(Appearance.getColorScheme());

  // Load the saved preference once.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (v === 'light' || v === 'dark' || v === 'system') setModeState(v);
      })
      .catch(() => {});
  }, []);

  // Track OS appearance changes while in "system" mode.
  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => setSystemScheme(colorScheme));
    return () => sub.remove();
  }, []);

  const setMode = (next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  };

  const isDark = mode === 'system' ? systemScheme === 'dark' : mode === 'dark';

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, setMode, colors: isDark ? darkColors : lightColors, isDark }),
    [mode, isDark]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** Access the active palette + theme controls. Safe fallback = light if no provider. */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return { mode: 'light', setMode: () => {}, colors: lightColors, isDark: false };
  }
  return ctx;
}
