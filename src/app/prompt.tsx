import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Alert, BackHandler } from 'react-native';

import { useChallenge } from '@/game/ChallengeProvider';
import { useReversal } from '@/game/useReversal';
import { Button } from '@/ui/Button';
import { failureText } from '@/ui/failureText';
import { Notice } from '@/ui/Notice';
import { Screen } from '@/ui/Screen';
import { Txt } from '@/ui/Txt';
import { WavePlayer } from '@/ui/WavePlayer';

/** Player 1 hears the phrase backwards, then hands over. Never shows the phrase. */
export default function PromptScreen() {
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

  if (reversal.status === 'failed') {
    return (
      <Screen eyebrow="Hand it over" title="That didn't work." footer={<Button label="Record again" onPress={backToPhrase} />}>
        <Notice tone="error" text={failureText(reversal.code, "Couldn't play that recording backwards. Please record it again.")} />
      </Screen>
    );
  }

  const ready = reversal.status === 'ready';
  return (
    <Screen
      eyebrow="Hand it over"
      title="Here it is, backwards."
      footer={
        ready ? (
          <>
            <Button label="I'm Player 2 — record my try" icon="arrow-right" onPress={() => router.push('/imitate')} />
            <Button label="Re-record phrase (Player 1)" variant="secondary" onPress={confirmBackToPhrase} />
          </>
        ) : null
      }>
      <WavePlayer uri={ready ? reversal.revUri : null} label="Play backwards" />
      {ready ? (
        <Txt variant="body">Listen, then hand the phone to Player 2. Don&apos;t show them the phrase.</Txt>
      ) : (
        <Notice text="Flipping it backwards…" />
      )}
    </Screen>
  );
}
