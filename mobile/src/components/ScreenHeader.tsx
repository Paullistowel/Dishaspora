import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../theme';
import CircleButton from './CircleButton';

/** Standard sub-screen header: floating back circle + centered title. */
export default function ScreenHeader({
  title,
  right,
  onBack,
}: {
  title: string;
  right?: React.ReactNode;
  /** Override the back action (e.g. to confirm before leaving a payment). */
  onBack?: () => void;
}) {
  const router = useRouter();
  return (
    <View style={styles.row}>
      <CircleButton
        icon="chevron-back"
        onPress={onBack ?? (() => router.back())}
        accessibilityLabel="Go back"
      />
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.right}>{right ?? <View style={{ width: 42 }} />}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: colors.ink,
    marginHorizontal: 8,
  },
  right: { minWidth: 42, alignItems: 'flex-end' },
});
