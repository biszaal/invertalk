import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { PRIVACY_POLICY_URL } from '@/config';
import type { ConsentRecord } from '@/game/consent';
import { acceptConsent, readConsent } from '@/game/consentStore';
import { Button } from '@/ui/Button';
import { formatDate } from '@/ui/formatDate';
import { Screen } from '@/ui/Screen';
import { useTheme } from '@/ui/theme';

const POINTS = [
  "Invertalk uses your microphone to record the phrase and your friend's imitation.",
  'Everything is processed on this phone. Recordings are never uploaded.',
  'Recordings are temporary and are deleted when the game ends.',
  'We collect anonymous usage stats, like whether a game was finished. They never include your voice or the words you choose.',
];

export default function ConsentScreen() {
  const t = useTheme();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const review = mode === 'review';
  const [record, setRecord] = useState<ConsentRecord | null | undefined>(undefined);

  useEffect(() => {
    if (review) void readConsent().then(setRecord);
  }, [review]);

  const onAgree = async () => {
    try {
      await acceptConsent(new Date());
    } catch {
      // Could not save: let them play now; we'll simply ask again next time.
    }
    router.replace('/phrase');
  };

  const onDecline = () => router.dismissTo({ pathname: '/', params: { notice: 'consent_declined' } });

  return (
    <Screen title="Before you record">
      <View style={styles.points}>
        {POINTS.map((point) => (
          <View key={point} style={styles.point}>
            <Text style={[styles.bullet, { color: t.text }]}>•</Text>
            <Text style={[styles.text, { color: t.text }]}>{point}</Text>
          </View>
        ))}
      </View>
      <Button label="Read the privacy policy" variant="secondary" onPress={() => void Linking.openURL(PRIVACY_POLICY_URL)} />
      {review ? (
        <>
          {record !== undefined && (
            <Text style={[styles.text, { color: t.muted }]}>
              {record
                ? `You agreed on ${formatDate(record.acceptedAt)}.`
                : "You haven't agreed yet."}
            </Text>
          )}
          <Button label="Close" onPress={() => router.back()} />
        </>
      ) : (
        <View style={styles.actions}>
          <Button label="I agree" onPress={onAgree} />
          <Button label="Not now" variant="secondary" onPress={onDecline} />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  points: { gap: 14 },
  point: { flexDirection: 'row', gap: 10 },
  bullet: { fontSize: 18, lineHeight: 26 },
  text: { flex: 1, fontSize: 18, lineHeight: 26 },
  actions: { gap: 12, marginTop: 8 },
});
