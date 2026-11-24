import { useAudioPlayer, useAudioPlayerStatus, type AudioPlayer } from 'expo-audio';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

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
        primary ? styles.primary : styles.secondary,
        (pressed || disabled) && styles.dimmed,
      ]}>
      <Text style={[styles.label, primary && styles.primaryLabel]}>
        {status.playing ? 'Playing…' : label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: '#2F5BD3' },
  secondary: { borderWidth: 1.5, borderColor: '#2F5BD3' },
  dimmed: { opacity: 0.5 },
  label: { fontSize: 17, fontWeight: '600', color: '#2F5BD3' },
  primaryLabel: { color: '#FFFFFF' },
});
