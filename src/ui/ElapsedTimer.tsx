import { StyleSheet, Text, View } from 'react-native';

import { MAX_RECORDING_MS } from '@/config';

import { useTheme } from './theme';

/** `0:07 / 0:20` plus a bar showing how much of the 20-second cap is used. */
export function ElapsedTimer({ elapsedMs }: { elapsedMs: number }) {
  const t = useTheme();
  const seconds = Math.floor(elapsedMs / 1000);
  const max = MAX_RECORDING_MS / 1000;
  const fraction = Math.min(elapsedMs / MAX_RECORDING_MS, 1);
  return (
    <View accessible accessibilityLabel={`${seconds} seconds of ${max}`} style={styles.wrap}>
      <Text style={[styles.time, { color: t.text }]}>{`0:${String(seconds).padStart(2, '0')} / 0:${max}`}</Text>
      <View style={[styles.track, { backgroundColor: t.border }]}>
        <View style={[styles.fill, { backgroundColor: t.record, width: `${fraction * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8, alignItems: 'center' },
  time: { fontSize: 20, fontVariant: ['tabular-nums'], fontWeight: '600' },
  track: { alignSelf: 'stretch', height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 6 },
});
