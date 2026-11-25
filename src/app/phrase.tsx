import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { track } from '@/analytics';
import { CUSTOM_PHRASE_MAX } from '@/config';
import { useChallenge } from '@/game/ChallengeProvider';
import { checkCustomPhrase, STARTER_PHRASES, type Phrase } from '@/game/phrases';
import { Button } from '@/ui/Button';
import { Notice } from '@/ui/Notice';
import { Screen } from '@/ui/Screen';
import { Txt } from '@/ui/Txt';
import { fonts, useTheme } from '@/ui/theme';

export default function PhraseScreen() {
  const t = useTheme();
  const { start } = useChallenge();
  const [presetId, setPresetId] = useState<string | null>(null);
  const [custom, setCustom] = useState('');

  const check = checkCustomPhrase(custom);
  const preset = STARTER_PHRASES.find((p) => p.id === presetId) ?? null;
  const phrase: Phrase | null = preset
    ? { source: 'preset', id: preset.id, text: preset.text }
    : check.ok
      ? { source: 'custom', text: check.text }
      : null;
  const tooLong = !preset && !check.ok && check.reason === 'too_long';

  const onContinue = () => {
    if (!phrase) return;
    track(
      phrase.source === 'preset'
        ? { name: 'challenge_started', phrase_source: 'preset', phrase_id: phrase.id }
        : { name: 'challenge_started', phrase_source: 'custom' }
    );
    start(phrase);
    router.push('/record');
  };

  return (
    <Screen
      eyebrow="Player 1"
      title="Pick a phrase."
      footer={<Button label="Continue" icon="arrow-right" onPress={onContinue} disabled={!phrase} />}>
      <Txt variant="muted">Don&apos;t let Player 2 see it.</Txt>
      <View accessibilityRole="radiogroup" style={styles.list}>
        {STARTER_PHRASES.map((p) => {
          const selected = p.id === presetId;
          return (
            <Pressable
              key={p.id}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => {
                setPresetId(p.id);
                setCustom('');
              }}
              style={({ pressed }) => [
                styles.row,
                {
                  borderColor: selected ? t.accent : t.border,
                  backgroundColor: selected ? t.selectedBg : t.surface,
                  borderWidth: selected ? 2 : 1,
                },
                pressed && styles.pressed,
              ]}>
              <Txt variant={selected ? 'label' : 'body'} style={styles.rowText}>
                {p.text}
              </Txt>
              {selected ? <Feather name="check" size={18} color={t.text} /> : null}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.custom}>
        <Txt variant="eyebrow" nativeID="customLabel">
          Or type your own
        </Txt>
        <TextInput
          accessibilityLabelledBy="customLabel"
          accessibilityLabel="Type your own phrase"
          value={custom}
          onChangeText={(text) => {
            setCustom(text);
            if (text) setPresetId(null);
          }}
          placeholder="A short line you can say in a few seconds"
          placeholderTextColor={t.muted}
          maxLength={CUSTOM_PHRASE_MAX + 20}
          autoCorrect
          returnKeyType="done"
          style={[
            styles.input,
            { color: t.text, borderColor: check.ok && !preset ? t.accent : t.border, backgroundColor: t.surface },
          ]}
        />
        {tooLong && <Notice tone="error" text={`Keep it short — ${CUSTOM_PHRASE_MAX} characters or fewer.`} />}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: 8 },
  row: { minHeight: 56, paddingHorizontal: 18, paddingVertical: 14, borderRadius: 18, flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowText: { flex: 1 },
  pressed: { transform: [{ scale: 0.99 }] },
  custom: { gap: 10, marginTop: 6 },
  input: { minHeight: 56, borderWidth: 1.5, borderRadius: 18, paddingHorizontal: 18, paddingVertical: 14, fontSize: 17, fontFamily: fonts.regular },
});
