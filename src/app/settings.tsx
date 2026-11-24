import Constants from 'expo-constants';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Linking, Platform, StyleSheet, Text, View } from 'react-native';

import { PRIVACY_POLICY_IS_PLACEHOLDER, PRIVACY_POLICY_URL } from '@/config';
import type { ConsentRecord } from '@/game/consent';
import { readConsent } from '@/game/consentStore';
import { Button } from '@/ui/Button';
import { formatDate } from '@/ui/formatDate';
import { Notice } from '@/ui/Notice';
import { Screen } from '@/ui/Screen';
import { useTheme } from '@/ui/theme';

export default function SettingsScreen() {
  const t = useTheme();
  const [consent, setConsent] = useState<ConsentRecord | null | undefined>(undefined);

  useFocusEffect(
    useCallback(() => {
      void readConsent().then(setConsent);
    }, [])
  );

  const config = Constants.expoConfig;
  const build = Platform.OS === 'ios' ? config?.ios?.buildNumber : config?.android?.versionCode;

  return (
    <Screen title="Settings">
      <View style={styles.section}>
        <Text accessibilityRole="header" style={[styles.heading, { color: t.text }]}>
          Privacy
        </Text>
        <Text style={[styles.body, { color: t.text }]}>
          Recordings stay on this phone and are deleted after each game.
        </Text>
        <Button label="Privacy policy" variant="secondary" onPress={() => void Linking.openURL(PRIVACY_POLICY_URL)} />
        {__DEV__ && PRIVACY_POLICY_IS_PLACEHOLDER && (
          <Notice tone="error" text="Placeholder URL — replace before store submit." />
        )}
      </View>

      <View style={styles.section}>
        <Text accessibilityRole="header" style={[styles.heading, { color: t.text }]}>
          Recording consent
        </Text>
        {consent !== undefined && (
          <Text style={[styles.body, { color: t.text }]}>
            {consent ? `Agreed on ${formatDate(consent.acceptedAt)}` : 'Not agreed yet'}
          </Text>
        )}
        <Button
          label="Read it again"
          variant="secondary"
          onPress={() => router.push({ pathname: '/consent', params: { mode: 'review' } })}
        />
      </View>

      <Text style={[styles.version, { color: t.muted }]}>
        {`Version ${config?.version ?? '?'}${build ? ` (${build})` : ''}`}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: 12 },
  heading: { fontSize: 20, fontWeight: '700' },
  body: { fontSize: 17, lineHeight: 24 },
  version: { fontSize: 15, marginTop: 8 },
});
