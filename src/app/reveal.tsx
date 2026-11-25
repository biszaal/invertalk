import Feather from '@expo/vector-icons/Feather';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, View } from 'react-native';

import { track } from '@/analytics';
import { useChallenge } from '@/game/ChallengeProvider';
import { useReversal } from '@/game/useReversal';
import { canShare, shareReveal } from '@/share/shareReveal';
import { Button } from '@/ui/Button';
import { failureText } from '@/ui/failureText';
import { Notice } from '@/ui/Notice';
import { PlayRow } from '@/ui/PlayRow';
import { Screen } from '@/ui/Screen';
import { Txt } from '@/ui/Txt';
import { WavePlayer } from '@/ui/WavePlayer';
import { fonts, useTheme } from '@/ui/theme';

/** challenge_finished fires once per game, not again after Retry imitation. */
let finishedSession: string | null = null;

/** Player 2's attempt flipped forwards, with comparisons and the phrase behind a tap. */
export default function RevealScreen() {
  const t = useTheme();
  const { state, retryImitation, endSession } = useChallenge();
  const reversal = useReversal('imitation');
  const [showPhrase, setShowPhrase] = useState(false);
  const [shareable, setShareable] = useState(false);
  const [shareFailed, setShareFailed] = useState(false);

  useEffect(() => {
    void canShare().then(setShareable);
  }, []);

  const { sessionId, startedAt } = state;
  useEffect(() => {
    if (reversal.status !== 'ready' || !sessionId || finishedSession === sessionId) return;
    finishedSession = sessionId;
    track({ name: 'challenge_finished', total_duration_ms: startedAt ? Date.now() - startedAt : Number.NaN });
  }, [reversal.status, sessionId, startedAt]);

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

  const onShare = async (uri: string) => {
    setShareFailed(false);
    track({ name: 'share_clicked', share_type: 'audio' });
    // Files stay until the session ends, so sharing again still works.
    const result = await shareReveal(uri);
    track({ name: 'share_completed', share_type: 'audio', success: result === 'closed' });
    setShareFailed(result === 'failed');
  };

  const newPhrase = () => {
    endSession();
    router.dismissTo('/phrase');
  };

  if (reversal.status === 'failed') {
    return (
      <Screen eyebrow="The reveal" title="That didn't work." footer={<Button label="Try again" onPress={retry} />}>
        <Notice tone="error" text={failureText(reversal.code, "Couldn't flip that recording. Please record it again.")} />
      </Screen>
    );
  }

  const ready = reversal.status === 'ready';
  return (
    <Screen
      eyebrow="The reveal"
      title="Here's what they really said."
      footer={
        ready ? (
          <View style={styles.actions}>
            <View style={styles.action}>
              <Button label="Retry" variant="secondary" accessibilityLabel="Retry imitation" onPress={retry} />
            </View>
            <View style={styles.action}>
              <Button label="New phrase" variant="solid" onPress={newPhrase} />
            </View>
          </View>
        ) : null
      }>
      <WavePlayer uri={ready ? reversal.revUri : null} label="Play the reveal" />

      {!ready && <Notice text="Flipping your try…" />}

      {ready && (
        <>
          {showPhrase ? (
            <View accessible style={[styles.phraseCard, { backgroundColor: t.selectedBg, borderColor: t.accent }]}>
              <Txt variant="eyebrow" color={t.text}>
                It was
              </Txt>
              <Txt style={styles.phrase}>{`“${state.phrase.text}”`}</Txt>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={() => setShowPhrase(true)}
              style={({ pressed }) => [styles.showPhrase, { borderColor: t.muted }, pressed && styles.pressed]}>
              <Feather name="eye" size={18} color={t.text} />
              <Txt variant="label">Show the phrase</Txt>
            </Pressable>
          )}

          <View>
            <PlayRow
              uri={state.prompt.rawUri}
              label="Play the original"
              accessibilityLabel="Play Player 1's original recording"
              divider
            />
            <PlayRow uri={state.prompt.revUri} label="Play it backwards" icon="rewind" divider={shareable} />
            {shareable && (
              <Pressable
                accessibilityRole="button"
                onPress={() => onShare(reversal.revUri)}
                style={({ pressed }) => [styles.shareRow, pressed && styles.pressed]}>
                <View style={[styles.shareIcon, { backgroundColor: t.surface, borderColor: t.border }]}>
                  <Feather name="share" size={16} color={t.text} />
                </View>
                <Txt variant="label" style={styles.flex}>
                  Share the reveal
                </Txt>
                <Feather name="arrow-up-right" size={18} color={t.muted} />
              </Pressable>
            )}
          </View>
          {shareFailed && <Notice tone="error" text="Couldn't open sharing. Try again." />}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: 10 },
  action: { flex: 1 },
  phraseCard: { borderRadius: 20, borderWidth: 1.5, padding: 16, gap: 6 },
  phrase: { fontFamily: fonts.black, fontSize: 22, lineHeight: 28, letterSpacing: -0.5 },
  showPhrase: {
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  shareRow: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 8 },
  shareIcon: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  pressed: { opacity: 0.7 },
});
