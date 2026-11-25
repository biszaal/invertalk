import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { useChallenge } from '@/game/ChallengeProvider';
import { PlayRow } from '@/ui/PlayRow';
import { RecordTake } from '@/ui/RecordTake';
import { Screen } from '@/ui/Screen';
import { Txt } from '@/ui/Txt';
import { useTheme } from '@/ui/theme';

/** Player 2 copies the backwards sound. Never shows the phrase. */
export default function ImitateScreen() {
  const t = useTheme();
  const { state, fileUri, recorded } = useChallenge();
  if (!state.sessionId || !state.prompt) return null;

  return (
    <Screen eyebrow="Player 2" title="Copy the sound.">
      <Txt variant="muted">Make the same noises you heard, as closely as you can.</Txt>
      <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
        <PlayRow uri={state.prompt.revUri} label="Hear it again" icon="rewind" accessibilityLabel="Hear the backwards prompt again" />
      </View>
      <View style={styles.take}>
        <RecordTake
          role="imitation"
          targetUri={fileUri('imitation', 'raw')}
          onRecorded={(take) => {
            recorded('imitation', take.uri, take.durationMs);
            router.push('/reveal');
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 22, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 4 },
  take: { marginTop: 'auto', paddingTop: 12 },
});
