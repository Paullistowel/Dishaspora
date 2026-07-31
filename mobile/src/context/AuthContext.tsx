import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  api,
  setRefreshToken,
  setToken,
  setTokensRefreshedHandler,
  setUnauthorizedHandler,
} from '../api';
import {
  clearStoredTokens,
  getStoredRefreshToken,
  getStoredToken,
  setStoredRefreshToken,
  setStoredToken,
} from '../secureStore';
import { report } from '../logger';
import type { AuthResponse, Country, User } from '../types';

// Token now lives in the OS keychain (see secureStore). Only non-sensitive
// cached data stays in AsyncStorage.
const USER_KEY = 'dishaspora.user';
export const ONBOARDED_KEY = 'dishaspora.onboarded';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  onboarded: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (
    name: string,
    email: string,
    password: string,
    country: Country
  ) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
  updateUser: (user: User) => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [onboarded, setOnboarded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [storedToken, storedRefresh, storedUser, storedOnboarded] = await Promise.all([
          getStoredToken(), // keychain (migrates legacy plaintext token)
          getStoredRefreshToken(),
          AsyncStorage.getItem(USER_KEY),
          AsyncStorage.getItem(ONBOARDED_KEY),
        ]);
        setOnboarded(storedOnboarded === '1');
        if (storedToken && storedUser) {
          let parsedUser: User | null = null;
          try {
            parsedUser = JSON.parse(storedUser);
          } catch {
            // Corrupt stored user — drop the session and start logged-out.
            await clearStoredTokens();
            await AsyncStorage.removeItem(USER_KEY);
          }
          if (!parsedUser) return;
          setToken(storedToken);
          setRefreshToken(storedRefresh);
          setTokenState(storedToken);
          setUser(parsedUser);
          // refresh user in background (token may be stale)
          api
            .get<User>('/users/me')
            .then(async (fresh) => {
              setUser(fresh);
              await AsyncStorage.setItem(USER_KEY, JSON.stringify(fresh));
            })
            .catch((e) => {
              if (e?.status === 401) {
                setToken(null);
                setTokenState(null);
                setUser(null);
                clearStoredTokens().catch(() => {});
                AsyncStorage.removeItem(USER_KEY).catch(() => {});
              }
            });
        }
      } catch (e) {
        report(e, { where: 'AuthContext.bootstrap' });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = useCallback(async (auth: AuthResponse) => {
    setToken(auth.token);
    setRefreshToken(auth.refreshToken ?? null);
    setTokenState(auth.token);
    setUser(auth.user);
    await Promise.all([
      setStoredToken(auth.token),
      auth.refreshToken ? setStoredRefreshToken(auth.refreshToken) : Promise.resolve(),
      AsyncStorage.setItem(USER_KEY, JSON.stringify(auth.user)),
    ]);
  }, []);

  // Persist silently-rotated tokens (from the api layer's 401 auto-refresh) back
  // into secure storage and keep our token state in sync.
  useEffect(() => {
    setTokensRefreshedHandler((token, refresh) => {
      setTokenState(token);
      setStoredToken(token).catch(() => {});
      setStoredRefreshToken(refresh).catch(() => {});
    });
    return () => setTokensRefreshedHandler(null);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const auth = await api.post<AuthResponse>('/auth/login', { email, password });
      await persist(auth);
      return auth.user;
    },
    [persist]
  );

  const register = useCallback(
    async (name: string, email: string, password: string, country: Country) => {
      const auth = await api.post<AuthResponse>('/auth/register', {
        name,
        email,
        password,
        country,
      });
      await persist(auth);
      return auth.user;
    },
    [persist]
  );

  const logout = useCallback(async () => {
    // Best-effort server-side revocation of the refresh token before we drop it.
    const refresh = await getStoredRefreshToken().catch(() => null);
    if (refresh) {
      api.post('/auth/logout', { refreshToken: refresh }).catch(() => {});
    }
    setToken(null);
    setRefreshToken(null);
    setTokenState(null);
    setUser(null);
    // Drop every cached query so the next account starts clean (no data leak).
    queryClient.clear();
    await Promise.all([clearStoredTokens(), AsyncStorage.removeItem(USER_KEY)]);
  }, [queryClient]);

  // Register a global session-expiry handler: any authenticated request that
  // returns 401 (token expired/revoked, account deleted) logs the user out. The
  // launch gate then redirects to sign-in on the next render.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
    });
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  const refreshUser = useCallback(async () => {
    try {
      const fresh = await api.get<User>('/users/me');
      setUser(fresh);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(fresh));
      return fresh;
    } catch {
      return null;
    }
  }, []);

  const updateUser = useCallback(async (u: User) => {
    setUser(u);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(u));
  }, []);

  const completeOnboarding = useCallback(async () => {
    setOnboarded(true);
    await AsyncStorage.setItem(ONBOARDED_KEY, '1');
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      onboarded,
      login,
      register,
      logout,
      refreshUser,
      updateUser,
      completeOnboarding,
    }),
    [user, token, loading, onboarded, login, register, logout, refreshUser, updateUser, completeOnboarding]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
