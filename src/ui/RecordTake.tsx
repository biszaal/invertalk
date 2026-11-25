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
import { Txt } from './Txt';

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
  // Once a take for this target is kept, Record stays locked until a retake gives a new target.
  const [doneFor, setDoneFor] = useState<string | null>(null);
  const locked = doneFor === targetUri;
  const handoff = useRef<{ timer: ReturnType<typeof setTimeout>; uri: string } | null>(null);

  const recorder = useWavRecorder({
    onFinished: (r) => {
      if (r.kind === 'ok') {
        setDoneFor(targetUri);
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
    if (locked) return;
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
        setMessage({ tone: 'error', text: 'Invertalk needs the microphone to play. Tap the record button to allow it.' });
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
      <View style={styles.control}>
        <RecordButton recording={recorder.isRecording} onPress={onPress} disabled={busy || locked} />
        <Txt variant="muted">{recorder.isRecording ? 'Tap to stop' : locked ? 'Got it' : 'Tap to record'}</Txt>
      </View>
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
  wrap: { gap: 22 },
  control: { alignItems: 'center', gap: 14 },
  actions: { gap: 10 },
});
