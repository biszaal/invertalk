import { Redirect, Stack } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { resetAudioMode, setRecordingAudioMode } from '@/audio/audioMode';
import { deleteUris } from '@/audio/cleanup';
import { audioDir, audioFileUri, expoFileOps } from '@/audio/expoFileOps';
import { AUDIO_DIR, newSessionId, tempFileName, type FileKind } from '@/audio/fileNames';
import { ensureMicPermission } from '@/audio/permissions';
import { ReverseError, reverseWavFile } from '@/audio/reverseFile';
import { useWavRecorder, type TakeResult } from '@/audio/useWavRecorder';
import { MAX_RECORDING_MS } from '@/config';
import { PlayButton } from '@/ui/PlayButton';

type Format = { sampleRate: 48000 | 44100; channels: 1 | 2; encoding: 'int16' | 'float32' };
type Step = { uri: string; ms: number } | { error: string };

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
  const [sessionId] = useState(() => newSessionId());
  const [take, setTake] = useState(0);
  const [result, setResult] = useState<TakeResult | null>(null);
  const [rev, setRev] = useState<Step | null>(null);
  const [rev2, setRev2] = useState<Step | null>(null);
  const [permission, setPermission] = useState<string | null>(null);
  const [listing, setListing] = useState<string[]>([]);
  const owned = useRef<string[]>([]); // every URI this screen created

  const uriFor = (n: number, kind: FileKind) => audioFileUri(tempFileName({ sessionId, role: 'dev', take: n, kind }));

  const refreshListing = useCallback(() => {
    setListing(expoFileOps.list(audioDir().uri).map((f) => f.name));
  }, []);

  const recorder = useWavRecorder({
    ...format,
    onFinished: (r) => {
      setResult(r);
      refreshListing();
    },
  });

  useEffect(() => {
    refreshListing();
    return () => {
      deleteUris(expoFileOps, owned.current);
    };
  }, [refreshListing]);

  const deleteAll = () => {
    deleteUris(expoFileOps, owned.current);
    owned.current = [];
    setResult(null);
    setRev(null);
    setRev2(null);
    refreshListing();
  };

  const onRecordPress = async () => {
    if (recorder.isRecording) {
      await recorder.stop();
      return;
    }
    const mic = await ensureMicPermission();
    setPermission(`${mic.status}${mic.prompted ? ' (prompted)' : ''}`);
    if (mic.status !== 'granted') return;
    deleteAll(); // one take on disk at a time
    const next = take + 1;
    setTake(next);
    const raw = uriFor(next, 'raw');
    owned.current.push(raw, uriFor(next, 'rev'), uriFor(next, 'rev2'));
    await recorder.start(raw);
  };

  const reverse = async (src: string, kind: 'rev' | 'rev2', set: (s: Step) => void) => {
    try {
      const out = await reverseWavFile(src, uriFor(take, kind));
      set({ uri: out.uri, ms: out.elapsedMs });
    } catch (e) {
      set({ error: e instanceof ReverseError ? e.code : 'unexpected' });
    }
    refreshListing();
  };

  const seconds = Math.floor(recorder.elapsedMs / 1000);
  const rawUri = result?.kind === 'ok' ? result.uri : null;
  const revUri = rev && 'uri' in rev ? rev.uri : null;

  return (
    <View style={styles.section}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={recorder.isRecording ? 'Stop recording' : 'Start recording'}
        onPress={onRecordPress}
        style={[styles.record, recorder.isRecording && styles.recording]}>
        <Text style={styles.recordLabel}>{recorder.isRecording ? 'Stop' : 'Record'}</Text>
      </Pressable>
      <Text style={styles.mono}>{`0:${String(seconds).padStart(2, '0')} / 0:${MAX_RECORDING_MS / 1000}`}</Text>
      {permission && <Text style={styles.mono}>mic: {permission}</Text>}
      {result && <ResultInfo result={result} />}

      {rawUri && (
        <>
          <PlayButton uri={rawUri} label="Play take" variant="primary" />
          <Button label="Reverse" onPress={() => reverse(rawUri, 'rev', setRev)} />
          {rev && <StepInfo label="reverse" step={rev} />}
          {revUri && <PlayButton uri={revUri} label="Play reversed" />}
          {revUri && <Button label="Reverse again" onPress={() => reverse(revUri, 'rev2', setRev2)} />}
          {rev2 && <StepInfo label="reverse again" step={rev2} />}
          {rev2 && 'uri' in rev2 && <PlayButton uri={rev2.uri} label="Play double-reversed" />}
        </>
      )}

      <Button label="Delete all" onPress={deleteAll} />
      <Text style={styles.mono}>
        {`files in ${AUDIO_DIR}: ${listing.length}\n${listing.join('\n')}`}
      </Text>
    </View>
  );
}

function StepInfo({ label, step }: { label: string; step: Step }) {
  return (
    <Text style={styles.mono}>{'error' in step ? `${label} failed: ${step.error}` : `${label}: ${step.ms} ms`}</Text>
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

function Button({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.button}>
      <Text style={styles.buttonLabel}>{label}</Text>
    </Pressable>
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
  button: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#888',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: { fontSize: 17, fontWeight: '600' },
  mono: { fontFamily: 'Menlo', fontSize: 13 },
});
