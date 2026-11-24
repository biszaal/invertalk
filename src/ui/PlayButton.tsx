import { useAudioPlayer, useAudioPlayerStatus, type AudioPlayer } from 'expo-audio';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useTheme } from './theme';

type Props = {
  uri: string | null;
  label: string;
  accessibilityLabel?: string;
  variant?: 'primary' | 'secondary';
};

/** Only one clip plays at a time across the app. */
let activePlayer: AudioPlayer | null = null;

export function PlayButton({ uri, label, accessibilityLabel, variant = 'secondary' }: Props) {
  const player = useAudioPlayer(uri ?? null);
  const status = useAudioPlayerStatus(player);
  const disabled = !uri;
  const t = useTheme();

  useEffect(
    () => () => {
      if (activePlayer === player) activePlayer = null;
    },
    [player]
  );

  const onPress = async () => {
    if (status.playing) {
      player.pause();
      return;
    }
    if (activePlayer && activePlayer !== player) {
      try {
        activePlayer.pause();
      } catch {
        // The other player was already released.
      }
    }
    activePlayer = player;
    await player.seekTo(0);
    player.play();
  };

  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled, busy: status.playing }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        primary ? { backgroundColor: t.accent } : { borderColor: t.accent, borderWidth: 1.5 },
        (pressed || disabled) && styles.dimmed,
      ]}>
      <Text style={[styles.label, { color: primary ? t.onAccent : t.accent }]}>
        {status.playing ? 'Playing…' : label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dimmed: { opacity: 0.45 },
  label: { fontSize: 17, fontWeight: '600', textAlign: 'center' },
});
