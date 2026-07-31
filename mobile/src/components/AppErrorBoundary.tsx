import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { report } from '@/logger';
import { colors, radius, spacing, type } from '@/theme';
import PrimaryButton from './PrimaryButton';

interface Props {
  children: React.ReactNode;
}
interface State {
  error: Error | null;
}

/**
 * App-wide error boundary. Catches render/lifecycle crashes anywhere in the tree
 * so a single broken screen shows a recoverable fallback instead of a white
 * screen. Every crash is funneled to the logger for reporting. "Try again"
 * remounts the subtree by resetting state — enough to recover from transient
 * render errors without a full reload.
 */
export default class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    report(error, { componentStack: info.componentStack });
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <View style={styles.wrap}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>!</Text>
          </View>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.sub}>
            The app hit an unexpected error. You can try again — if it keeps
            happening, please restart the app.
          </Text>
          {__DEV__ && (
            <Text style={styles.debug} numberOfLines={6}>
              {this.state.error.message}
            </Text>
          )}
          <View style={styles.btn}>
            <PrimaryButton title="Try again" onPress={this.reset} />
          </View>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    backgroundColor: colors.background,
  },
  badge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  badgeText: { fontSize: 28, fontWeight: type.weight.heavy, color: colors.accentDark },
  title: {
    fontSize: type.size.xl,
    fontWeight: type.weight.heavy,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  sub: {
    fontSize: type.size.md,
    color: colors.inkSoft,
    textAlign: 'center',
    lineHeight: type.line.md,
    maxWidth: 320,
  },
  debug: {
    marginTop: spacing.lg,
    fontSize: type.size.xs,
    color: colors.danger,
    fontFamily: 'monospace',
    backgroundColor: colors.surfaceAlt,
    padding: spacing.md,
    borderRadius: radius.sm,
    maxWidth: 340,
  },
  btn: { marginTop: spacing.xxl, alignSelf: 'stretch', maxWidth: 320 },
});
