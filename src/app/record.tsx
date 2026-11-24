import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { useChallenge } from '@/game/ChallengeProvider';
import { RecordTake } from '@/ui/RecordTake';
import { Screen } from '@/ui/Screen';
import { useTheme } from '@/ui/theme';

/** Player 1 sees the phrase and records it. */
export default function RecordScreen() {
  const t = useTheme();
  const { state, fileUri, recorded } = useChallenge();
  // No session (e.g. the game was just ended from the header ×): render nothing while the stack unwinds.
  if (!state.sessionId || !state.phrase) return null;

  return (
    <Screen title="Player 1">
      <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
        <Text style={[styles.phrase, { color: t.text }]}>{state.phrase.text}</Text>
      </View>
      <Text style={[styles.hint, { color: t.muted }]}>Say it clearly. You'll hear it backwards next.</Text>
      <RecordTake
        role="prompt"
        targetUri={fileUri('prompt', 'raw')}
        onRecorded={(take) => {
          recorded('prompt', take.uri, take.durationMs);
          router.push('/prompt');
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { padding: 20, borderRadius: 16, borderWidth: 1 },
  phrase: { fontSize: 28, fontWeight: '700', lineHeight: 36 },
  hint: { fontSize: 17, lineHeight: 24 },
});
