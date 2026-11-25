import Feather from '@expo/vector-icons/Feather';
import { getRecordingPermissionsAsync } from 'expo-audio';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { AppState, Linking, StyleSheet, View } from 'react-native';

import { Button } from '@/ui/Button';
import { Screen } from '@/ui/Screen';
import { Txt } from '@/ui/Txt';
import { useTheme } from '@/ui/theme';

export default function PermissionDeniedScreen() {
  const t = useTheme();

  // Back from system Settings with the mic now allowed: return to the record screen.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next !== 'active') return;
      void getRecordingPermissionsAsync().then((p) => {
        if (p.granted && router.canGoBack()) router.back();
      });
    });
    return () => sub.remove();
  }, []);

  return (
    <Screen
      eyebrow="Microphone"
      title="Microphone is off."
      footer={
        <>
          <Button label="Open Settings" icon="arrow-up-right" onPress={() => void Linking.openSettings()} />
          <Button label="Back" variant="secondary" onPress={() => router.back()} />
        </>
      }>
      <View style={[styles.icon, { backgroundColor: t.selectedBg }]}>
        <Feather name="mic-off" size={26} color={t.text} />
      </View>
      <Txt variant="body">
        Invertalk needs the microphone to record the phrase and the imitation. Recordings stay on this phone.
      </Txt>
    </Screen>
  );
}

const styles = StyleSheet.create({
  icon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
});
