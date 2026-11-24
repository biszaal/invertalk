import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { deleteFileQuietly } from '@/audio/deleteFileQuietly';
import { ensureMicPermission } from '@/audio/permissions';
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

/** Record/stop control shared by Player 1 and Player 2. One take at a time. */
export function RecordTake({ targetUri, onRecorded }: Props) {
  const [message, setMessage] = useState<Message | null>(null);
  const [busy, setBusy] = useState(false);
  const handoff = useRef<{ timer: ReturnType<typeof setTimeout>; uri: string } | null>(null);

  const recorder = useWavRecorder({
    onFinished: (r) => {
      if (r.kind === 'ok') {
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
        setMessage({ tone: 'error', text: 'Something went wrong while recording. Nothing was saved.', retry: true });
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
      if (mic.status !== 'granted') {
        setMessage({ tone: 'error', text: 'Microphone access is off. Turn it on in Settings to play.' });
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
      {message?.retry && <Button label="Try again" variant="secondary" onPress={() => setMessage(null)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 16 },
});
