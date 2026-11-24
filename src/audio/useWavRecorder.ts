import { useAudioStream } from 'expo-audio';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { MAX_RECORDING_MS } from '@/config';

import { setRecordingAudioMode } from './audioMode';
import { deleteFileQuietly } from './deleteFileQuietly';
import { classifyTake, interruptionFor, type AppStateLike, type InterruptReason } from './recordingRules';

export type TakeResult =
  | {
      kind: 'ok';
      uri: string;
      durationMs: number;
      sampleRate: number;
      channels: number;
      encoding: 'int16' | 'float32';
      sizeBytes: number;
      hitMax: boolean;
    }
  | { kind: 'too_short' }
  | { kind: 'interrupted'; reason: InterruptReason };

export type WavRecorderOptions = {
  onFinished: (result: TakeResult) => void;
  maxMs?: number;
  sampleRate?: number;
  channels?: number;
  encoding?: 'int16' | 'float32';
};

type Phase = 'idle' | 'starting' | 'recording' | 'stopping';

const TICK_MS = 250;

/**
 * Records the microphone straight to a WAV file (never AAC/.m4a).
 * One take at a time; auto-stops at `maxMs`; deletes the file on cancel,
 * on unmount mid-take, on too-short takes and on errors.
 */
export function useWavRecorder({
  onFinished,
  maxMs = MAX_RECORDING_MS,
  sampleRate = 48000,
  channels = 1,
  encoding = 'int16',
}: WavRecorderOptions) {
  const { stream, isStreaming } = useAudioStream({ sampleRate, channels, encoding });
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);

  const phase = useRef<Phase>('idle');
  const fileUri = useRef<string | null>(null);
  const startedAt = useRef(0);
  const ticker = useRef<ReturnType<typeof setInterval> | null>(null);
  const mounted = useRef(true);
  const onFinishedRef = useRef(onFinished);
  onFinishedRef.current = onFinished;

  const clearTicker = () => {
    if (ticker.current) clearInterval(ticker.current);
    ticker.current = null;
  };

  const stopStreamQuietly = useCallback(() => {
    try {
      stream.stop();
    } catch {
      // Already stopped or released.
    }
  }, [stream]);

  const settle = useCallback((result: TakeResult | null) => {
    clearTicker();
    phase.current = 'idle';
    fileUri.current = null;
    if (!mounted.current) return;
    setIsRecording(false);
    setElapsedMs(0);
    if (result) onFinishedRef.current(result);
  }, []);

  const fail = useCallback(
    (reason: InterruptReason) => {
      stopStreamQuietly();
      deleteFileQuietly(fileUri.current);
      settle({ kind: 'interrupted', reason });
    },
    [settle, stopStreamQuietly]
  );

  const finish = useCallback(
    async (hitMax: boolean) => {
      if (phase.current !== 'recording') return;
      phase.current = 'stopping';
      clearTicker();
      try {
        const meta = await stream.stopFileRecordingAsync();
        stopStreamQuietly();
        const durationMs = Math.round(meta.duration * 1000);
        if (classifyTake(durationMs) === 'too_short') {
          deleteFileQuietly(meta.uri);
          settle({ kind: 'too_short' });
          return;
        }
        fileUri.current = null; // ownership passes to the caller
        settle({
          kind: 'ok',
          uri: meta.uri,
          durationMs,
          sampleRate: meta.sampleRate,
          channels: meta.channels,
          encoding: meta.encoding,
          sizeBytes: meta.size,
          hitMax,
        });
      } catch {
        fail('error');
      }
    },
    [fail, settle, stopStreamQuietly, stream]
  );

  const start = useCallback(
    async (targetUri?: string) => {
      if (phase.current !== 'idle') return; // ignore double taps
      phase.current = 'starting';
      try {
        await setRecordingAudioMode();
        await stream.start();
        const { uri } = await stream.startFileRecordingAsync(
          targetUri ? { uri: targetUri, format: 'wav' } : { directory: 'cache', format: 'wav' }
        );
        fileUri.current = uri;
        if (!mounted.current) {
          stopStreamQuietly();
          deleteFileQuietly(uri);
          phase.current = 'idle';
          return;
        }
        if (AppState.currentState === 'background') {
          fail('background'); // the app left while the mic was starting
          return;
        }
        phase.current = 'recording';
        startedAt.current = Date.now();
        setIsRecording(true);
        setElapsedMs(0);
        ticker.current = setInterval(() => {
          const elapsed = Date.now() - startedAt.current;
          setElapsedMs(Math.min(elapsed, maxMs));
          if (elapsed >= maxMs) void finish(true);
        }, TICK_MS);
      } catch {
        fail('error');
      }
    },
    [fail, finish, maxMs, stopStreamQuietly, stream]
  );

  const stop = useCallback(() => finish(false), [finish]);

  const cancel = useCallback(async () => {
    if (phase.current === 'idle') return;
    stopStreamQuietly(); // finalises any in-progress file
    deleteFileQuietly(fileUri.current);
    settle(null);
  }, [settle, stopStreamQuietly]);

  // Interruptions: the app leaving the foreground, or the stream stopping by
  // itself (a call or another app taking the mic). The take is always discarded.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (phase.current !== 'recording') return;
      const reason = interruptionFor(next, true);
      if (reason) fail(reason);
    });
    return () => sub.remove();
  }, [fail]);

  useEffect(() => {
    if (phase.current !== 'recording' || isStreaming) return;
    const reason = interruptionFor((AppState.currentState ?? 'active') as AppStateLike, false);
    if (reason) fail(reason);
  }, [isStreaming, fail]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (phase.current !== 'idle') {
        clearTicker();
        stopStreamQuietly();
        deleteFileQuietly(fileUri.current);
        phase.current = 'idle';
        fileUri.current = null;
      }
    };
  }, [stopStreamQuietly]);

  return { isRecording, elapsedMs, start, stop, cancel };
}
