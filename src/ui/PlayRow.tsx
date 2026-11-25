import Feather from '@expo/vector-icons/Feather';
import { Pressable, StyleSheet, View } from 'react-native';

import { formatClock } from '@/audio/clock';
import { usePlayback } from '@/audio/usePlayback';

import type { IconName } from './Button';
import { Txt } from './Txt';
import { useTheme } from './theme';

type Props = {
  uri: string | null;
  label: string;
  accessibilityLabel?: string;
  /** Icon shown while paused: 'play' for forwards audio, 'rewind' for a backwards clip. */
  icon?: IconName;
  divider?: boolean;
};

/** A compact list row that plays one clip. */
export function PlayRow({ uri, label, accessibilityLabel, icon = 'play', divider = false }: Props) {
  const t = useTheme();
  const playback = usePlayback(uri);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={playback.playing ? `Pause: ${label}` : (accessibilityLabel ?? label)}
      disabled={!uri}
      onPress={playback.toggle}
      style={({ pressed }) => [
        styles.row,
        divider && { borderBottomWidth: 1, borderBottomColor: t.border },
        pressed && styles.pressed,
        !uri && styles.disabled,
      ]}>
      <View style={[styles.icon, { backgroundColor: playback.playing ? t.accent : t.surface, borderColor: playback.playing ? t.accent : t.border }]}>
        <Feather name={playback.playing ? 'pause' : icon} size={16} color={playback.playing ? t.onAccent : t.text} />
      </View>
      <Txt variant="label" style={styles.label}>
        {playback.playing ? 'Playing…' : label}
      </Txt>
      <Txt variant="meta">{playback.duration > 0 ? formatClock(playback.duration) : ''}</Txt>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 8 },
  icon: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  label: { flex: 1 },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.4 },
});
