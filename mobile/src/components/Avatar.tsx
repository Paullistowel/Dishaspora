import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { IMG } from '../config';
import { colors } from '../theme';

// A small palette of pleasant, on-brand tints for initials avatars.
const AVATAR_TINTS: { bg: string; fg: string }[] = [
  { bg: '#D9FCFE', fg: '#0FB8C4' }, // brand
  { bg: '#E3F7FF', fg: '#0E9FD8' }, // blue
  { bg: '#FFF1E0', fg: '#F27F0C' }, // accent
  { bg: '#E4F7EC', fg: '#2FBF71' }, // success
  { bg: '#F1E9FF', fg: '#7C5CFC' }, // violet
  { bg: '#FFE8EC', fg: '#E5484D' }, // rose
];

/** Up to two initials from a name ("Ama Mensah" → "AM", "Kofi" → "K"). */
function initialsOf(name?: string): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/** Deterministic tint so a given name always gets the same colour. */
function tintFor(name?: string) {
  const s = name ?? '';
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return AVATAR_TINTS[h % AVATAR_TINTS.length];
}

export default function Avatar({
  url,
  name,
  size = 40,
  square,
}: {
  url?: string | null;
  name?: string;
  size?: number;
  square?: boolean;
}) {
  const borderRadius = square ? size * 0.28 : size / 2;
  const src = IMG(url);
  if (src) {
    return (
      <Image
        source={{ uri: src }}
        style={{ width: size, height: size, borderRadius, backgroundColor: colors.surfaceAlt }}
        contentFit="cover"
      />
    );
  }
  const initials = initialsOf(name);
  const tint = tintFor(name);
  return (
    <View style={[styles.fallback, { width: size, height: size, borderRadius, backgroundColor: tint.bg }]}>
      <Text style={[styles.initial, { fontSize: size * (initials.length > 1 ? 0.38 : 0.44), color: tint.fg }]}>
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center' },
  initial: { fontWeight: '800', letterSpacing: 0.5 },
});
