import Feather from '@expo/vector-icons/Feather';
import { Pressable, StyleSheet, View } from 'react-native';

import { formatClock } from '@/audio/clock';
import { usePlayback } from '@/audio/usePlayback';
import { useWavePeaks } from '@/audio/useWavePeaks';

import { Bars } from './Bars';
import { Txt } from './Txt';
import { useTheme } from './theme';

const BARS = 36;

/** The stage card: a take's real waveform, its progress, and a big play/pause button. */
export function WavePlayer({ uri, label }: { uri: string | null; label: string }) {
  const t = useTheme();
  const playback = usePlayback(uri);
  const peaks = useWavePeaks(uri, BARS);
  const progress = playback.duration > 0 ? playback.current / playback.duration : 0;

  return (
    <View style={[styles.card, { backgroundColor: t.stage }]}>
      <Bars peaks={peaks} count={BARS} height={104} progress={progress} played={t.accent} idle={t.bar} />
      <View style={styles.footer}>
        <View style={styles.meta}>
          <Txt variant="eyebrow" color={t.stageMuted}>
            {label}
          </Txt>
          <Txt variant="meta" color={t.stageMuted}>
            {`${formatClock(playback.current)} / ${formatClock(playback.duration)}`}
          </Txt>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={playback.playing ? `Pause: ${label}` : label}
          disabled={!uri}
          onPress={playback.toggle}
          style={({ pressed }) => [styles.play, { backgroundColor: t.accent }, pressed && styles.pressed, !uri && styles.disabled]}>
          <Feather name={playback.playing ? 'pause' : 'play'} size={24} color={t.onAccent} style={playback.playing ? undefined : styles.nudge} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 28, paddingHorizontal: 18, paddingTop: 22, paddingBottom: 16, gap: 18 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  meta: { gap: 4 },
  play: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center' },
  nudge: { marginLeft: 3 },
  pressed: { transform: [{ scale: 0.95 }] },
  disabled: { opacity: 0.4 },
});
