import { useEffect, useRef, useState } from 'react';

import { ReverseError, reverseWavFile } from '@/audio/reverseFile';

import type { Role } from './challenge';
import { useChallenge } from './ChallengeProvider';

export type ReversalState =
  | { status: 'missing' }
  | { status: 'preparing' }
  | { status: 'ready'; revUri: string }
  | { status: 'failed'; code: string };

/**
 * Reverses the current take of `role` once (guarded per recording, so
 * re-renders never start a second reversal) and reports its state.
 */
export function useReversal(role: Role): ReversalState {
  const { state, fileUri, reversed } = useChallenge();
  const take = state[role];
  const rawUri = take?.rawUri ?? null;
  const needsReversal = !!take && !take.revUri;
  const startedFor = useRef<string | null>(null);
  const [failure, setFailure] = useState<{ rawUri: string; code: string } | null>(null);

  useEffect(() => {
    if (!rawUri || !needsReversal || startedFor.current === rawUri) return;
    startedFor.current = rawUri;
    reverseWavFile(rawUri, fileUri(role, 'rev'))
      .then((out) => reversed(role, rawUri, out.uri))
      .catch((e: unknown) => setFailure({ rawUri, code: e instanceof ReverseError ? e.code : 'unexpected' }));
  }, [rawUri, needsReversal, fileUri, reversed, role]);

  if (!take) return { status: 'missing' };
  if (take.revUri) return { status: 'ready', revUri: take.revUri };
  if (failure?.rawUri === take.rawUri) return { status: 'failed', code: failure.code };
  return { status: 'preparing' };
}
