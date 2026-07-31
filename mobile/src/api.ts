import { API_URL, DEMO_MODE } from './config';
import { demoResolve, demoUpload } from './demo/demoApi';

export class ApiError extends Error {
  status: number;
  timestamp?: string;
  constructor(status: number, message: string, timestamp?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.timestamp = timestamp;
  }
  /** True when the backend answered 402 PAYMENT_REQUIRED (premium feature). */
  get premiumRequired(): boolean {
    return this.status === 402;
  }
}

let authToken: string | null = null;
let refreshToken: string | null = null;

export function setToken(token: string | null) {
  authToken = token;
}

export function setRefreshToken(token: string | null) {
  refreshToken = token;
}

export function getToken(): string | null {
  return authToken;
}

// Session-expiry hook: when an authenticated request comes back 401 AND the token
// cannot be silently refreshed, the session is dead (refresh expired/revoked, or
// the account was deleted). AuthContext registers a handler here to log the user
// out and bounce them to sign-in.
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: (() => void) | null) {
  onUnauthorized = fn;
}

// When the access token is silently refreshed, AuthContext persists the rotated
// pair to secure storage and updates its state.
let onTokensRefreshed: ((token: string, refreshToken: string) => void) | null = null;
export function setTokensRefreshedHandler(
  fn: ((token: string, refreshToken: string) => void) | null
) {
  onTokensRefreshed = fn;
}

// Single-flight refresh: many requests can 401 at once when the access token
// expires; they all await one in-flight refresh rather than stampeding the
// endpoint. Resolves true if a fresh access token is now in place.
let refreshInFlight: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (!refreshToken) return false;
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) return false;
        const json = await res.json();
        if (!json?.token || !json?.refreshToken) return false;
        authToken = json.token;
        refreshToken = json.refreshToken;
        onTokensRefreshed?.(json.token, json.refreshToken);
        return true;
      } catch {
        return false;
      }
    })().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

type Query = Record<string, string | number | boolean | null | undefined>;

function qs(params?: Query): string {
  if (!params) return '';
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== ''
  );
  if (entries.length === 0) return '';
  return (
    '?' +
    entries
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&')
  );
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  params?: Query,
  isRetry = false
): Promise<T> {
  if (DEMO_MODE) {
    return demoResolve<T>(method, path, body, params);
  }
  const headers: Record<string, string> = { Accept: 'application/json' };
  const hadToken = !!authToken;
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    payload = body;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let res: Response;
  // Abort requests that hang so the UI never waits forever (uploads get longer).
  const controller = new AbortController();
  const timeoutMs = body instanceof FormData ? 30000 : 15000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    res = await fetch(`${API_URL}/api${path}${qs(params)}`, {
      method,
      headers,
      body: payload,
      signal: controller.signal,
    });
  } catch (e) {
    // Backend unreachable or timed out. Surface a real error so the UI can show a
    // toast and offer a retry — never silently substitute demo data in a live build
    // (that hides outages and makes the app look like it's working when it isn't).
    const aborted = e instanceof Error && e.name === 'AbortError';
    throw new ApiError(
      0,
      aborted
        ? 'The request timed out. Check your connection and try again.'
        : 'Could not reach the server. Check your connection and try again.'
    );
  } finally {
    clearTimeout(timer);
  }

  // A 401 on a request we sent WITH a token means the access token expired or was
  // revoked. Try a one-time silent refresh, then replay the original request. Only
  // if refresh fails do we treat the session as dead. (Login/register carry no
  // token, so their "invalid credentials" 401s skip this entirely. FormData bodies
  // aren't replayed — an upload that 401s just surfaces after a refresh attempt.)
  if (res.status === 401 && hadToken && !isRetry) {
    const refreshed = await tryRefresh();
    if (refreshed && !(body instanceof FormData)) {
      return request<T>(method, path, body, params, true);
    }
    if (!refreshed) onUnauthorized?.();
  }

  const text = await res.text();
  let json: any = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }

  if (!res.ok) {
    const message =
      (json && (json.message || json.error)) || `Request failed (${res.status})`;
    throw new ApiError(res.status, message, json?.timestamp);
  }
  return json as T;
}

export const api = {
  get: <T>(path: string, params?: Query) => request<T>('GET', path, undefined, params),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  del: <T>(path: string, body?: unknown) => request<T>('DELETE', path, body),
  /** POST /media multipart upload. `file` = { uri, name, mimeType }. Returns { url }. */
  upload: async (file: { uri: string; name: string; mimeType: string }) => {
    if (DEMO_MODE) return demoUpload(file);
    const form = new FormData();
    form.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.mimeType,
    } as any);
    return request<{ url: string }>('POST', '/media', form);
  },
  /**
   * POST /snap/analyze — Snap & Cook food recognition. Always hits the real
   * backend (no demo data, no silent fallback) so genuine errors surface and the
   * UI can offer a retry. Throws {@link ApiError} on any non-2xx or network error.
   */
  snap: <T>(file: { uri: string; name: string; mimeType: string }) =>
    snapUpload<T>('/snap/analyze', file),
  /** POST /snap/ingredients — detect ingredients in a photo → recipe recommendations. */
  snapIngredients: <T>(file: { uri: string; name: string; mimeType: string }) =>
    snapUpload<T>('/snap/ingredients', file),
};

/** Shared multipart uploader for Snap endpoints — always the real backend, no demo fallback. */
async function snapUpload<T>(
  path: string,
  file: { uri: string; name: string; mimeType: string }
): Promise<T> {
  const form = new FormData();
  form.append('image', { uri: file.uri, name: file.name, type: file.mimeType } as any);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api${path}`, { method: 'POST', headers, body: form });
  } catch {
    throw new ApiError(0, 'Could not reach the server. Check your connection and try again.');
  }
  const text = await res.text();
  let json: any = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }
  if (!res.ok) {
    const message = (json && (json.message || json.error)) || `Request failed (${res.status})`;
    throw new ApiError(res.status, message, json?.timestamp);
  }
  return json as T;
}
