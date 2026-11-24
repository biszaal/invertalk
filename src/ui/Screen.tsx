import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useTheme } from './theme';

type Props = {
  title?: string;
  children: ReactNode;
  /** Screens without a navigation header need the top edge too. */
  edges?: Edge[];
};

/** Scrolling page so the largest Dynamic Type sizes never clip. */
export function Screen({ title, children, edges = ['bottom', 'left', 'right'] }: Props) {
  const t = useTheme();
  return (
    <SafeAreaView edges={edges} style={[styles.safe, { backgroundColor: t.background }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {title ? (
          <Text accessibilityRole="header" style={[styles.title, { color: t.text }]}>
            {title}
          </Text>
        ) : null}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, gap: 16, flexGrow: 1 },
  title: { fontSize: 28, fontWeight: '700' },
});
