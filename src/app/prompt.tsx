import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Alert, BackHandler, StyleSheet, Text } from 'react-native';

import { useChallenge } from '@/game/ChallengeProvider';
import { useReversal } from '@/game/useReversal';
import { Button } from '@/ui/Button';
import { Notice } from '@/ui/Notice';
import { PlayButton } from '@/ui/PlayButton';
import { Screen } from '@/ui/Screen';
import { useTheme } from '@/ui/theme';

/** Player 1 hears the phrase backwards, then hands over. Never shows the phrase. */
export default function PromptScreen() {
  const t = useTheme();
  const { state, rerecordPrompt } = useChallenge();
  const reversal = useReversal('prompt');

  const backToPhrase = useCallback(() => {
    rerecordPrompt();
    router.back();
  }, [rerecordPrompt]);

  const confirmBackToPhrase = useCallback(() => {
    Alert.alert('Player 1 only', 'Going back shows the phrase. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Continue', onPress: backToPhrase },
    ]);
  }, [backToPhrase]);

  // Android back would land on the Record screen, which shows the phrase.
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        confirmBackToPhrase();
        return true;
      });
      return () => sub.remove();
    }, [confirmBackToPhrase])
  );

  if (!state.sessionId) return null;

  return (
    <Screen title="Hear it backwards">
      {reversal.status === 'preparing' && <Notice text="Flipping it backwards…" />}
      {reversal.status === 'failed' && (
        <>
          <Notice tone="error" text="Couldn't play that recording backwards. Please record it again." />
          <Button label="Record again" onPress={backToPhrase} />
        </>
      )}
      {reversal.status === 'ready' && (
        <>
          <PlayButton uri={reversal.revUri} label="Play backwards" variant="primary" />
          <Text style={[styles.body, { color: t.text }]}>
            Hand the phone to Player 2. Don&apos;t show them the phrase.
          </Text>
          <Button label="I'm Player 2 — record my try" onPress={() => router.push('/imitate')} />
          <Button label="Re-record phrase (Player 1)" variant="secondary" onPress={confirmBackToPhrase} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { fontSize: 18, lineHeight: 26 },
});
