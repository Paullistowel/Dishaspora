import { Ionicons } from '@expo/vector-icons';
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInUp,
  FadeOutUp,
  LinearTransition,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, shadowStrong } from '../theme';

export type ToastKind = 'success' | 'error' | 'info';

interface ToastAction {
  label: string;
  onPress: () => void;
}

interface ToastOptions {
  /** Optional inline action button, e.g. Undo. Extends the visible duration. */
  action?: ToastAction;
  /** Override the auto-dismiss delay (ms). */
  durationMs?: number;
}

interface ToastItem {
  id: number;
  message: string;
  kind: ToastKind;
  action?: ToastAction;
}

interface ToastContextValue {
  show: (message: string, kind?: ToastKind, options?: ToastOptions) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const CONFIG: Record<ToastKind, { icon: keyof typeof Ionicons.glyphMap; tint: string }> = {
  success: { icon: 'checkmark-circle', tint: colors.success },
  error: { icon: 'alert-circle', tint: colors.danger },
  info: { icon: 'information-circle', tint: colors.blueDark },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message: string, kind: ToastKind = 'info', options?: ToastOptions) => {
      const id = nextId.current++;
      setToasts((prev) => [...prev.slice(-2), { id, message, kind, action: options?.action }]);
      // Errors and actionable toasts linger longer so they can be read/acted on.
      const duration =
        options?.durationMs ?? (options?.action ? 5000 : kind === 'error' ? 4200 : 2800);
      setTimeout(() => dismiss(id), duration);
    },
    [dismiss]
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      show,
      success: (m) => show(m, 'success'),
      error: (m) => show(m, 'error'),
      info: (m) => show(m, 'info'),
    }),
    [show]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <View pointerEvents="box-none" style={[styles.host, { top: insets.top + 8 }]}>
        {toasts.map((t) => {
          const cfg = CONFIG[t.kind];
          return (
            <Animated.View
              key={t.id}
              entering={FadeInUp.springify().damping(18)}
              exiting={FadeOutUp.duration(200)}
              layout={LinearTransition.springify()}
              style={styles.toast}
              accessibilityLiveRegion="polite"
              accessibilityRole="alert"
            >
              <Ionicons name={cfg.icon} size={20} color={cfg.tint} />
              <Text style={styles.message} numberOfLines={3}>
                {t.message}
              </Text>
              {t.action ? (
                <Text
                  style={styles.action}
                  accessibilityRole="button"
                  accessibilityLabel={t.action.label}
                  onPress={() => {
                    t.action?.onPress();
                    dismiss(t.id);
                  }}
                >
                  {t.action.label}
                </Text>
              ) : null}
            </Animated.View>
          );
        })}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 1000,
    gap: 8,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.surfaceAlt,
    ...shadowStrong,
  },
  message: { flex: 1, color: colors.ink, fontSize: 14, fontWeight: '600' },
  action: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: '800',
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
});
