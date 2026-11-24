import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';

import { resetAudioMode } from '@/audio/audioMode';
import { deleteUris } from '@/audio/cleanup';
import { audioFileUri, expoFileOps } from '@/audio/expoFileOps';
import { newSessionId } from '@/audio/fileNames';

import {
  challengeReducer,
  initialChallengeState,
  releasedUris,
  takeFileName,
  type ChallengeAction,
  type ChallengeState,
  type Role,
} from './challenge';
import type { Phrase } from './phrases';

export type ChallengeApi = {
  state: ChallengeState;
  start(phrase: Phrase): void;
  fileUri(role: Role, kind: 'raw' | 'rev'): string;
  recorded(role: Role, rawUri: string, durationMs: number): void;
  reversed(role: Role, revUri: string): void;
  rerecordPrompt(): void;
  retryImitation(): void;
  endSession(): void;
};

const ChallengeContext = createContext<ChallengeApi | null>(null);

/** Owns the session; every change deletes the files it makes obsolete before applying. */
export function ChallengeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ChallengeState>(initialChallengeState);
  const latest = useRef<ChallengeState>(initialChallengeState);

  const apply = useCallback((action: ChallengeAction) => {
    const current = latest.current;
    deleteUris(expoFileOps, releasedUris(current, action));
    const next = challengeReducer(current, action);
    latest.current = next;
    setState(next);
  }, []);

  const fileUri = useCallback(
    (role: Role, kind: 'raw' | 'rev') => audioFileUri(takeFileName(state, role, kind)),
    [state]
  );

  const api = useMemo<ChallengeApi>(
    () => ({
      state,
      fileUri,
      start: (phrase) => apply({ type: 'start', sessionId: newSessionId(), phrase, now: Date.now() }),
      recorded: (role, rawUri, durationMs) => apply({ type: 'recorded', role, rawUri, durationMs }),
      reversed: (role, revUri) => apply({ type: 'reversed', role, revUri }),
      rerecordPrompt: () => apply({ type: 'rerecordPrompt' }),
      retryImitation: () => apply({ type: 'retryImitation' }),
      endSession: () => {
        apply({ type: 'reset' });
        void resetAudioMode().catch(() => {});
      },
    }),
    [apply, fileUri, state]
  );

  return <ChallengeContext.Provider value={api}>{children}</ChallengeContext.Provider>;
}

export function useChallenge(): ChallengeApi {
  const api = useContext(ChallengeContext);
  if (!api) throw new Error('useChallenge must be used inside ChallengeProvider');
  return api;
}
