// Central logging + error reporting shim.
//
// Every caught error in the app should flow through here rather than a bare
// `console.error`, so that wiring a real crash-reporting backend (Sentry,
// Bugsnag, Crashlytics) later is a one-file change — swap the body of
// `report()` and every call site is already instrumented.
//
// In __DEV__ we log to the console; in production we currently swallow to avoid
// noisy user-visible logs, but still funnel through `report()` so a reporter can
// be attached. Keep this dependency-free so it can be imported anywhere.

type Extra = Record<string, unknown>;

let reporter: ((error: unknown, context?: Extra) => void) | null = null;

/**
 * Attach a crash-reporting sink (e.g. Sentry.captureException). Call once at
 * app start. Passing null detaches it.
 */
export function setErrorReporter(fn: ((error: unknown, context?: Extra) => void) | null) {
  reporter = fn;
}

/** Report a handled error with optional structured context. Never throws. */
export function report(error: unknown, context?: Extra): void {
  try {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('[report]', error, context ?? '');
    }
    reporter?.(error, context);
  } catch {
    // A logger must never crash the app.
  }
}

/** Dev-only breadcrumb. No-op in production. */
export function log(...args: unknown[]): void {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log('[log]', ...args);
  }
}

/** Dev-only warning. No-op in production. */
export function warn(...args: unknown[]): void {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.warn('[warn]', ...args);
  }
}

export const logger = { report, log, warn, setErrorReporter };
