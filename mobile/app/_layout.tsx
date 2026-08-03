import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { ToastProvider } from '@/context/ToastContext';
import { NetworkProvider } from '@/context/NetworkContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { I18nProvider } from '@/context/I18nContext';
import AnimatedSplash from '@/components/AnimatedSplash';
import AppErrorBoundary from '@/components/AppErrorBoundary';
import OfflineBanner from '@/components/OfflineBanner';
import { addNotificationResponseListener } from '@/pushNotifications';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // One automatic retry, then surface the error to the UI. Don't retry a
      // request that failed because we're offline — onlineManager will resume it.
      retry: 1,
      staleTime: 30_000,
      gcTime: 5 * 60_000,
    },
    mutations: { retry: 0 },
  },
});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppErrorBoundary>
          <ThemeProvider>
            <I18nProvider>
              <QueryClientProvider client={queryClient}>
                <NetworkProvider>
                  <AuthProvider>
                    <CartProvider>
                      <ToastProvider>
                        <ThemedRoot />
                      </ToastProvider>
                    </CartProvider>
                  </AuthProvider>
                </NetworkProvider>
              </QueryClientProvider>
            </I18nProvider>
          </ThemeProvider>
        </AppErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/** Inner root that consumes the theme so the shell reacts to light/dark. */
function ThemedRoot() {
  const [splashDone, setSplashDone] = useState(false);
  const router = useRouter();
  const { colors, isDark } = useTheme();

  // Navigate to a notification's deep link when the user taps it (foreground,
  // background, or cold start). Harmless in Expo Go where only local notifs fire.
  useEffect(() => {
    return addNotificationResponseListener((deepLink) => {
      router.push(deepLink as never);
    });
  }, [router]);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="assistant" options={{ presentation: 'modal' }} />
        <Stack.Screen name="pay" options={{ presentation: 'modal', gestureEnabled: false }} />
      </Stack>
      {/* Global connectivity banner — sits above all screens. */}
      <OfflineBanner />
      {/* Animated splash overlay — plays on cold start, then fades to reveal the app. */}
      {!splashDone && <AnimatedSplash onFinish={() => setSplashDone(true)} />}
    </>
  );
}
