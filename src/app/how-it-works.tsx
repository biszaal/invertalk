import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/ui/Button';
import { Screen } from '@/ui/Screen';
import { Txt } from '@/ui/Txt';
import { fonts, useTheme } from '@/ui/theme';

const STEPS = [
  'Player 1 picks a phrase and records it.',
  'Invertalk plays the recording backwards.',
  'Pass the phone. Player 2 copies the backwards sound, as closely as they can.',
  'The reveal flips their copy forwards. Spot on, or wonderfully wrong.',
];

export default function HowItWorks() {
  const t = useTheme();
  return (
    <Screen eyebrow="How it works" title="Two players, one phone." footer={<Button label="Got it" onPress={() => router.back()} />}>
      <View>
        {STEPS.map((step, i) => (
          <View key={step} style={[styles.step, i < STEPS.length - 1 && { borderBottomWidth: 1, borderBottomColor: t.border }]}>
            <Txt style={[styles.number, { color: t.accent }]}>{String(i + 1).padStart(2, '0')}</Txt>
            <Txt variant="body" style={styles.text}>
              {step}
            </Txt>
          </View>
        ))}
      </View>
      <Txt variant="muted">There's no score and no judge. The reveal is the point.</Txt>
    </Screen>
  );
}

const styles = StyleSheet.create({
  step: { flexDirection: 'row', gap: 16, paddingVertical: 18 },
  number: { fontFamily: fonts.mono, fontSize: 15, lineHeight: 25 },
  text: { flex: 1 },
});
