import { StyleSheet, View } from 'react-native';

type Props = {
  /** 0–1 per bar; null draws a quiet placeholder while the waveform loads. */
  peaks: number[] | null;
  count: number;
  height: number;
  /** Share of bars (from the left) drawn in `played`. */
  progress?: number;
  played: string;
  idle: string;
};

const MIN_BAR = 4;

/** A waveform as rounded bars that fill the available width. */
export function Bars({ peaks, count, height, progress = 0, played, idle }: Props) {
  const values = peaks ?? Array.from({ length: count }, (_, i) => 0.12 + 0.08 * (((i * 7) % 5) / 4));
  const playedBars = peaks ? Math.round(progress * values.length) : 0;
  return (
    <View style={[styles.row, { height }]} aria-hidden>
      {values.map((v, i) => (
        <View
          key={i}
          style={[
            styles.bar,
            {
              height: Math.max(MIN_BAR, v * height),
              backgroundColor: i < playedBars ? played : idle,
              opacity: peaks ? 1 : 0.6,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  bar: { flex: 1, maxWidth: 7, borderRadius: 3 },
});
