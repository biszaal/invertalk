import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { Txt } from './Txt';
import { useTheme } from './theme';

type Props = {
  /** Small mono label above the title, e.g. "Player 1". */
  eyebrow?: string;
  title?: string;
  children: ReactNode;
  /** Pinned to the bottom (primary actions); scrolls with the page on small screens. */
  footer?: ReactNode;
  /** Screens without a navigation header need the top edge too. */
  edges?: Edge[];
};

/** Scrolling page so the largest Dynamic Type sizes never clip. */
export function Screen({ eyebrow, title, children, footer, edges = ['bottom', 'left', 'right'] }: Props) {
  const t = useTheme();
  return (
    <SafeAreaView edges={edges} style={[styles.safe, { backgroundColor: t.background }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {eyebrow || title ? (
          <View style={styles.head}>
            {eyebrow ? <Txt variant="eyebrow">{eyebrow}</Txt> : null}
            {title ? (
              <Txt variant="title" accessibilityRole="header">
                {title}
              </Txt>
            ) : null}
          </View>
        ) : null}
        {children}
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 20, gap: 18, flexGrow: 1 },
  head: { gap: 8 },
  footer: { marginTop: 'auto', gap: 10, paddingTop: 8 },
});
