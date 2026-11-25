import { StyleSheet, View } from 'react-native';

import { MAX_RECORDING_MS } from '@/config';

import { Txt } from './Txt';
import { fonts, useTheme } from './theme';

/** Large `0:07` readout with the 20-second cap beside it, and a bar filling toward the cap. */
export function ElapsedTimer({ elapsedMs }: { elapsedMs: number }) {
  const t = useTheme();
  const seconds = Math.floor(elapsedMs / 1000);
  const max = MAX_RECORDING_MS / 1000;
  const fraction = Math.min(elapsedMs / MAX_RECORDING_MS, 1);
  return (
    <View accessible accessibilityLabel={`${seconds} seconds of ${max}`} style={styles.wrap}>
      <Txt style={styles.time}>
        {`0:${String(seconds).padStart(2, '0')}`}
        <Txt variant="meta" style={styles.max}>{`  / 0:${max}`}</Txt>
      </Txt>
      <View style={[styles.track, { backgroundColor: t.border }]}>
        <View style={[styles.fill, { backgroundColor: t.accent, width: `${fraction * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12, alignItems: 'center' },
  time: { fontFamily: fonts.mono, fontSize: 36, lineHeight: 42, letterSpacing: -1 },
  max: { fontSize: 14 },
  track: { alignSelf: 'stretch', height: 4, borderRadius: 2, overflow: 'hidden' },
  fill: { height: 4 },
});
