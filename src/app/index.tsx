import { Link, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useChallenge } from '@/game/ChallengeProvider';
import { isConsentCurrent } from '@/game/consent';
import { readConsent } from '@/game/consentStore';
import { Button } from '@/ui/Button';
import { Notice } from '@/ui/Notice';
import { Screen } from '@/ui/Screen';
import { useTheme } from '@/ui/theme';

export default function Home() {
  const t = useTheme();
  const { state, endSession } = useChallenge();
  const { notice } = useLocalSearchParams<{ notice?: string }>();

  // Coming back Home ends any game in progress and deletes its recordings.
  useFocusEffect(
    useCallback(() => {
      if (state.sessionId) endSession();
    }, [state.sessionId, endSession])
  );

  const onStart = async () => {
    if (notice) router.setParams({ notice: undefined });
    const consent = await readConsent();
    router.push(isConsentCurrent(consent) ? '/phrase' : '/consent');
  };

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.hero}>
        <Text accessibilityRole="header" style={[styles.title, { color: t.text }]}>
          Invertalk
        </Text>
        <Text style={[styles.body, { color: t.muted }]}>
          Say a phrase. Your friend hears it backwards and copies it. Flip their attempt and hear what they really
          said.
        </Text>
      </View>
      {notice === 'consent_declined' && (
        <Notice text="Recording needs your OK first. Tap Start when you're ready to agree." />
      )}
      <Button label="Start challenge" onPress={onStart} />
      <Button label="Settings" variant="secondary" onPress={() => router.push('/settings')} />
      {__DEV__ && (
        <Link href="/dev-audio" style={[styles.devLink, { color: t.accent }]}>
          Audio test (dev)
        </Link>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { flexGrow: 1, justifyContent: 'center', gap: 12, paddingVertical: 32 },
  title: { fontSize: 40, fontWeight: '800' },
  body: { fontSize: 18, lineHeight: 26 },
  devLink: { fontSize: 15, padding: 12, textAlign: 'center' },
});
