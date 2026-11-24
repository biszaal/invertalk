import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { track } from '@/analytics';
import { deleteFileQuietly } from '@/audio/deleteFileQuietly';
import { ensureMicPermission } from '@/audio/permissions';
import type { InterruptReason } from '@/audio/recordingRules';
import { useWavRecorder, type TakeResult } from '@/audio/useWavRecorder';
import { MAX_RECORDING_MS } from '@/config';
import type { Role } from '@/game/challenge';

import { Button } from './Button';
import { ElapsedTimer } from './ElapsedTimer';
import { Notice } from './Notice';
import { RecordButton } from './RecordButton';

export type OkTake = Extract<TakeResult, { kind: 'ok' }>;

type Props = { role: Role; targetUri: string; onRecorded: (take: OkTake) => void };
type Message = { tone: 'info' | 'error'; text: string; retry?: boolean };

const HIT_MAX_PAUSE_MS = 1200;

const INTERRUPTED: Record<InterruptReason, string> = {
  background: 'Recording stopped because the app was closed. Nothing was saved.',
  call: 'Recording stopped because a call or another app took the microphone. Nothing was saved.',
  error: 'Something went wrong while recording. Nothing was saved.',
};

/** Record/stop control shared by Player 1 and Player 2. One take at a time. */
export function RecordTake({ role, targetUri, onRecorded }: Props) {
  const [message, setMessage] = useState<Message | null>(null);
  const [busy, setBusy] = useState(false);
  const handoff = useRef<{ timer: ReturnType<typeof setTimeout>; uri: string } | null>(null);

  const recorder = useWavRecorder({
    onFinished: (r) => {
      if (r.kind === 'ok') {
        track({
          name: 'recording_completed',
          role,
          duration_ms: r.durationMs,
          sample_rate: r.sampleRate,
          channels: r.channels,
          encoding: r.encoding === 'int16' || r.encoding === 'float32' ? r.encoding : 'other',
        });
        if (r.hitMax) {
          setMessage({ tone: 'info', text: `Stopped at ${MAX_RECORDING_MS / 1000} seconds.` });
          handoff.current = {
            uri: r.uri,
            timer: setTimeout(() => {
              handoff.current = null;
              onRecorded(r);
            }, HIT_MAX_PAUSE_MS),
          };
        } else {
          setMessage(null);
          onRecorded(r);
        }
      } else if (r.kind === 'too_short') {
        setMessage({ tone: 'error', text: 'That was too short. Hold on a little longer and try again.' });
      } else {
        track({ name: 'recording_interrupted', role, reason: r.reason });
        setMessage({ tone: 'error', text: INTERRUPTED[r.reason], retry: true });
      }
    },
  });

  // Leaving during the "Stopped at 20 seconds" pause: the take never reached the session, so delete it.
  useEffect(
    () => () => {
      if (!handoff.current) return;
      clearTimeout(handoff.current.timer);
      deleteFileQuietly(handoff.current.uri);
    },
    []
  );

  const onPress = async () => {
    if (recorder.isRecording) {
      await recorder.stop();
      return;
    }
    setBusy(true);
    try {
      const mic = await ensureMicPermission();
      if (mic.prompted) track({ name: 'permission_result', status: mic.status });
      if (mic.status === 'denied') {
        setMessage(null);
        router.push('/permission-denied');
        return;
      }
      if (mic.status !== 'granted') {
        setMessage({ tone: 'error', text: 'Invertalk needs the microphone to play. Tap Record to allow it.' });
        return;
      }
      setMessage(null);
      await recorder.start(targetUri);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <ElapsedTimer elapsedMs={recorder.elapsedMs} />
      <RecordButton recording={recorder.isRecording} onPress={onPress} disabled={busy} />
      {message && <Notice tone={message.tone} text={message.text} />}
      {message?.retry && (
        <View style={styles.actions}>
          <Button label="Try again" onPress={() => setMessage(null)} />
          <Button label="Cancel" variant="secondary" onPress={() => router.back()} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 16 },
  actions: { gap: 12 },
});
