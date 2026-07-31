// Secure storage for the auth token.
//
// The JWT is a bearer credential — anyone who reads it can impersonate the user
// until it expires. It therefore belongs in the OS keychain / keystore via
// `expo-secure-store`, NOT in AsyncStorage (plaintext, readable on a rooted or
// backed-up device).
//
// SecureStore caps values at ~2KB and is unavailable on web, so this module is
// scoped to the small, sensitive token only. Non-sensitive cached data (the user
// profile, onboarding flag) stays in AsyncStorage — see AuthContext.
//
// Includes a one-time migration: existing installs have the token in AsyncStorage
// under the legacy key; on first read we move it into SecureStore and delete the
// plaintext copy.

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { warn } from './logger';

const TOKEN_KEY = 'dishaspora.token';
const REFRESH_KEY = 'dishaspora.refreshToken';
const LEGACY_TOKEN_KEY = 'dishaspora.token'; // was AsyncStorage

// SecureStore throws on web; fall back to AsyncStorage there (dev/web preview only).
const secureAvailable = Platform.OS !== 'web';

async function secureGet(key: string): Promise<string | null> {
  try {
    if (secureAvailable) return await SecureStore.getItemAsync(key);
    return await AsyncStorage.getItem(key);
  } catch (e) {
    warn('secureGet failed', key, e);
    return null;
  }
}

async function secureSet(key: string, value: string): Promise<void> {
  try {
    if (secureAvailable) await SecureStore.setItemAsync(key, value);
    else await AsyncStorage.setItem(key, value);
  } catch (e) {
    warn('secureSet failed', key, e);
  }
}

async function secureDelete(key: string): Promise<void> {
  try {
    if (secureAvailable) await SecureStore.deleteItemAsync(key);
    else await AsyncStorage.removeItem(key);
  } catch (e) {
    warn('secureDelete failed', key, e);
  }
}

/**
 * Read the access token, migrating a legacy AsyncStorage token into SecureStore
 * on first run after upgrade.
 */
export async function getStoredToken(): Promise<string | null> {
  const secure = await secureGet(TOKEN_KEY);
  if (secure) return secure;
  // Migration path: token still in plaintext AsyncStorage from a pre-SecureStore build.
  if (secureAvailable) {
    const legacy = await AsyncStorage.getItem(LEGACY_TOKEN_KEY);
    if (legacy) {
      await secureSet(TOKEN_KEY, legacy);
      await AsyncStorage.removeItem(LEGACY_TOKEN_KEY);
      return legacy;
    }
  }
  return null;
}

export function setStoredToken(token: string): Promise<void> {
  return secureSet(TOKEN_KEY, token);
}

export function getStoredRefreshToken(): Promise<string | null> {
  return secureGet(REFRESH_KEY);
}

export function setStoredRefreshToken(token: string): Promise<void> {
  return secureSet(REFRESH_KEY, token);
}

/** Wipe all credentials (logout / session death). */
export async function clearStoredTokens(): Promise<void> {
  await Promise.all([secureDelete(TOKEN_KEY), secureDelete(REFRESH_KEY)]);
  // Belt-and-suspenders: also clear any lingering legacy plaintext token.
  await AsyncStorage.removeItem(LEGACY_TOKEN_KEY).catch(() => {});
}
