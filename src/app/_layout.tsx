import { DarkTheme, DefaultTheme, Stack, ThemeProvider, usePathname } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useColorScheme } from 'react-native';

import { initAnalytics, track } from '@/analytics';
import { screenName } from '@/analytics/events';
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
  const pathname = usePathname();
  const currentPath = useRef(pathname);

  useEffect(() => {
    currentPath.current = pathname;
  }, [pathname]);

  // Analytics (no-op without a key) and a JS error hook that reports only an
  // opaque code and the screen name — never the error message, which can hold paths.
  useEffect(() => {
    initAnalytics();
    const previous = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler((error, isFatal) => {
      track({
        name: 'app_error',
        error_code: isFatal ? 'js_fatal' : 'js_unhandled',
        screen: screenName(currentPath.current),
      });
      previous(error, isFatal);
    });
    return () => ErrorUtils.setGlobalHandler(previous);
  }, []);

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
