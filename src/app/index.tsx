import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import { useChallenge } from '@/game/ChallengeProvider';
import { isConsentCurrent } from '@/game/consent';
import { readConsent } from '@/game/consentStore';
import { Button, IconButton } from '@/ui/Button';
import { Figure, Wordmark } from '@/ui/Mark';
import { Notice } from '@/ui/Notice';
import { Screen } from '@/ui/Screen';
import { Txt } from '@/ui/Txt';
import { useTheme } from '@/ui/theme';

/** Hero waveform: Player 1's sound on the left, its mirror (the backwards copy) on the right. */
const HERO_BARS = [0.24, 0.44, 0.7, 0.5, 0.9, 1, 0.9, 0.5, 0.7, 0.44, 0.24];

export default function Home() {
  const t = useTheme();
  const { state, endSession } = useChallenge();
  const { notice } = useLocalSearchParams<{ notice?: string }>();

  // Coming back Home ends any game in progress and deletes its recordings.
  useFocusEffect(
    useCallback(() => {
      if (state.sessionId) endSession();
    }, [state.sessionId, endSession])
  );

  const onStart = async () => {
    if (notice) router.setParams({ notice: undefined });
    const consent = await readConsent();
    router.push(isConsentCurrent(consent) ? '/phrase' : '/consent');
  };

  return (
    <Screen
      edges={['top', 'bottom', 'left', 'right']}
      footer={
        <>
          <Button label="Start a challenge" icon="arrow-right" onPress={onStart} />
          <Button label="How it works" variant="quiet" onPress={() => router.push('/how-it-works')} />
        </>
      }>
      <View style={styles.top}>
        <Wordmark size={20} />
        <IconButton icon="sliders" accessibilityLabel="Settings" onPress={() => router.push('/settings')} />
      </View>

      <View style={[styles.stage, { backgroundColor: t.stage }]}>
        <Figure height={104} color={t.onStage} />
        <View style={styles.bars} aria-hidden>
          {HERO_BARS.map((v, i) => (
            <View
              key={i}
              style={[
                styles.bar,
                { height: v * 64, backgroundColor: i < 5 ? t.onStage : i === 5 ? t.stageMuted : t.accent },
              ]}
            />
          ))}
        </View>
        <Figure height={104} color={t.accent} inverted />
      </View>

      <View style={styles.copy}>
        <Txt variant="display" accessibilityRole="header">
          {'Say it.\nFlip it.\nCopy it.'}
        </Txt>
        <Txt variant="muted">Two players, one phone. Copy the backwards sound, then flip it to hear what you really said.</Txt>
      </View>

      {notice === 'consent_declined' && (
        <Notice text="Recording needs your OK first. Tap Start when you're ready to agree." />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stage: {
    marginTop: 8,
    height: 176,
    borderRadius: 28,
    paddingHorizontal: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bars: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 64 },
  bar: { width: 5, borderRadius: 3 },
  copy: { gap: 12, marginTop: 10 },
});
