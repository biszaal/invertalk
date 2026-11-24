import { Stack } from 'expo-router';
import { useEffect } from 'react';

import { sweepTempDir } from '@/audio/cleanup';
import { audioDir, expoFileOps } from '@/audio/expoFileOps';

export default function RootLayout() {
  useEffect(() => {
    // Delete recordings left behind by a crash or a killed app.
    try {
      sweepTempDir(expoFileOps, audioDir().uri);
    } catch {
      // A failed sweep must never block launch; the next launch retries.
    }
  }, []);

  return <Stack />;
}
