import { Redirect, Stack } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { resetAudioMode, setRecordingAudioMode } from '@/audio/audioMode';
import { deleteFileQuietly } from '@/audio/deleteFileQuietly';
import { ensureMicPermission } from '@/audio/permissions';
import { useWavRecorder, type TakeResult } from '@/audio/useWavRecorder';
import { MAX_RECORDING_MS } from '@/config';
import { PlayButton } from '@/ui/PlayButton';

type Format = { sampleRate: 48000 | 44100; channels: 1 | 2; encoding: 'int16' | 'float32' };

/** Development-only audio test bench. Removed before any store build (plan Task 20). */
export default function DevAudioScreen() {
  if (!__DEV__) return <Redirect href="/" />;
  return <DevAudio />;
}

function DevAudio() {
  const [format, setFormat] = useState<Format>({ sampleRate: 48000, channels: 1, encoding: 'int16' });

  useEffect(() => {
    void setRecordingAudioMode();
    return () => {
      void resetAudioMode();
    };
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: 'Audio test (dev)' }} />
      <Choice
        label="Sample rate"
        options={[48000, 44100] as const}
        value={format.sampleRate}
        onChange={(sampleRate) => setFormat({ ...format, sampleRate })}
      />
      <Choice
        label="Channels"
        options={[1, 2] as const}
        value={format.channels}
        onChange={(channels) => setFormat({ ...format, channels })}
      />
      <Choice
        label="Encoding"
        options={['int16', 'float32'] as const}
        value={format.encoding}
        onChange={(encoding) => setFormat({ ...format, encoding })}
      />
      <Recorder key={`${format.sampleRate}-${format.channels}-${format.encoding}`} format={format} />
    </ScrollView>
  );
}

function Recorder({ format }: { format: Format }) {
  const [result, setResult] = useState<TakeResult | null>(null);
  const [permission, setPermission] = useState<string | null>(null);
  const lastUri = useRef<string | null>(null);
  const recorder = useWavRecorder({
    ...format,
    onFinished: (r) => {
      if (r.kind === 'ok') lastUri.current = r.uri;
      setResult(r);
    },
  });

  useEffect(
    () => () => {
      deleteFileQuietly(lastUri.current);
    },
    []
  );

  const onRecordPress = async () => {
    if (recorder.isRecording) {
      await recorder.stop();
      return;
    }
    const mic = await ensureMicPermission();
    setPermission(`${mic.status}${mic.prompted ? ' (prompted)' : ''}`);
    if (mic.status !== 'granted') return;
    deleteFileQuietly(lastUri.current); // one take on disk at a time
    lastUri.current = null;
    setResult(null);
    await recorder.start();
  };

  const seconds = Math.floor(recorder.elapsedMs / 1000);

  return (
    <View style={styles.section}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={recorder.isRecording ? 'Stop recording' : 'Start recording'}
        onPress={onRecordPress}
        style={[styles.record, recorder.isRecording && styles.recording]}>
        <Text style={styles.recordLabel}>{recorder.isRecording ? 'Stop' : 'Record'}</Text>
      </Pressable>
      <Text style={styles.mono}>
        {`0:${String(seconds).padStart(2, '0')} / 0:${MAX_RECORDING_MS / 1000}`}
      </Text>
      {permission && <Text style={styles.mono}>mic: {permission}</Text>}
      {result && <ResultInfo result={result} />}
      {result?.kind === 'ok' && <PlayButton uri={result.uri} label="Play take" variant="primary" />}
    </View>
  );
}

function ResultInfo({ result }: { result: TakeResult }) {
  if (result.kind !== 'ok') return <Text style={styles.mono}>result: {JSON.stringify(result)}</Text>;
  const ext = result.uri.split('.').pop();
  return (
    <Text style={styles.mono}>
      {[
        `file type: .${ext}`,
        `duration: ${result.durationMs} ms${result.hitMax ? ' (auto-stopped at cap)' : ''}`,
        `size: ${result.sizeBytes} bytes`,
        `sampleRate: ${result.sampleRate}`,
        `channels: ${result.channels}`,
        `encoding: ${result.encoding}`,
      ].join('\n')}
    </Text>
  );
}

function Choice<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.choice}>
      <Text style={styles.choiceLabel}>{label}</Text>
      <View style={styles.row}>
        {options.map((o) => (
          <Pressable
            key={String(o)}
            accessibilityRole="radio"
            accessibilityState={{ selected: o === value }}
            onPress={() => onChange(o)}
            style={[styles.pill, o === value && styles.pillOn]}>
            <Text style={o === value ? styles.pillOnLabel : undefined}>{String(o)}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 16 },
  section: { gap: 12, marginTop: 8 },
  choice: { gap: 6 },
  choiceLabel: { fontWeight: '600' },
  row: { flexDirection: 'row', gap: 8 },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#888' },
  pillOn: { backgroundColor: '#2F5BD3', borderColor: '#2F5BD3' },
  pillOnLabel: { color: '#FFFFFF' },
  record: {
    minHeight: 64,
    borderRadius: 32,
    backgroundColor: '#C62828',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recording: { backgroundColor: '#555555' },
  recordLabel: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  mono: { fontFamily: 'Menlo', fontSize: 13 },
});
