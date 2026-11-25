import { useAudioPlayer, useAudioPlayerStatus, type AudioPlayer } from 'expo-audio';
import { useCallback, useEffect } from 'react';

/** Only one clip plays at a time across the app. */
let activePlayer: AudioPlayer | null = null;

export type Playback = {
  playing: boolean;
  /** Seconds into the clip (0 once it has played to the end). */
  current: number;
  /** Seconds, 0 until the clip has loaded. */
  duration: number;
  toggle: () => Promise<void>;
};

/** Play/pause one WAV, pausing whatever else is playing; restarts from 0 after it ends. */
export function usePlayback(uri: string | null): Playback {
  const player = useAudioPlayer(uri ?? null);
  const status = useAudioPlayerStatus(player);
  const duration = status.duration > 0 ? status.duration : 0;
  const finished = !status.playing && duration > 0 && status.currentTime >= duration - 0.05;
  const current = finished ? 0 : status.currentTime;

  useEffect(
    () => () => {
      if (activePlayer === player) activePlayer = null;
    },
    [player]
  );

  const toggle = useCallback(async () => {
    if (!uri) return;
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
    if (finished || current === 0) await player.seekTo(0);
    player.play();
  }, [current, finished, player, status.playing, uri]);

  return { playing: status.playing, current, duration, toggle };
}
