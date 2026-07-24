// Runtime configuration.
//
// Both values can be overridden with Expo public env vars (create `mobile/.env`,
// see `.env.example`). They are inlined at build time by Expo — no restart-safe
// secrets here, these are client-visible by design.
//
// API_URL — backend base URL:
//   - Android emulator: 10.0.2.2 maps to the host PC's localhost (default below).
//   - Physical device via Expo Go: set EXPO_PUBLIC_API_URL to your PC's LAN IP,
//     e.g. "http://192.168.1.23:8080".
//   - Live backend: set EXPO_PUBLIC_API_URL to your deployed URL,
//     e.g. "https://dishaspora-backend.up.railway.app".
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:8080';

// DEMO_MODE — when true the app runs fully offline against local demo data
// (src/demo) so every screen is inspectable with zero backend. Set
// EXPO_PUBLIC_DEMO_MODE=false to hit the real backend. Defaults to true so the
// out-of-box Expo Go experience still works without a server.
export const DEMO_MODE = (process.env.EXPO_PUBLIC_DEMO_MODE ?? 'true') !== 'false';

/** Prefix relative /images or /uploads paths served by the backend with API_URL. */
export function IMG(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('/images') || url.startsWith('/uploads') || url.startsWith('/')) {
    return API_URL + url;
  }
  return url;
}
