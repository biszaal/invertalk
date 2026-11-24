import { tempFileName } from '@/audio/fileNames';

import type { Phrase } from './phrases';

export type Role = 'prompt' | 'imitation';
export type Take = { rawUri: string; revUri: string | null; durationMs: number };

export type ChallengeState = {
  sessionId: string | null;
  phrase: Phrase | null;
  /** Take numbers only go up within a session, so a new take never reuses a file name. */
  promptTake: number;
  imitationTake: number;
  prompt: Take | null;
  imitation: Take | null;
  startedAt: number | null;
};

export type ChallengeAction =
  | { type: 'start'; sessionId: string; phrase: Phrase; now: number }
  | { type: 'recorded'; role: Role; rawUri: string; durationMs: number }
  /** `rawUri` names the take that was reversed; a stale result (take gone or replaced) is dropped. */
  | { type: 'reversed'; role: Role; rawUri: string; revUri: string }
  | { type: 'rerecordPrompt' }
  | { type: 'retryImitation' }
  | { type: 'reset' };

export const initialChallengeState: ChallengeState = {
  sessionId: null,
  phrase: null,
  promptTake: 1,
  imitationTake: 1,
  prompt: null,
  imitation: null,
  startedAt: null,
};

export function challengeReducer(s: ChallengeState, a: ChallengeAction): ChallengeState {
  switch (a.type) {
    case 'start':
      return { ...initialChallengeState, sessionId: a.sessionId, phrase: a.phrase, startedAt: a.now };
    case 'recorded':
      return { ...s, [a.role]: { rawUri: a.rawUri, revUri: null, durationMs: a.durationMs } };
    case 'reversed': {
      const take = s[a.role];
      return take?.rawUri === a.rawUri ? { ...s, [a.role]: { ...take, revUri: a.revUri } } : s;
    }
    case 'rerecordPrompt':
      return {
        ...s,
        prompt: null,
        imitation: null,
        promptTake: s.promptTake + 1,
        imitationTake: s.imitationTake + 1,
      };
    case 'retryImitation':
      return { ...s, imitation: null, imitationTake: s.imitationTake + 1 };
    case 'reset':
      return initialChallengeState;
  }
}

/** Files that applying `a` to `s` makes obsolete; the caller deletes them. */
export function releasedUris(s: ChallengeState, a: ChallengeAction): string[] {
  switch (a.type) {
    case 'start':
    case 'reset':
    case 'rerecordPrompt':
      return [...uris(s.prompt), ...uris(s.imitation)];
    case 'retryImitation':
      return uris(s.imitation);
    case 'recorded':
      return uris(s[a.role]).filter((u) => u !== a.rawUri);
    case 'reversed': {
      const take = s[a.role];
      if (take?.rawUri !== a.rawUri) return [a.revUri]; // stale: nobody will use this file
      return take.revUri && take.revUri !== a.revUri ? [take.revUri] : [];
    }
  }
}

/** File name for the current take of `role` in this session. */
export function takeFileName(s: ChallengeState, role: Role, kind: 'raw' | 'rev'): string {
  if (!s.sessionId) throw new Error('takeFileName called without an active session');
  const take = role === 'prompt' ? s.promptTake : s.imitationTake;
  return tempFileName({ sessionId: s.sessionId, role, take, kind });
}

function uris(take: Take | null): string[] {
  return take ? [take.rawUri, ...(take.revUri ? [take.revUri] : [])] : [];
}
