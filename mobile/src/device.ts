// Device & app metadata helpers.
//
// Used by the feedback flow (attached automatically to submissions so bugs can be
// triaged) and the About screen (version/build display). Dependency-light wrappers
// around expo-device / expo-application / expo-constants so call sites stay tidy.

import * as Application from 'expo-application';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

/** Human-readable app version, e.g. "1.0.0". */
export function appVersion(): string {
  return Application.nativeApplicationVersion ?? Constants.expoConfig?.version ?? 'unknown';
}

/** Native build number / version code, e.g. "1". */
export function buildNumber(): string {
  return Application.nativeBuildVersion ?? 'dev';
}

/** Short OS + model summary, e.g. "iOS 18.2 · iPhone 15". */
export function deviceSummary(): string {
  const os = `${Platform.OS === 'ios' ? 'iOS' : 'Android'} ${Device.osVersion ?? ''}`.trim();
  const model = Device.modelName ?? 'Unknown device';
  return `${os} · ${model}`;
}

/**
 * Compact metadata string attached to feedback for triage. Kept under the
 * backend's 500-char cap.
 */
export function feedbackDeviceInfo(): string {
  return `${deviceSummary()} · app ${appVersion()} (${buildNumber()})`.slice(0, 500);
}
