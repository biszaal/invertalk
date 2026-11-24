import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { sweepTempDir } from '@/audio/cleanup';
import { audioDir, expoFileOps } from '@/audio/expoFileOps';
import { ChallengeProvider } from '@/game/ChallengeProvider';
import { EndGameButton } from '@/ui/EndGameButton';

/** Screens Player 2 holds: no swipe-back (it could reveal the phrase) and an × to end the game. */
const handOverOptions = {
  gestureEnabled: false,
  headerRight: () => <EndGameButton />,
};

export default function RootLayout() {
  const scheme = useColorScheme();

  useEffect(() => {
    // Delete recordings left behind by a crash or a killed app.
    try {
      sweepTempDir(expoFileOps, audioDir().uri);
    } catch {
      // A failed sweep must never block launch; the next launch retries.
    }
  }, []);

  return (
    <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <ChallengeProvider>
        <Stack screenOptions={{ title: '', headerShadowVisible: false, headerBackButtonDisplayMode: 'minimal' }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="prompt" options={{ ...handOverOptions, headerBackVisible: false }} />
          <Stack.Screen name="imitate" options={handOverOptions} />
          <Stack.Screen name="reveal" options={{ ...handOverOptions, headerBackVisible: false }} />
        </Stack>
      </ChallengeProvider>
    </ThemeProvider>
  );
}
