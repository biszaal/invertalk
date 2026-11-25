import Feather from '@expo/vector-icons/Feather';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';

import { track } from '@/analytics';
import { PRIVACY_POLICY_URL } from '@/config';
import type { ConsentRecord } from '@/game/consent';
import { acceptConsent, readConsent } from '@/game/consentStore';
import { Button, type IconName } from '@/ui/Button';
import { formatDate } from '@/ui/formatDate';
import { Screen } from '@/ui/Screen';
import { Txt } from '@/ui/Txt';
import { useTheme } from '@/ui/theme';

const POINTS: { icon: IconName; text: string }[] = [
  { icon: 'mic', text: "Invertalk uses your microphone to record the phrase and your friend's imitation." },
  { icon: 'smartphone', text: 'Everything is processed on this phone. Recordings are never uploaded.' },
  { icon: 'trash-2', text: 'Recordings are temporary and are deleted when the game ends.' },
  {
    icon: 'bar-chart-2',
    text: 'We collect anonymous usage stats, like whether a game was finished. They never include your voice or the words you choose.',
  },
];

export default function ConsentScreen() {
  const t = useTheme();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const review = mode === 'review';
  const [record, setRecord] = useState<ConsentRecord | null | undefined>(undefined);

  useEffect(() => {
    if (review) void readConsent().then(setRecord);
    else track({ name: 'consent_shown' });
  }, [review]);

  const onAgree = async () => {
    track({ name: 'consent_accepted' });
    try {
      await acceptConsent(new Date());
    } catch {
      // Could not save: let them play now; we'll simply ask again next time.
    }
    router.replace('/phrase');
  };

  const onDecline = () => {
    track({ name: 'consent_declined' });
    router.dismissTo({ pathname: '/', params: { notice: 'consent_declined' } });
  };

  return (
    <Screen
      eyebrow="Before you record"
      title="Your voice stays on this phone."
      footer={
        review ? (
          <Button label="Close" onPress={() => router.back()} />
        ) : (
          <>
            <Button label="I agree" onPress={onAgree} />
            <Button label="Not now" variant="secondary" onPress={onDecline} />
          </>
        )
      }>
      <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
        {POINTS.map((point, i) => (
          <View key={point.icon} style={[styles.point, i < POINTS.length - 1 && { borderBottomWidth: 1, borderBottomColor: t.border }]}>
            <View style={[styles.icon, { backgroundColor: t.selectedBg }]}>
              <Feather name={point.icon} size={18} color={t.text} />
            </View>
            <Txt variant="body" style={styles.text}>
              {point.text}
            </Txt>
          </View>
        ))}
      </View>
      <Button label="Read the privacy policy" variant="quiet" icon="external-link" onPress={() => void Linking.openURL(PRIVACY_POLICY_URL)} />
      {review && record !== undefined && (
        <Txt variant="muted">{record ? `You agreed on ${formatDate(record.acceptedAt)}.` : "You haven't agreed yet."}</Txt>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 24, borderWidth: 1, paddingHorizontal: 16 },
  point: { flexDirection: 'row', gap: 14, paddingVertical: 16 },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, fontSize: 16, lineHeight: 23 },
});
