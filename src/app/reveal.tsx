import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { BackHandler, StyleSheet, Text, View } from 'react-native';

import { useChallenge } from '@/game/ChallengeProvider';
import { useReversal } from '@/game/useReversal';
import { Button } from '@/ui/Button';
import { Notice } from '@/ui/Notice';
import { PlayButton } from '@/ui/PlayButton';
import { Screen } from '@/ui/Screen';
import { useTheme } from '@/ui/theme';

/** Player 2's attempt flipped forwards, with comparisons and the phrase behind a tap. */
export default function RevealScreen() {
  const t = useTheme();
  const { state, retryImitation, endSession } = useChallenge();
  const reversal = useReversal('imitation');
  const [showPhrase, setShowPhrase] = useState(false);

  const retry = useCallback(() => {
    retryImitation();
    router.back();
  }, [retryImitation]);

  // Android back = Retry imitation (a plain pop would reuse the take's file name).
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        retry();
        return true;
      });
      return () => sub.remove();
    }, [retry])
  );

  if (!state.sessionId || !state.prompt || !state.phrase) return null;

  const newPhrase = () => {
    endSession();
    router.dismissTo('/phrase');
  };

  return (
    <Screen title="The reveal">
      {reversal.status === 'preparing' && <Notice text="Flipping your try…" />}
      {reversal.status === 'failed' && (
        <>
          <Notice tone="error" text="Couldn't flip that recording. Please record it again." />
          <Button label="Try again" onPress={retry} />
        </>
      )}
      {reversal.status === 'ready' && (
        <>
          <PlayButton uri={reversal.revUri} label="Play the reveal" variant="primary" />
          <PlayButton
            uri={state.prompt.rawUri}
            label="Play the original"
            accessibilityLabel="Play Player 1's original recording"
          />
          <PlayButton uri={state.prompt.revUri} label="Play the backwards prompt" />
          {showPhrase ? (
            <View accessible style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
              <Text style={[styles.phrase, { color: t.text }]}>{`It was: “${state.phrase.text}”`}</Text>
            </View>
          ) : (
            <Button label="Show the phrase" variant="secondary" onPress={() => setShowPhrase(true)} />
          )}
          <View style={styles.actions}>
            <Button label="Retry imitation" variant="secondary" onPress={retry} />
            <Button label="New phrase" onPress={newPhrase} />
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { padding: 18, borderRadius: 16, borderWidth: 1 },
  phrase: { fontSize: 22, fontWeight: '700', lineHeight: 30 },
  actions: { gap: 12, marginTop: 8 },
});
