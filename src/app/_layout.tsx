import { GeistMono_500Medium } from '@expo-google-fonts/geist-mono';
import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/outfit';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useMemo, useRef } from 'react';

import { initAnalytics, track } from '@/analytics';
import { screenName } from '@/analytics/events';
import { sweepTempDir } from '@/audio/cleanup';
import { audioDir, expoFileOps } from '@/audio/expoFileOps';
import { ChallengeProvider } from '@/game/ChallengeProvider';
import { EndGameButton } from '@/ui/EndGameButton';
import { fonts, useTheme } from '@/ui/theme';

// Keep the splash up until the brand fonts are ready, so text never flashes in a fallback face.
void SplashScreen.preventAutoHideAsync().catch(() => {});

/** Screens Player 2 holds: no swipe-back (it could reveal the phrase) and an × to end the game. */
const handOverOptions = {
  gestureEnabled: false,
  headerRight: () => <EndGameButton />,
};

export default function RootLayout() {
  const t = useTheme();
  const pathname = usePathname();
  const [fontsLoaded, fontError] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
    GeistMono_500Medium,
  });

  useEffect(() => {
    // If a font fails to load, carry on with the system face rather than hang on the splash.
    if (fontsLoaded || fontError) void SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, fontError]);

  const navTheme = useMemo(() => {
    const base = t.scheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: { ...base.colors, background: t.background, card: t.background, text: t.text, border: t.border, primary: t.accent },
    };
  }, [t]);
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

  if (!fontsLoaded && !fontError) return null;

  return (
    <ThemeProvider value={navTheme}>
      <ChallengeProvider>
        <Stack
          screenOptions={{
            title: '',
            headerShadowVisible: false,
            headerStyle: { backgroundColor: t.background },
            headerTintColor: t.text,
            headerTitleStyle: { fontFamily: fonts.semibold },
            contentStyle: { backgroundColor: t.background },
            headerBackButtonDisplayMode: 'minimal',
            // iOS long-press on Back lists earlier screens; from Imitate that would jump to the phrase.
            headerBackButtonMenuEnabled: false,
          }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="prompt" options={{ ...handOverOptions, headerBackVisible: false }} />
          <Stack.Screen name="imitate" options={handOverOptions} />
          <Stack.Screen name="reveal" options={{ ...handOverOptions, headerBackVisible: false }} />
        </Stack>
      </ChallengeProvider>
    </ThemeProvider>
  );
}
