import { router } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { useChallenge } from '@/game/ChallengeProvider';
import { PlayButton } from '@/ui/PlayButton';
import { RecordTake } from '@/ui/RecordTake';
import { Screen } from '@/ui/Screen';
import { useTheme } from '@/ui/theme';

/** Player 2 copies the backwards sound. Never shows the phrase. */
export default function ImitateScreen() {
  const t = useTheme();
  const { state, fileUri, recorded } = useChallenge();
  if (!state.sessionId || !state.prompt) return null;

  return (
    <Screen title="Player 2">
      <Text style={[styles.body, { color: t.text }]}>Copy the sounds you heard, as closely as you can.</Text>
      <PlayButton uri={state.prompt.revUri} label="Hear it again" />
      <RecordTake
        role="imitation"
        targetUri={fileUri('imitation', 'raw')}
        onRecorded={(take) => {
          recorded('imitation', take.uri, take.durationMs);
          router.push('/reveal');
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { fontSize: 18, lineHeight: 26 },
});
