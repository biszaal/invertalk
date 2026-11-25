import { File } from 'expo-file-system';
import { useEffect, useState } from 'react';

import { waveformPeaks } from './peaks';

/** Peaks per file (takes never change once written, and every take has its own name). */
const cache = new Map<string, number[]>();

/** The real waveform of a WAV on disk, in `buckets` bars; null while loading or if unreadable. */
export function useWavePeaks(uri: string | null, buckets: number): number[] | null {
  const key = uri ? `${uri}#${buckets}` : null;
  const [peaks, setPeaks] = useState<number[] | null>(() => (key ? (cache.get(key) ?? null) : null));

  useEffect(() => {
    if (!uri || !key) {
      setPeaks(null);
      return;
    }
    const hit = cache.get(key);
    if (hit) {
      setPeaks(hit);
      return;
    }
    let live = true;
    new File(uri)
      .bytes()
      .then((bytes) => {
        const result = waveformPeaks(bytes, buckets);
        cache.set(key, result);
        if (live) setPeaks(result);
      })
      .catch(() => {
        if (live) setPeaks(null);
      });
    return () => {
      live = false;
    };
  }, [uri, key, buckets]);

  return peaks;
}
