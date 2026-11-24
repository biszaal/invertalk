import { getRecordingPermissionsAsync } from 'expo-audio';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { AppState, Linking, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/ui/Button';
import { Screen } from '@/ui/Screen';
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
    <Screen title="Microphone is off">
      <Text style={[styles.body, { color: t.text }]}>
        Invertalk needs the microphone to record the phrase and the imitation. Recordings stay on this phone.
      </Text>
      <View style={styles.actions}>
        <Button label="Open Settings" onPress={() => void Linking.openSettings()} />
        <Button label="Back" variant="secondary" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { fontSize: 18, lineHeight: 26 },
  actions: { gap: 12 },
});
