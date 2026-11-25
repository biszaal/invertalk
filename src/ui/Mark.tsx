import { StyleSheet, View } from 'react-native';

import { Txt } from './Txt';
import { fonts, useTheme } from './theme';

/**
 * One player: a lowercase i (a dot over a rounded stem), or upside down as ¡.
 * Same geometry as docs/brand: a 20 × 72 unit box, 20-unit dot, 6-unit gap,
 * 20 × 46 stem; scaled to `height`.
 */
export function Figure({ height, color, inverted = false }: { height: number; color: string; inverted?: boolean }) {
  const u = height / 72;
  const dot = { width: 20 * u, height: 20 * u, borderRadius: 10 * u, backgroundColor: color };
  const stem = { width: 20 * u, height: 46 * u, borderRadius: 10 * u, backgroundColor: color };
  return (
    <View style={{ width: 20 * u, height }} aria-hidden>
      <View style={[styles.abs, dot, { top: inverted ? 52 * u : 0 }]} />
      <View style={[styles.abs, stem, { top: inverted ? 0 : 26 * u }]} />
    </View>
  );
}

/** The Invertalk mark: i and ¡ side by side, the two players. */
export function Mark({ size, onDark = false }: { size: number; onDark?: boolean }) {
  const t = useTheme();
  const first = onDark ? t.onStage : t.text;
  const figureHeight = size * 0.72;
  return (
    <View style={[styles.row, { width: size, height: size, gap: size * 0.08 }]} aria-hidden>
      <Figure height={figureHeight} color={first} />
      <Figure height={figureHeight} color={t.accent} inverted />
    </View>
  );
}

export function Wordmark({ size = 20 }: { size?: number }) {
  return (
    <View style={styles.wordmark} accessible accessibilityRole="header" accessibilityLabel="Invertalk">
      <Mark size={size * 1.3} />
      <Txt style={{ fontFamily: fonts.black, fontSize: size, lineHeight: size * 1.2, letterSpacing: -size * 0.045 }}>
        invertalk
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  wordmark: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
