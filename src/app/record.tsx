import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { useChallenge } from '@/game/ChallengeProvider';
import { RecordTake } from '@/ui/RecordTake';
import { Screen } from '@/ui/Screen';
import { Txt } from '@/ui/Txt';
import { fonts, useTheme } from '@/ui/theme';

/** Player 1 sees the phrase and records it. */
export default function RecordScreen() {
  const t = useTheme();
  const { state, fileUri, recorded } = useChallenge();
  // No session (e.g. the game was just ended from the header ×): render nothing while the stack unwinds.
  if (!state.sessionId || !state.phrase) return null;

  return (
    <Screen eyebrow="Player 1" title="Say it clearly.">
      <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
        <Txt style={styles.phrase}>
          <Txt style={[styles.phrase, { color: t.accent }]}>“</Txt>
          {state.phrase.text}
          <Txt style={[styles.phrase, { color: t.accent }]}>”</Txt>
        </Txt>
      </View>
      <Txt variant="muted">You&apos;ll hear it backwards next.</Txt>
      <View style={styles.take}>
        <RecordTake
          role="prompt"
          targetUri={fileUri('prompt', 'raw')}
          onRecorded={(take) => {
            recorded('prompt', take.uri, take.durationMs);
            router.push('/prompt');
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 24, borderWidth: 1, padding: 22 },
  phrase: { fontFamily: fonts.black, fontSize: 30, lineHeight: 36, letterSpacing: -0.9 },
  take: { marginTop: 'auto', paddingTop: 12 },
});
