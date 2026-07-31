// Shared client-side validation. Mirrors the backend's Bean Validation rules so
// users get instant, friendly feedback before a round-trip. The backend remains
// the source of truth — this is UX, not security.
//
// Previously the password regex was copy-pasted in register / reset-password /
// settings; it now lives here once.

/** Backend PASSWORD_REGEX: 8–100 chars, at least one upper, lower and digit. */
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,100}$/;

// Pragmatic email shape check (not RFC-complete — the backend @Email is authoritative).
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

export function meetsPasswordPolicy(password: string): boolean {
  return PASSWORD_REGEX.test(password);
}

export type StrengthLevel = 0 | 1 | 2 | 3 | 4;

export interface PasswordStrength {
  /** 0 = empty, 1 = weak … 4 = strong. */
  score: StrengthLevel;
  label: string;
  /** True once the minimum policy (length + mixed case + digit) is satisfied. */
  meetsPolicy: boolean;
  /** Human-readable list of what's still missing, for hints. */
  missing: string[];
}

/**
 * Estimate password strength for the meter. Combines policy checks with length
 * and character-variety bonuses. Deterministic and dependency-free.
 */
export function evaluatePassword(password: string): PasswordStrength {
  if (!password) {
    return { score: 0, label: '', meetsPolicy: false, missing: [] };
  }

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  const longEnough = password.length >= 8;
  const veryLong = password.length >= 12;

  const missing: string[] = [];
  if (!longEnough) missing.push('at least 8 characters');
  if (!hasUpper) missing.push('an uppercase letter');
  if (!hasLower) missing.push('a lowercase letter');
  if (!hasDigit) missing.push('a number');

  const meetsPolicy = hasLower && hasUpper && hasDigit && longEnough;

  // Score: variety + length. Cap at 4.
  let raw = 0;
  if (hasLower) raw++;
  if (hasUpper) raw++;
  if (hasDigit) raw++;
  if (hasSymbol) raw++;
  if (veryLong) raw++;
  if (!longEnough) raw = Math.min(raw, 1); // too short can never be "strong"

  const score = Math.max(1, Math.min(4, raw)) as StrengthLevel;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

  return { score, label: labels[score], meetsPolicy, missing };
}
