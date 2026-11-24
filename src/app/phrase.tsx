import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { track } from '@/analytics';
import { CUSTOM_PHRASE_MAX } from '@/config';
import { useChallenge } from '@/game/ChallengeProvider';
import { checkCustomPhrase, STARTER_PHRASES, type Phrase } from '@/game/phrases';
import { Button } from '@/ui/Button';
import { Notice } from '@/ui/Notice';
import { Screen } from '@/ui/Screen';
import { useTheme } from '@/ui/theme';

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
    <Screen title="Pick a phrase">
      <Text style={[styles.hint, { color: t.muted }]}>Player 1 picks. Don't let Player 2 see it.</Text>
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
              style={[
                styles.row,
                { borderColor: selected ? t.accent : t.border, backgroundColor: selected ? t.infoBg : t.surface },
              ]}>
              <Text style={[styles.rowText, { color: t.text }, selected && styles.selectedText]}>{p.text}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.label, { color: t.text }]} nativeID="customLabel">
        Type your own
      </Text>
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
        style={[styles.input, { color: t.text, borderColor: t.border, backgroundColor: t.surface }]}
      />
      {tooLong && <Notice tone="error" text={`Keep it short — ${CUSTOM_PHRASE_MAX} characters or fewer.`} />}

      <Button label="Continue" onPress={onContinue} disabled={!phrase} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hint: { fontSize: 16 },
  list: { gap: 8 },
  row: { minHeight: 52, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, justifyContent: 'center' },
  rowText: { fontSize: 17 },
  selectedText: { fontWeight: '600' },
  label: { fontSize: 17, fontWeight: '600', marginTop: 8 },
  input: { minHeight: 52, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 17 },
});
