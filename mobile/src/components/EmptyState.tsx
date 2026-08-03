import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { type ThemeColors } from '../theme';
import { useTheme } from '../context/ThemeContext';
import PrimaryButton from './PrimaryButton';

const IMAGES = {
  1: require('../../assets/images/empty-1.png'),
  2: require('../../assets/images/empty-2.png'),
  3: require('../../assets/images/empty-3.png'),
};

/** Centered illustration + gray one-liner + optional orange CTA pill (ref pattern #12). */
export default function EmptyState({
  message,
  actionLabel,
  onAction,
  image = 1,
  style,
}: {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  image?: 1 | 2 | 3;
  style?: ViewStyle;
}) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={[styles.wrap, style]}>
      <Image source={IMAGES[image]} style={styles.image} contentFit="contain" />
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? (
        <PrimaryButton title={actionLabel} onPress={onAction} style={styles.cta} />
      ) : null}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 32 },
  image: { width: 160, height: 160, marginBottom: 16 },
  message: {
    fontSize: 14,
    color: colors.inkSoft,
    textAlign: 'center',
    lineHeight: 21,
  },
  cta: { marginTop: 20, alignSelf: 'stretch' },
});
